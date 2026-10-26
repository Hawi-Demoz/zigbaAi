from typing import Dict, Set, Optional, List
from uuid import UUID, uuid4
from fastapi import FastAPI, Header, HTTPException, status
from app.schemas import (
    ProfileUpdate,
    ProfileResponse,
    ProfileVisibility,
    UserRole,
    CandidateProfileDetail,
    EducationCreate,
    EducationResponse,
    ExperienceCreate,
    ExperienceResponse,
    SkillAdd,
    SkillItemResponse,
    compute_education_verification,
    EvidenceUpdate,
    EvidenceResponse,
    UserDocumentResponse,
    ApplicationResponse,
    ApplicationStatus,
    EvidenceStatus,
    EvidenceVisibility,
)
from app.permissions import (
    check_profile_edit_permission,
    check_document_access_permission,
    check_evidence_edit_permission,
    check_evidence_status_permission,
    check_evidence_view_permission,
    check_application_view_permission,
    check_application_status_update_permission,
    PermissionDeniedException,
)

app = FastAPI(
    title="Evidence-Based Professional Network API",
    version="0.1.0",
)

# -------------------------------------------------------------------------
# SYNTHETIC IN-MEMORY STORE (Reflecting Phase 1 Seed Data for Permissions)
# -------------------------------------------------------------------------
SYNTHETIC_PROFILES: Dict[UUID, dict] = {
    UUID("11111111-1111-1111-1111-111111111111"): {
        "id": UUID("11111111-1111-1111-1111-111111111111"),
        "full_name": "Alex Rivera",
        "headline": "Self-Taught Full-Stack Developer",
        "bio": "Passionate about building clean modular web apps.",
        "location": "Chicago, IL",
        "role": UserRole.CANDIDATE,
        "visibility": ProfileVisibility.EMPLOYERS_ONLY,
    },
    UUID("22222222-2222-2222-2222-222222222222"): {
        "id": UUID("22222222-2222-2222-2222-222222222222"),
        "full_name": "Jordan Chen",
        "headline": "Backend Engineer | Python & APIs",
        "bio": "Specializing in high-throughput FastAPI services.",
        "location": "San Francisco, CA",
        "role": UserRole.CANDIDATE,
        "visibility": ProfileVisibility.PRIVATE,
    },
    UUID("66666666-6666-6666-6666-666666666666"): {
        "id": UUID("66666666-6666-6666-6666-666666666666"),
        "full_name": "Elena Vance",
        "headline": "Engineering Director @ Apex Labs",
        "bio": "Hiring engineering talent.",
        "location": "Seattle, WA",
        "role": UserRole.EMPLOYER,
        "visibility": ProfileVisibility.PUBLIC,
    },
}

SYNTHETIC_EDUCATION: Dict[UUID, dict] = {}
SYNTHETIC_EXPERIENCE: Dict[UUID, dict] = {}
SYNTHETIC_PROFILE_SKILLS: Dict[UUID, dict] = {}

SYNTHETIC_DOCUMENTS: Dict[UUID, dict] = {
    UUID("90000000-0001-0000-0000-000000000001"): {
        "id": UUID("90000000-0001-0000-0000-000000000001"),
        "profile_id": UUID("11111111-1111-1111-1111-111111111111"),
        "document_name": "alex_private_tax_transcript.pdf",
        "storage_path": "secure/11111111/alex_private_tax_transcript.pdf",
        "document_type": "transcript",
        "file_size_bytes": 102400,
    },
}

SYNTHETIC_EVIDENCE: Dict[UUID, dict] = {
    UUID("dddddddd-0001-0000-0000-000000000001"): {
        "id": UUID("dddddddd-0001-0000-0000-000000000001"),
        "profile_id": UUID("11111111-1111-1111-1111-111111111111"),
        "claim_type": "project",
        "claim_id": UUID("cccccccc-0001-0000-0000-000000000001"),
        "title": "Test Suite & Git Commit Log",
        "evidence_url": "https://github.com/synthetic/md-parser/actions",
        "visibility": EvidenceVisibility.APPLICATION_ONLY,
        "status": EvidenceStatus.EVIDENCE_SUBMITTED,
        "verification_notes": None,
    },
}

