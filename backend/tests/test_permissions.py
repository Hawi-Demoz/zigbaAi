from uuid import UUID
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

# Test User UUIDs from Phase 1 synthetic seed
ALEX_CANDIDATE_ID = "11111111-1111-1111-1111-111111111111"
JORDAN_CANDIDATE_ID = "22222222-2222-2222-2222-222222222222"
ELENA_EMPLOYER_APEX_ID = "66666666-6666-6666-6666-666666666666"
MARCUS_EMPLOYER_VERITAS_ID = "77777777-7777-7777-7777-777777777777"

ALEX_DOC_ID = "90000000-0001-0000-0000-000000000001"
JORDAN_DOC_ID = "90000000-0002-0000-0000-000000000002"
ALEX_EVIDENCE_ID = "dddddddd-0001-0000-0000-000000000001"
ALEX_APPLICATION_APEX_ID = "20000000-0001-0000-0000-000000000001"
JORDAN_APPLICATION_VERITAS_ID = "20000000-0002-0000-0000-000000000002"


# --------------------------------------------------------------------------
# 1. USER A CANNOT READ USER B'S PRIVATE DOCUMENTS
# --------------------------------------------------------------------------
def test_user_cannot_read_another_users_private_document():
    # Jordan tries to read Alex's private document
    response = client.get(
        f"/documents/{ALEX_DOC_ID}",
        headers={"X-User-Id": JORDAN_CANDIDATE_ID},
    )
    assert response.status_code == 403
    assert "Private documents are accessible only by the owner" in response.json()["detail"]

    # Alex reads their own document
    owner_response = client.get(
        f"/documents/{ALEX_DOC_ID}",
        headers={"X-User-Id": ALEX_CANDIDATE_ID},
    )
    assert owner_response.status_code == 200
    assert owner_response.json()["document_name"] == "alex_private_tax_transcript.pdf"


# --------------------------------------------------------------------------
# 2. USER A CANNOT EDIT USER B'S PROFILE
# --------------------------------------------------------------------------
def test_user_cannot_edit_another_users_profile():
    # Jordan tries to edit Alex's profile headline
    response = client.patch(
        f"/profiles/{ALEX_CANDIDATE_ID}",
        headers={"X-User-Id": JORDAN_CANDIDATE_ID},
        json={"headline": "Maliciously Modified Headline"},
    )
    assert response.status_code == 403
    assert "Users can only modify their own profile" in response.json()["detail"]

    # Alex edits their own profile
    valid_response = client.patch(
        f"/profiles/{ALEX_CANDIDATE_ID}",
        headers={"X-User-Id": ALEX_CANDIDATE_ID},
        json={"headline": "Updated Legitimate Headline"},
    )
    assert valid_response.status_code == 200
    assert valid_response.json()["headline"] == "Updated Legitimate Headline"


# --------------------------------------------------------------------------
# 3. USER A CANNOT EDIT USER B'S EVIDENCE
# --------------------------------------------------------------------------
def test_user_cannot_edit_another_users_evidence():
    # Jordan tries to edit Alex's evidence item
    response = client.patch(
        f"/evidence/{ALEX_EVIDENCE_ID}",
        headers={"X-User-Id": JORDAN_CANDIDATE_ID},
        json={"title": "Unauthorized Title Change"},
    )
    assert response.status_code == 403
    assert "You cannot edit evidence belonging to another user" in response.json()["detail"]


# --------------------------------------------------------------------------
# 4. CANDIDATES CANNOT SELF-ASSIGN 'evidence_reviewed' OR 'independently_confirmed'
# --------------------------------------------------------------------------
def test_candidate_cannot_self_assign_reviewed_status():
    # Alex tries to elevate their own evidence to 'evidence_reviewed'
    reviewed_attempt = client.patch(
        f"/evidence/{ALEX_EVIDENCE_ID}",
        headers={"X-User-Id": ALEX_CANDIDATE_ID},
        json={"status": "evidence_reviewed"},
    )
    assert reviewed_attempt.status_code == 403
    assert "Candidates cannot self-assign status 'evidence_reviewed'" in reviewed_attempt.json()["detail"]

    # Alex tries to elevate their own evidence to 'independently_confirmed'
    confirmed_attempt = client.patch(
        f"/evidence/{ALEX_EVIDENCE_ID}",
        headers={"X-User-Id": ALEX_CANDIDATE_ID},
        json={"status": "independently_confirmed"},
    )
    assert confirmed_attempt.status_code == 403
    assert "Candidates cannot self-assign status 'independently_confirmed'" in confirmed_attempt.json()["detail"]

    # Alex can legitimately update allowed fields with 'evidence_submitted'
    legit_attempt = client.patch(
        f"/evidence/{ALEX_EVIDENCE_ID}",
        headers={"X-User-Id": ALEX_CANDIDATE_ID},
        json={"title": "Updated Evidence Title", "status": "evidence_submitted"},
    )
    assert legit_attempt.status_code == 200
    assert legit_attempt.json()["title"] == "Updated Evidence Title"


