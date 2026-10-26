from datetime import datetime, date
from enum import Enum
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field


class ProfileVisibility(str, Enum):
    PUBLIC = "public"
    EMPLOYERS_ONLY = "employers_only"
    PRIVATE = "private"


class UserRole(str, Enum):
    CANDIDATE = "candidate"
    EMPLOYER = "employer"


class EvidenceStatus(str, Enum):
    SELF_REPORTED = "self_reported"
    EVIDENCE_SUBMITTED = "evidence_submitted"
    EVIDENCE_REVIEWED = "evidence_reviewed"
    INDEPENDENTLY_CONFIRMED = "independently_confirmed"


class EvidenceVisibility(str, Enum):
    PUBLIC = "public"
    APPLICATION_ONLY = "application_only"
    PRIVATE = "private"


class ApplicationStatus(str, Enum):
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    INTERVIEWING = "interviewing"
    REJECTED = "rejected"
    ACCEPTED = "accepted"


# -------------------------------------------------------------------------
# EDUCATION & EXPERIENCE SCHEMAS
# -------------------------------------------------------------------------
PERSONAL_EMAIL_DOMAINS = {
    "gmail.com",
    "yahoo.com",
    "hotmail.com",
    "outlook.com",
    "icloud.com",
    "proton.me",
    "protonmail.com",
    "aol.com",
    "mail.com",
}


def compute_education_verification(contact_email: Optional[str]) -> str:
    """
    Domain rule:
    Education claimed using personal email accounts (e.g. @gmail.com)
    is explicitly marked as self-reported.
    """
    if not contact_email or "@" not in contact_email:
        return "self_reported"

    domain = contact_email.split("@")[-1].lower().strip()
    if domain in PERSONAL_EMAIL_DOMAINS:
        return "self_reported"

    return "institutional_submitted"


class EducationCreate(BaseModel):
    institution: str
    degree: Optional[str] = None
    field_of_study: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_current: bool = False
    contact_email: Optional[str] = None  # Used to check institutional domain vs personal


class EducationResponse(BaseModel):
    id: UUID
    profile_id: UUID
    institution: str
    degree: Optional[str] = None
    field_of_study: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_current: bool
    verification_status: str


class ExperienceCreate(BaseModel):
    company_name: str
    role_title: str
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_current: bool = False


class ExperienceResponse(BaseModel):
    id: UUID
    profile_id: UUID
    company_name: str
    role_title: str
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_current: bool


class SkillAdd(BaseModel):
    skill_name: str
    category: str = "General"
    years_experience: Optional[float] = None


class SkillItemResponse(BaseModel):
    id: UUID
    skill_id: UUID
    name: str
    category: str
    years_experience: Optional[float] = None


# -------------------------------------------------------------------------
# PROFILE SCHEMAS
# -------------------------------------------------------------------------
class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    headline: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    visibility: Optional[ProfileVisibility] = None


class ProfileResponse(BaseModel):
    id: UUID
    full_name: str
    headline: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    role: UserRole
    visibility: ProfileVisibility
    created_at: Optional[datetime] = None


class CandidateProfileDetail(ProfileResponse):
    skills: List[SkillItemResponse] = []
    education: List[EducationResponse] = []
    experience: List[ExperienceResponse] = []


# -------------------------------------------------------------------------
# EVIDENCE & APPLICATION SCHEMAS
# -------------------------------------------------------------------------
class EvidenceCreate(BaseModel):
    claim_type: str
    claim_id: UUID
    title: str
    evidence_url: Optional[str] = None
    storage_path: Optional[str] = None
    visibility: EvidenceVisibility = EvidenceVisibility.APPLICATION_ONLY
    status: EvidenceStatus = EvidenceStatus.SELF_REPORTED


class EvidenceUpdate(BaseModel):
    title: Optional[str] = None
    evidence_url: Optional[str] = None
    visibility: Optional[EvidenceVisibility] = None
    status: Optional[EvidenceStatus] = None


class EvidenceResponse(BaseModel):
    id: UUID
    profile_id: UUID
    claim_type: str
    claim_id: UUID
    title: str
    evidence_url: Optional[str] = None
    storage_path: Optional[str] = None
    visibility: EvidenceVisibility
    status: EvidenceStatus
    verification_notes: Optional[str] = None
    reviewed_by: Optional[UUID] = None
    reviewed_at: Optional[datetime] = None


class UserDocumentResponse(BaseModel):
    id: UUID
    profile_id: UUID
    document_name: str
    storage_path: str
    document_type: str
    file_size_bytes: int


class ApplicationResponse(BaseModel):
    id: UUID
    job_id: UUID
    company_id: UUID
    candidate_id: UUID
    status: ApplicationStatus
    cover_note: Optional[str] = None