SYNTHETIC_APPLICATIONS: Dict[UUID, dict] = {
    UUID("20000000-0001-0000-0000-000000000001"): {
        "id": UUID("20000000-0001-0000-0000-000000000001"),
        "job_id": UUID("ffffffff-0001-0000-0000-000000000001"),
        "company_id": UUID("eeeeeeee-0001-0000-0000-000000000001"),
        "candidate_id": UUID("11111111-1111-1111-1111-111111111111"),
        "status": ApplicationStatus.SUBMITTED,
        "cover_note": "Excited about the Junior Full-Stack role.",
    },
    UUID("20000000-0002-0000-0000-000000000002"): {
        "id": UUID("20000000-0002-0000-0000-000000000002"),
        "job_id": UUID("ffffffff-0002-0000-0000-000000000002"),
        "company_id": UUID("eeeeeeee-0002-0000-0000-000000000002"),
        "candidate_id": UUID("22222222-2222-2222-2222-222222222222"),
        "status": ApplicationStatus.UNDER_REVIEW,
        "cover_note": "Senior backend engineer.",
    },
}

SYNTHETIC_COMPANY_MEMBERS: Dict[UUID, Set[UUID]] = {
    UUID("66666666-6666-6666-6666-666666666666"): {UUID("eeeeeeee-0001-0000-0000-000000000001")},
}


# -------------------------------------------------------------------------
# AUTH DEPENDENCY
# -------------------------------------------------------------------------
def get_current_user_id(x_user_id: Optional[str] = Header(None)) -> UUID:
    if not x_user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication credentials.",
        )
    try:
        return UUID(x_user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid authenticated user identifier format.",
        )


# -------------------------------------------------------------------------
# ENDPOINTS: HEALTH & PROFILES
# -------------------------------------------------------------------------
@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/profiles/me", response_model=CandidateProfileDetail)
def get_my_profile(current_user_id: UUID = Header(None, alias="X-User-Id")):
    user_id = get_current_user_id(str(current_user_id) if current_user_id else None)
    prof = SYNTHETIC_PROFILES.get(user_id)
    if not prof:
        raise HTTPException(status_code=404, detail="Profile not found.")

    my_education = [e for e in SYNTHETIC_EDUCATION.values() if e["profile_id"] == user_id]
    my_experience = [e for e in SYNTHETIC_EXPERIENCE.values() if e["profile_id"] == user_id]
    my_skills = [s for s in SYNTHETIC_PROFILE_SKILLS.values() if s["profile_id"] == user_id]

    return {
        **prof,
        "education": my_education,
        "experience": my_experience,
        "skills": my_skills,
    }


@app.patch("/profiles/me")
def update_my_profile(
    payload: ProfileUpdate,
    current_user_id: UUID = Header(None, alias="X-User-Id"),
):
    user_id = get_current_user_id(str(current_user_id) if current_user_id else None)
    prof = SYNTHETIC_PROFILES.get(user_id)
    if not prof:
        raise HTTPException(status_code=404, detail="Profile not found.")

    update_data = payload.model_dump(exclude_unset=True)
    prof.update(update_data)
    return prof


@app.get("/profiles/{profile_id}")
def get_profile_by_id(
    profile_id: UUID,
    current_user_id: UUID = Header(None, alias="X-User-Id"),
):
    user_id = get_current_user_id(str(current_user_id) if current_user_id else None)
    prof = SYNTHETIC_PROFILES.get(profile_id)
    if not prof:
        raise HTTPException(status_code=404, detail="Profile not found.")

    # Privacy checks
    if user_id != profile_id:
        if prof.get("visibility") == ProfileVisibility.PRIVATE:
            raise PermissionDeniedException("This profile is private.")

        if prof.get("visibility") == ProfileVisibility.EMPLOYERS_ONLY:
            viewer_prof = SYNTHETIC_PROFILES.get(user_id)
            if not viewer_prof or viewer_prof.get("role") != UserRole.EMPLOYER:
                raise PermissionDeniedException("This profile is only visible to verified employers.")

    return prof


