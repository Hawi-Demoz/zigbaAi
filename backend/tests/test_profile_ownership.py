from uuid import UUID
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

ALEX_CANDIDATE_ID = "11111111-1111-1111-1111-111111111111"
JORDAN_CANDIDATE_ID = "22222222-2222-2222-2222-222222222222"
ELENA_EMPLOYER_ID = "66666666-6666-6666-6666-666666666666"


# --------------------------------------------------------------------------
# 1. PROFILE VISIBILITY & PRIVACY CHECKS
# --------------------------------------------------------------------------
def test_private_profile_isolation():
    # Jordan Chen's profile is configured as 'private'
    # 1. Jordan CAN view their own profile
    own_resp = client.get(
        f"/profiles/{JORDAN_CANDIDATE_ID}",
        headers={"X-User-Id": JORDAN_CANDIDATE_ID},
    )
    assert own_resp.status_code == 200

    # 2. Alex (another user) CANNOT view Jordan's private profile
    other_resp = client.get(
        f"/profiles/{JORDAN_CANDIDATE_ID}",
        headers={"X-User-Id": ALEX_CANDIDATE_ID},
    )
    assert other_resp.status_code == 403
    assert "This profile is private" in other_resp.json()["detail"]


def test_employers_only_profile_visibility():
    # Alex Rivera's profile is configured as 'employers_only'
    # 1. Elena (verified Employer) CAN view Alex's profile
    employer_resp = client.get(
        f"/profiles/{ALEX_CANDIDATE_ID}",
        headers={"X-User-Id": ELENA_EMPLOYER_ID},
    )
    assert employer_resp.status_code == 200
    assert employer_resp.json()["full_name"] == "Alex Rivera"

    # 2. Jordan (fellow candidate) CANNOT view Alex's profile
    candidate_resp = client.get(
        f"/profiles/{ALEX_CANDIDATE_ID}",
        headers={"X-User-Id": JORDAN_CANDIDATE_ID},
    )
    assert candidate_resp.status_code == 403
    assert "only visible to verified employers" in candidate_resp.json()["detail"]


# --------------------------------------------------------------------------
# 2. EDUCATION: PERSONAL EMAIL MARKED SELF-REPORTED & OWNERSHIP CHECKS
# --------------------------------------------------------------------------
def test_education_personal_email_marked_self_reported():
    # Adding education with a personal email domain (e.g. @gmail.com)
    gmail_resp = client.post(
        "/profiles/me/education",
        headers={"X-User-Id": ALEX_CANDIDATE_ID},
        json={
            "institution": "Self-Taught Computer Science",
            "degree": "Open Courseware",
            "field_of_study": "Software Engineering",
            "contact_email": "alex.rivera@gmail.com",
            "is_current": False,
        },
    )
    assert gmail_resp.status_code == 200
    edu_data = gmail_resp.json()
    assert edu_data["verification_status"] == "self_reported"
    edu_id = edu_data["id"]

    # Jordan tries to delete Alex's education record -> Forbidden!
    forbidden_delete = client.delete(
        f"/profiles/me/education/{edu_id}",
        headers={"X-User-Id": JORDAN_CANDIDATE_ID},
    )
    assert forbidden_delete.status_code == 403

    # Alex deletes their own education record -> Success!
    valid_delete = client.delete(
        f"/profiles/me/education/{edu_id}",
        headers={"X-User-Id": ALEX_CANDIDATE_ID},
    )
    assert valid_delete.status_code == 200


def test_education_institutional_domain_status():
    # Adding education with an institutional domain (e.g. @university.edu)
    inst_resp = client.post(
        "/profiles/me/education",
        headers={"X-User-Id": ALEX_CANDIDATE_ID},
        json={
            "institution": "State University",
            "degree": "B.S. Information Systems",
            "contact_email": "registrar@stateuniversity.edu",
            "is_current": False,
        },
    )
    assert inst_resp.status_code == 200
    assert inst_resp.json()["verification_status"] == "institutional_submitted"


# --------------------------------------------------------------------------
# 3. EXPERIENCE: OPTIONAL FOR BEGINNERS & OWNERSHIP CHECKS
# --------------------------------------------------------------------------
def test_experience_ownership_checks():
    # Alex adds experience
    exp_resp = client.post(
        "/profiles/me/experience",
        headers={"X-User-Id": ALEX_CANDIDATE_ID},
        json={
            "company_name": "Freelance Client Project",
            "role_title": "Full-Stack Developer",
            "description": "Built responsive web app using Next.js and FastAPI.",
            "is_current": False,
        },
    )
    assert exp_resp.status_code == 200
    exp_id = exp_resp.json()["id"]

    # Jordan tries to delete Alex's experience -> Forbidden!
    forbidden_delete = client.delete(
        f"/profiles/me/experience/{exp_id}",
        headers={"X-User-Id": JORDAN_CANDIDATE_ID},
    )
    assert forbidden_delete.status_code == 403

    # Alex deletes their own experience -> Success!
    valid_delete = client.delete(
        f"/profiles/me/experience/{exp_id}",
        headers={"X-User-Id": ALEX_CANDIDATE_ID},
    )
    assert valid_delete.status_code == 200


# --------------------------------------------------------------------------
# 4. SKILLS OWNERSHIP CHECKS
# --------------------------------------------------------------------------
def test_skills_ownership_checks():
    # Alex adds a skill
    skill_resp = client.post(
        "/profiles/me/skills",
        headers={"X-User-Id": ALEX_CANDIDATE_ID},
        json={
            "skill_name": "PostgreSQL Row Level Security",
            "category": "Database Security",
            "years_experience": 2.0,
        },
    )
    assert skill_resp.status_code == 200
    skill_id = skill_resp.json()["id"]

    # Jordan tries to delete Alex's skill -> Forbidden!
    forbidden_delete = client.delete(
        f"/profiles/me/skills/{skill_id}",
        headers={"X-User-Id": JORDAN_CANDIDATE_ID},
    )
    assert forbidden_delete.status_code == 403

    # Alex deletes their own skill -> Success!
    valid_delete = client.delete(
        f"/profiles/me/skills/{skill_id}",
        headers={"X-User-Id": ALEX_CANDIDATE_ID},
    )
    assert valid_delete.status_code == 200


# --------------------------------------------------------------------------
# 5. BEGINNERS WITHOUT WORK HISTORY (SKIP EDUCATION/EXPERIENCE)
# --------------------------------------------------------------------------
def test_beginner_can_participate_without_work_history():
    # Beginner reads their profile: empty education & experience is valid
    resp = client.get(
        "/profiles/me",
        headers={"X-User-Id": JORDAN_CANDIDATE_ID},
    )
    assert resp.status_code == 200
    profile_data = resp.json()
    assert isinstance(profile_data["education"], list)
    assert isinstance(profile_data["experience"], list)
