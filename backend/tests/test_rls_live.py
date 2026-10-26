import os
import json
import pytest
from uuid import UUID
from dotenv import load_dotenv
import psycopg

# Load .env
load_dotenv(".env")

DATABASE_URL = os.getenv("DATABASE_URL")
RUN_LIVE_TESTS = bool(DATABASE_URL and "your_project_ref" not in DATABASE_URL)

pytestmark = pytest.mark.skipif(
    not RUN_LIVE_TESTS,
    reason="Live PostgreSQL tests require valid DATABASE_URL in backend/.env",
)

# Synthetic UUIDs matching supabase/seed.sql
ALEX_ID = UUID("11111111-1111-1111-1111-111111111111")
JORDAN_ID = UUID("22222222-2222-2222-2222-222222222222")
ELENA_ID = UUID("66666666-6666-6666-6666-666666666666")
MARCUS_ID = UUID("77777777-7777-7777-7777-777777777777")
APEX_COMPANY_ID = UUID("eeeeeeee-0001-0000-0000-000000000001")
VERITAS_COMPANY_ID = UUID("eeeeeeee-0002-0000-0000-000000000002")


@pytest.fixture(scope="module")
def db_conn():
    """Shared database connection for live test session."""
    conn = psycopg.connect(DATABASE_URL, autocommit=False)
    yield conn
    conn.close()


def as_user(conn: psycopg.Connection, user_id: UUID):
    """
    Sets transaction-local identity to the 'authenticated' Supabase role
    matching the method Supabase's auth.uid() uses to read JWT claims.
    """
    with conn.cursor() as cur:
        claims = json.dumps({"sub": str(user_id), "role": "authenticated"})
        cur.execute("SET LOCAL ROLE authenticated;")
        cur.execute("SELECT set_config('request.jwt.claim.sub', %s, true);", (str(user_id),))
        cur.execute("SELECT set_config('request.jwt.claim.role', 'authenticated', true);")
        cur.execute("SELECT set_config('request.jwt.claims', %s, true);", (claims,))


# --------------------------------------------------------------------------
# 1. VERIFY ALL TABLES IN PUBLIC SCHEMA HAVE RLS ENABLED
# --------------------------------------------------------------------------
def test_all_public_tables_have_rls_enabled(db_conn):
    """Fails if any table in the public schema has row-level security disabled."""
    with db_conn.cursor() as cur:
        cur.execute("""
            SELECT tablename, rowsecurity
            FROM pg_tables
            WHERE schemaname = 'public'
            ORDER BY tablename;
        """)
        tables = cur.fetchall()

    assert len(tables) > 0, "No tables found in public schema."
    unprotected = [t[0] for t in tables if not t[1]]
    assert len(unprotected) == 0, f"The following tables have RLS disabled: {unprotected}"


# --------------------------------------------------------------------------
# 2. USER DOCUMENTS RLS: STRICT OWNER PRIVATE STORAGE ISOLATION
# --------------------------------------------------------------------------
def test_user_documents_rls_isolation(db_conn):
    doc_id = UUID("90000000-0001-0000-0000-000000000001")

    # 1. User A (Alex) connects -> Inserts & reads own document
    as_user(db_conn, ALEX_ID)
    with db_conn.cursor() as cur:
        cur.execute("""
            INSERT INTO user_documents (id, profile_id, document_name, storage_path, document_type, file_size_bytes)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) DO NOTHING;
        """, (doc_id, ALEX_ID, "alex_secret_records.pdf", "secure/alex.pdf", "tax_form", 50000))

        cur.execute("SELECT id, document_name FROM user_documents WHERE id = %s;", (doc_id,))
        alex_row = cur.fetchone()
        assert alex_row is not None
        assert alex_row[1] == "alex_secret_records.pdf"
    db_conn.commit()

    # 2. User B (Jordan) connects -> CANNOT read or update Alex's document
    as_user(db_conn, JORDAN_ID)
    with db_conn.cursor() as cur:
        cur.execute("SELECT id FROM user_documents WHERE id = %s;", (doc_id,))
        assert cur.fetchone() is None, "RLS Breach: Jordan was able to read Alex's private document!"

        cur.execute("UPDATE user_documents SET document_name = 'hacked.pdf' WHERE id = %s;", (doc_id,))
        assert cur.rowcount == 0, "RLS Breach: Jordan was able to update Alex's private document!"
    db_conn.commit()