@app.patch("/profiles/{profile_id}")
def update_profile(
    profile_id: UUID,
    payload: ProfileUpdate,
    current_user_id: UUID = Header(None, alias="X-User-Id"),
):
    user_id = get_current_user_id(str(current_user_id) if current_user_id else None)
    prof = SYNTHETIC_PROFILES.get(profile_id)
    if not prof:
        raise HTTPException(status_code=404, detail="Profile not found.")

    check_profile_edit_permission(user_id, profile_id)
    update_data = payload.model_dump(exclude_unset=True)
    prof.update(update_data)
    return prof


# -------------------------------------------------------------------------
# ENDPOINTS: EDUCATION (With Personal Email Detection)
# -------------------------------------------------------------------------
@app.post("/profiles/me/education", response_model=EducationResponse)
def add_education(
    payload: EducationCreate,
    current_user_id: UUID = Header(None, alias="X-User-Id"),
):
    user_id = get_current_user_id(str(current_user_id) if current_user_id else None)

    # Domain rule: personal email marks education as self-reported
    verification = compute_education_verification(payload.contact_email)

    edu_id = uuid4()
    item = {
        "id": edu_id,
        "profile_id": user_id,
        "institution": payload.institution,
        "degree": payload.degree,
        "field_of_study": payload.field_of_study,
        "start_date": payload.start_date,
        "end_date": payload.end_date,
        "is_current": payload.is_current,
        "verification_status": verification,
    }
    SYNTHETIC_EDUCATION[edu_id] = item
    return item


@app.delete("/profiles/me/education/{education_id}")
def delete_education(
    education_id: UUID,
    current_user_id: UUID = Header(None, alias="X-User-Id"),
):
    user_id = get_current_user_id(str(current_user_id) if current_user_id else None)
    item = SYNTHETIC_EDUCATION.get(education_id)
    if not item:
        raise HTTPException(status_code=404, detail="Education record not found.")

    if item["profile_id"] != user_id:
        raise PermissionDeniedException("You cannot delete another user's education record.")

    del SYNTHETIC_EDUCATION[education_id]
    return {"message": "Education record deleted."}


# -------------------------------------------------------------------------
# ENDPOINTS: EXPERIENCE (Optional for Beginners)
# -------------------------------------------------------------------------
@app.post("/profiles/me/experience", response_model=ExperienceResponse)
def add_experience(
    payload: ExperienceCreate,
    current_user_id: UUID = Header(None, alias="X-User-Id"),
):
    user_id = get_current_user_id(str(current_user_id) if current_user_id else None)

    exp_id = uuid4()
    item = {
        "id": exp_id,
        "profile_id": user_id,
        "company_name": payload.company_name,
        "role_title": payload.role_title,
        "description": payload.description,
        "start_date": payload.start_date,
        "end_date": payload.end_date,
        "is_current": payload.is_current,
    }
    SYNTHETIC_EXPERIENCE[exp_id] = item
    return item


@app.delete("/profiles/me/experience/{experience_id}")
def delete_experience(
    experience_id: UUID,
    current_user_id: UUID = Header(None, alias="X-User-Id"),
):
    user_id = get_current_user_id(str(current_user_id) if current_user_id else None)
    item = SYNTHETIC_EXPERIENCE.get(experience_id)
    if not item:
        raise HTTPException(status_code=404, detail="Experience record not found.")

    if item["profile_id"] != user_id:
        raise PermissionDeniedException("You cannot delete another user's experience record.")

    del SYNTHETIC_EXPERIENCE[experience_id]
    return {"message": "Experience record deleted."}


# -------------------------------------------------------------------------
# ENDPOINTS: SKILLS
# -------------------------------------------------------------------------
@app.post("/profiles/me/skills", response_model=SkillItemResponse)
def add_skill(
    payload: SkillAdd,
    current_user_id: UUID = Header(None, alias="X-User-Id"),
):
    user_id = get_current_user_id(str(current_user_id) if current_user_id else None)

    profile_skill_id = uuid4()
    item = {
        "id": profile_skill_id,
        "profile_id": user_id,
        "skill_id": uuid4(),
        "name": payload.skill_name,
        "category": payload.category,
        "years_experience": payload.years_experience,
    }
    SYNTHETIC_PROFILE_SKILLS[profile_skill_id] = item
    return item


