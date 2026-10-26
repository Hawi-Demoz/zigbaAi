import os
import json
from contextlib import contextmanager
from typing import Generator
from uuid import UUID
from dotenv import load_dotenv
import psycopg

# Load environment variables from backend/.env if present
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")


def get_db_url() -> str:
    """Return database URL or raise error if missing."""
    url = os.getenv("DATABASE_URL")
    if not url:
        raise RuntimeError(
            "DATABASE_URL is not set. Please set it in backend/.env to connect to your Supabase PostgreSQL instance."
        )
    return url


@contextmanager
def get_admin_connection() -> Generator[psycopg.Connection, None, None]:
    """
    Connect as the database superuser/admin.
    WARNING: This bypasses Row Level Security (RLS).
    Use ONLY for system maintenance, migration verification, and test setup.
    """
    conn = psycopg.connect(get_db_url(), autocommit=False)
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


@contextmanager
def get_user_scoped_connection(user_id: UUID) -> Generator[psycopg.Connection, None, None]:
    """
    Connect to PostgreSQL with Row Level Security (RLS) strictly enforced for user_id.

    Current Supabase Method:
    Supabase's auth.uid() function reads the JWT claims stored in PostgreSQL session configs:
      1. 'request.jwt.claim.sub' (direct subject string)
      2. 'request.jwt.claims' (full JSON object with 'sub' and 'role')
    
    By executing:
      SET LOCAL ROLE authenticated;
      SET LOCAL "request.jwt.claim.sub" = '<user_id>';
      SET LOCAL "request.jwt.claim.role" = 'authenticated';
      SET LOCAL "request.jwt.claims" = '{"sub": "<user_id>", "role": "authenticated"}';
    within a transaction block, PostgreSQL treats all subsequent queries in this session
    as originating from the authenticated user. Any query attempting to access another user's
    rows is blocked by PostgreSQL's RLS engine.
    """
    conn = psycopg.connect(get_db_url(), autocommit=False)
    try:
        with conn.cursor() as cur:
            claims_json = json.dumps({"sub": str(user_id), "role": "authenticated"})
            # 1. Switch session role to 'authenticated' (standard Supabase logged-in user)
            cur.execute("SET LOCAL ROLE authenticated;")
            # 2. Set request config variables that auth.uid() reads
            cur.execute("SELECT set_config('request.jwt.claim.sub', %s, true);", (str(user_id),))
            cur.execute("SELECT set_config('request.jwt.claim.role', 'authenticated', true);")
            cur.execute("SELECT set_config('request.jwt.claims', %s, true);", (claims_json,))

        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
