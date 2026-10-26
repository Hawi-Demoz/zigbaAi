from typing import Set
from uuid import UUID
from fastapi import HTTPException, status
from app.schemas import EvidenceStatus, EvidenceVisibility


class PermissionDeniedException(HTTPException):
    def __init__(self, detail: str = "Permission denied: access not authorized"):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=detail)


def check_profile_edit_permission(current_user_id: UUID, target_profile_id: UUID) -> None:
    """Enforce: Users can only edit their own profile."""
    if current_user_id != target_profile_id:
        raise PermissionDeniedException("Users can only modify their own profile.")


def check_document_access_permission(current_user_id: UUID, document_owner_id: UUID) -> None:
    """Enforce: Documents are strictly private to the document owner."""
    if current_user_id != document_owner_id:
        raise PermissionDeniedException("Private documents are accessible only by the owner.")


def check_evidence_edit_permission(current_user_id: UUID, evidence_owner_id: UUID) -> None:
    """Enforce: Only evidence owners can modify evidence metadata."""
    if current_user_id != evidence_owner_id:
        raise PermissionDeniedException("You cannot edit evidence belonging to another user.")


def check_evidence_status_permission(
    current_user_id: UUID,
    evidence_owner_id: UUID,
    new_status: EvidenceStatus,
    is_authorized_verifier: bool = False,
) -> None:
    """
    Enforce Rule:
    Candidates can never self-assign 'evidence_reviewed' or 'independently_confirmed'.
    These statuses require authorized verification review.
    """
    restricted_statuses = {
        EvidenceStatus.EVIDENCE_REVIEWED,
        EvidenceStatus.INDEPENDENTLY_CONFIRMED,
    }
    if new_status in restricted_statuses:
        if current_user_id == evidence_owner_id and not is_authorized_verifier:
            raise PermissionDeniedException(
                f"Candidates cannot self-assign status '{new_status.value}'. Must be verified by an authorized reviewer."
            )


def check_evidence_view_permission(
    current_user_id: UUID,
    evidence_owner_id: UUID,
    visibility: EvidenceVisibility,
    has_active_application_to_viewer: bool = False,
) -> None:
    """
    Enforce Rule:
    Evidence is visible only where the owner permits:
    1. Owner always has access.
    2. Public evidence is viewable by all authenticated users.
    3. Application-only evidence is visible ONLY if candidate applied to viewer's company.
    4. Private evidence is visible ONLY to owner.
    """
    if current_user_id == evidence_owner_id:
        return

    if visibility == EvidenceVisibility.PUBLIC:
        return

    if visibility == EvidenceVisibility.APPLICATION_ONLY and has_active_application_to_viewer:
        return

    raise PermissionDeniedException("Evidence item is not visible to this user under current permissions.")


def check_application_view_permission(
    current_user_id: UUID,
    candidate_id: UUID,
    application_company_id: UUID,
    viewer_company_ids: Set[UUID],
) -> None:
    """
    Enforce Rule:
    Candidates see only their own applications.
    Employers see only applications submitted to their company.
    """
    # 1. Candidate viewing their own application
    if current_user_id == candidate_id:
        return

    # 2. Employer viewing application to their company
    if application_company_id in viewer_company_ids:
        return

    raise PermissionDeniedException("Access denied: You do not have permission to view this application.")


def check_application_status_update_permission(
    current_user_id: UUID,
    application_company_id: UUID,
    viewer_company_ids: Set[UUID],
) -> None:
    """
    Enforce Rule:
    Only employers of the target company can update the application hiring status.
    Candidates cannot accept or reject their own application.
    """
    if application_company_id not in viewer_company_ids:
        raise PermissionDeniedException("Only authorized company members can update application status.")