# --------------------------------------------------------------------------
# 3. APPLICATIONS RLS: CANDIDATE & EMPLOYER ISOLATION
# --------------------------------------------------------------------------
def test_applications_rls_isolation(db_conn):
    alex_app_id = UUID("20000000-0001-0000-0000-000000000001")
    jordan_app_id = UUID("20000000-0002-0000-0000-000000000002")

    # 1. Candidate Alex: sees own application, CANNOT see Jordan's
    as_user(db_conn, ALEX_ID)
    with db_conn.cursor() as cur:
        cur.execute("SELECT id FROM applications WHERE id = %s;", (alex_app_id,))
        assert cur.fetchone() is not None, "Alex should see own application."

        cur.execute("SELECT id FROM applications WHERE id = %s;", (jordan_app_id,))
        assert cur.fetchone() is None, "RLS Breach: Alex saw Jordan's application!"
    db_conn.commit()

    # 2. Candidate Jordan: sees own application, CANNOT see Alex's
    as_user(db_conn, JORDAN_ID)
    with db_conn.cursor() as cur:
        cur.execute("SELECT id FROM applications WHERE id = %s;", (jordan_app_id,))
        assert cur.fetchone() is not None, "Jordan should see own application."

        cur.execute("SELECT id FROM applications WHERE id = %s;", (alex_app_id,))
        assert cur.fetchone() is None, "RLS Breach: Jordan saw Alex's application!"
    db_conn.commit()

    # 3. Employer Elena (Apex): sees Alex's application to Apex, CANNOT see Jordan's to Veritas
    as_user(db_conn, ELENA_ID)
    with db_conn.cursor() as cur:
        cur.execute("SELECT id FROM applications WHERE id = %s;", (alex_app_id,))
        assert cur.fetchone() is not None, "Elena (Apex) should see application submitted to Apex."

        cur.execute("SELECT id FROM applications WHERE id = %s;", (jordan_app_id,))
        assert cur.fetchone() is None, "RLS Breach: Elena saw application to another company!"
    db_conn.commit()

    # 4. Employer Marcus (Veritas): sees Jordan's application, CANNOT see Alex's to Apex
    as_user(db_conn, MARCUS_ID)
    with db_conn.cursor() as cur:
        cur.execute("SELECT id FROM applications WHERE id = %s;", (jordan_app_id,))
        assert cur.fetchone() is not None, "Marcus should see Jordan's application to Veritas."

        cur.execute("SELECT id FROM applications WHERE id = %s;", (alex_app_id,))
        assert cur.fetchone() is None, "RLS Breach: Marcus saw application to another company!"
    db_conn.commit()


# --------------------------------------------------------------------------
# 4. EVIDENCE ITEMS: VISIBILITY & STATUS INTEGRITY
# --------------------------------------------------------------------------
def test_evidence_items_rls_and_status_integrity(db_conn):
    alex_evidence_id = UUID("dddddddd-0001-0000-0000-000000000001")

    # 1. Alex CAN read own evidence
    as_user(db_conn, ALEX_ID)
    with db_conn.cursor() as cur:
        cur.execute("SELECT id, status FROM evidence_items WHERE id = %s;", (alex_evidence_id,))
        assert cur.fetchone() is not None
    db_conn.commit()

    # 2. Jordan (unrelated candidate) CANNOT read Alex's application-only evidence
    as_user(db_conn, JORDAN_ID)
    with db_conn.cursor() as cur:
        cur.execute("SELECT id FROM evidence_items WHERE id = %s;", (alex_evidence_id,))
        assert cur.fetchone() is None, "RLS Breach: Jordan saw application-only evidence without an application!"
    db_conn.commit()

    # 3. Elena (Apex employer) CAN read it because Alex has an active application to Apex
    as_user(db_conn, ELENA_ID)
    with db_conn.cursor() as cur:
        cur.execute("SELECT id FROM evidence_items WHERE id = %s;", (alex_evidence_id,))
        assert cur.fetchone() is not None, "Employer with active application should see candidate evidence."
    db_conn.commit()

    # 4. Tamper Prevention: Candidate Alex CANNOT self-assign 'evidence_reviewed'
    as_user(db_conn, ALEX_ID)
    with db_conn.cursor() as cur:
        with pytest.raises(psycopg.errors.RaiseException) as exc_info:
            cur.execute("""
                UPDATE evidence_items
                SET status = 'evidence_reviewed'
                WHERE id = %s;
            """, (alex_evidence_id,))
        assert "Candidates cannot self-assign" in str(exc_info.value)
    db_conn.rollback()


# --------------------------------------------------------------------------
# 5. PROFILES & COMPANY MANAGEMENT RLS
# --------------------------------------------------------------------------
def test_profiles_and_companies_rls(db_conn):
    # 1. Alex can update own profile
    as_user(db_conn, ALEX_ID)
    with db_conn.cursor() as cur:
        cur.execute("UPDATE profiles SET headline = 'Verified Developer' WHERE id = %s;", (ALEX_ID,))
        assert cur.rowcount == 1
    db_conn.commit()

    # 2. Jordan CANNOT update Alex's profile (0 rows affected by RLS)
    as_user(db_conn, JORDAN_ID)
    with db_conn.cursor() as cur:
        cur.execute("UPDATE profiles SET headline = 'Hacked' WHERE id = %s;", (ALEX_ID,))
        assert cur.rowcount == 0, "RLS Breach: Jordan was able to update Alex's profile!"
    db_conn.commit()

    # 3. Elena (Apex Owner) CAN update Apex company details
    as_user(db_conn, ELENA_ID)
    with db_conn.cursor() as cur:
        cur.execute("UPDATE companies SET description = 'Updated Apex Studio' WHERE id = %s;", (APEX_COMPANY_ID,))
        assert cur.rowcount == 1
    db_conn.commit()

    # 4. Jordan (candidate) CANNOT update company details
    as_user(db_conn, JORDAN_ID)
    with db_conn.cursor() as cur:
        cur.execute("UPDATE companies SET description = 'Malicious Update' WHERE id = %s;", (APEX_COMPANY_ID,))
        assert cur.rowcount == 0, "RLS Breach: Non-owner was able to update company details!"
    db_conn.commit()