# --------------------------------------------------------------------------
# 5. CANDIDATES SEE ONLY THEIR OWN APPLICATIONS
# --------------------------------------------------------------------------
def test_candidates_cannot_view_other_candidate_applications():
    # Jordan tries to view Alex's application to Apex
    forbidden_response = client.get(
        f"/applications/{ALEX_APPLICATION_APEX_ID}",
        headers={"X-User-Id": JORDAN_CANDIDATE_ID},
    )
    assert forbidden_response.status_code == 403
    assert "Access denied: You do not have permission" in forbidden_response.json()["detail"]

    # Alex can view their own application
    authorized_response = client.get(
        f"/applications/{ALEX_APPLICATION_APEX_ID}",
        headers={"X-User-Id": ALEX_CANDIDATE_ID},
    )
    assert authorized_response.status_code == 200
    assert authorized_response.json()["id"] == ALEX_APPLICATION_APEX_ID


# --------------------------------------------------------------------------
# 6. EMPLOYERS SEE ONLY THEIR OWN COMPANY'S APPLICATIONS
# --------------------------------------------------------------------------
def test_employers_see_only_their_company_applications():
    # Elena (Apex Software Labs) CAN view Alex's application submitted to Apex
    elena_view_apex = client.get(
        f"/applications/{ALEX_APPLICATION_APEX_ID}",
        headers={"X-User-Id": ELENA_EMPLOYER_APEX_ID},
    )
    assert elena_view_apex.status_code == 200

    # Elena (Apex Software Labs) CANNOT view Jordan's application submitted to Veritas Cloud
    elena_view_veritas = client.get(
        f"/applications/{JORDAN_APPLICATION_VERITAS_ID}",
        headers={"X-User-Id": ELENA_EMPLOYER_APEX_ID},
    )
    assert elena_view_veritas.status_code == 403

    # Marcus (Veritas Cloud) CANNOT view Alex's application submitted to Apex
    marcus_view_apex = client.get(
        f"/applications/{ALEX_APPLICATION_APEX_ID}",
        headers={"X-User-Id": MARCUS_EMPLOYER_VERITAS_ID},
    )
    assert marcus_view_apex.status_code == 403


# --------------------------------------------------------------------------
# 7. CANDIDATE CANNOT CHANGE APPLICATION HIRING STATUS
# --------------------------------------------------------------------------
def test_candidate_cannot_change_application_status():
    # Alex tries to mark their own application as 'accepted'
    unauthorized_change = client.patch(
        f"/applications/{ALEX_APPLICATION_APEX_ID}/status?new_status=accepted",
        headers={"X-User-Id": ALEX_CANDIDATE_ID},
    )
    assert unauthorized_change.status_code == 403
    assert "Only authorized company members can update application status" in unauthorized_change.json()["detail"]

    # Elena (Apex employer) legitimately updates status to 'interviewing'
    authorized_change = client.patch(
        f"/applications/{ALEX_APPLICATION_APEX_ID}/status?new_status=interviewing",
        headers={"X-User-Id": ELENA_EMPLOYER_APEX_ID},
    )
    assert authorized_change.status_code == 200
    assert authorized_change.json()["status"] == "interviewing"


# --------------------------------------------------------------------------
# 8. EVIDENCE IS VISIBLE ONLY WHERE OWNER PERMITS
# --------------------------------------------------------------------------
def test_evidence_visibility_permissions():
    # Alex's evidence is marked 'application_only'.
    # 1. Elena (Employer at Apex where Alex applied) CAN view it:
    elena_evidence_view = client.get(
        f"/evidence/{ALEX_EVIDENCE_ID}",
        headers={"X-User-Id": ELENA_EMPLOYER_APEX_ID},
    )
    assert elena_evidence_view.status_code == 200

    # 2. Jordan (unrelated candidate) CANNOT view Alex's application-only evidence:
    jordan_evidence_view = client.get(
        f"/evidence/{ALEX_EVIDENCE_ID}",
        headers={"X-User-Id": JORDAN_CANDIDATE_ID},
    )
    assert jordan_evidence_view.status_code == 403
    assert "Evidence item is not visible to this user" in jordan_evidence_view.json()["detail"]