@app.delete("/profiles/me/skills/{profile_skill_id}")
def delete_skill(
    profile_skill_id: UUID,
    current_user_id: UUID = Header(None, alias="X-User-Id"),
):
    user_id = get_current_user_id(str(current_user_id) if current_user_id else None)
    item = SYNTHETIC_PROFILE_SKILLS.get(profile_skill_id)
    if not item:
        raise HTTPException(status_code=404, detail="Skill not found.")

    if item["profile_id"] != user_id:
        raise PermissionDeniedException("You cannot delete another user's skill.")

    del SYNTHETIC_PROFILE_SKILLS[profile_skill_id]
    return {"message": "Skill deleted."}


# -------------------------------------------------------------------------
# EXISTING PERMISSION ENFORCED ENDPOINTS
# -------------------------------------------------------------------------
@app.get("/documents/{document_id}")
def get_document(document_id: UUID, current_user_id: UUID = Header(None, alias="X-User-Id")):
    user_id = get_current_user_id(str(current_user_id) if current_user_id else None)
    doc = SYNTHETIC_DOCUMENTS.get(document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    check_document_access_permission(user_id, doc["profile_id"])
    return doc


@app.get("/evidence/{evidence_id}")
def get_evidence(evidence_id: UUID, current_user_id: UUID = Header(None, alias="X-User-Id")):
    user_id = get_current_user_id(str(current_user_id) if current_user_id else None)
    item = SYNTHETIC_EVIDENCE.get(evidence_id)
    if not item:
        raise HTTPException(status_code=404, detail="Evidence item not found.")

    viewer_companies = SYNTHETIC_COMPANY_MEMBERS.get(user_id, set())
    has_active_application = any(
        app["candidate_id"] == item["profile_id"] and app["company_id"] in viewer_companies
        for app in SYNTHETIC_APPLICATIONS.values()
    )

    check_evidence_view_permission(
        current_user_id=user_id,
        evidence_owner_id=item["profile_id"],
        visibility=item["visibility"],
        has_active_application_to_viewer=has_active_application,
    )
    return item


@app.patch("/evidence/{evidence_id}")
def update_evidence(
    evidence_id: UUID,
    payload: EvidenceUpdate,
    current_user_id: UUID = Header(None, alias="X-User-Id"),
):
    user_id = get_current_user_id(str(current_user_id) if current_user_id else None)
    item = SYNTHETIC_EVIDENCE.get(evidence_id)
    if not item:
        raise HTTPException(status_code=404, detail="Evidence item not found.")

    check_evidence_edit_permission(user_id, item["profile_id"])

    if payload.status:
        check_evidence_status_permission(
            current_user_id=user_id,
            evidence_owner_id=item["profile_id"],
            new_status=payload.status,
            is_authorized_verifier=False,
        )

    update_data = payload.model_dump(exclude_unset=True)
    item.update(update_data)
    return item


@app.get("/applications/{application_id}")
def get_application(application_id: UUID, current_user_id: UUID = Header(None, alias="X-User-Id")):
    user_id = get_current_user_id(str(current_user_id) if current_user_id else None)
    app_data = SYNTHETIC_APPLICATIONS.get(application_id)
    if not app_data:
        raise HTTPException(status_code=404, detail="Application not found.")

    viewer_companies = SYNTHETIC_COMPANY_MEMBERS.get(user_id, set())
    check_application_view_permission(
        current_user_id=user_id,
        candidate_id=app_data["candidate_id"],
        application_company_id=app_data["company_id"],
        viewer_company_ids=viewer_companies,
    )
    return app_data


@app.patch("/applications/{application_id}/status")
def update_application_status(
    application_id: UUID,
    new_status: ApplicationStatus,
    current_user_id: UUID = Header(None, alias="X-User-Id"),
):
    user_id = get_current_user_id(str(current_user_id) if current_user_id else None)
    app_data = SYNTHETIC_APPLICATIONS.get(application_id)
    if not app_data:
        raise HTTPException(status_code=404, detail="Application not found.")

    viewer_companies = SYNTHETIC_COMPANY_MEMBERS.get(user_id, set())
    check_application_status_update_permission(
        current_user_id=user_id,
        application_company_id=app_data["company_id"],
        viewer_company_ids=viewer_companies,
    )

    app_data["status"] = new_status
    return app_data
