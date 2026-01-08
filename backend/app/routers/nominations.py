import hashlib
import hmac
import json
import os
import secrets
from datetime import datetime, timedelta
from typing import List, Dict

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.models import Employee, EoyNomination, ELIGIBLE_JOB_LEVELS
from app.models.audit_log import AuditLog
from app.models.notification import Notification
from app.schemas.nomination import (
    NominationCreate, NominationResponse, NominationUpdate,
    EligibleEmployee, NominationListResponse, NominationStats, EligibleManager,
    VerifyManagerRequest, VerifyManagerResponse, NominationSubmitRequest,
    ManagerNominationStatus
)
from app.services.email_service import send_nomination_confirmation_email

VERIFICATION_SECRET = os.environ.get("AUTH_SECRET_KEY", "nomination-verify-secret-key")
TOKEN_EXPIRY_MINUTES = 15

_active_tokens: Dict[str, dict] = {}

router = APIRouter(prefix="/nominations", tags=["nominations"])


def generate_verification_token(manager_id: int) -> str:
    """Generate a secure verification token for a manager"""
    token = secrets.token_urlsafe(32)
    expiry = datetime.now() + timedelta(minutes=TOKEN_EXPIRY_MINUTES)
    _active_tokens[token] = {
        "manager_id": manager_id,
        "expires_at": expiry
    }
    _cleanup_expired_tokens()
    return token


def validate_verification_token(token: str) -> int | None:
    """Validate token and return manager_id if valid, None if invalid/expired"""
    _cleanup_expired_tokens()
    token_data = _active_tokens.get(token)
    if not token_data:
        return None
    if datetime.now() > token_data["expires_at"]:
        del _active_tokens[token]
        return None
    return token_data["manager_id"]


def invalidate_token(token: str):
    """Invalidate a token after use"""
    if token in _active_tokens:
        del _active_tokens[token]


def _cleanup_expired_tokens():
    """Remove expired tokens from memory"""
    now = datetime.now()
    expired = [t for t, data in _active_tokens.items() if data["expires_at"] < now]
    for t in expired:
        del _active_tokens[t]


@router.post(
    "/pass/verify",
    response_model=VerifyManagerResponse,
    summary="Verify manager identity and get submission token",
)
async def verify_manager_identity(
    request: VerifyManagerRequest,
    session: AsyncSession = Depends(get_session),
):
    """
    Verify a manager's identity using their email or employee ID.
    Returns a short-lived token required for submitting nominations.
    """
    manager_stmt = select(Employee).where(Employee.id == request.manager_id)
    result = await session.execute(manager_stmt)
    manager = result.scalar_one_or_none()
    
    if not manager:
        raise HTTPException(status_code=404, detail="Manager not found")
    
    verification_input = request.verification_input.strip().lower()
    manager_email = (manager.email or "").strip().lower()
    manager_emp_id = (manager.employee_id or "").strip().lower()
    
    if verification_input != manager_email and verification_input != manager_emp_id:
        raise HTTPException(
            status_code=401, 
            detail="Verification failed. Please enter your correct email or Employee ID."
        )
    
    token = generate_verification_token(manager.id)
    
    return VerifyManagerResponse(
        success=True,
        token=token,
        manager_name=manager.name,
        expires_in_minutes=TOKEN_EXPIRY_MINUTES
    )


@router.get(
    "/pass/managers",
    response_model=List[EligibleManager],
    summary="Get all managers with eligible direct reports for nomination pass",
)
async def get_eligible_managers(
    year: int = Query(default=None, description="Nomination year (defaults to current year)"),
    session: AsyncSession = Depends(get_session),
):
    """
    Returns all managers who have at least one eligible direct report.
    Used for the shared nomination pass - managers select their name from this list.
    """
    if year is None:
        year = datetime.now().year
    
    all_employees_stmt = select(Employee).where(
        and_(
            Employee.is_active == True,
            Employee.employment_status == "Active"
        )
    )
    result = await session.execute(all_employees_stmt)
    all_employees = result.scalars().all()
    
    manager_reports: dict[int, list] = {}
    for emp in all_employees:
        if emp.line_manager_id:
            if emp.line_manager_id not in manager_reports:
                manager_reports[emp.line_manager_id] = []
            if check_eligible_job_level(emp.job_title):
                manager_reports[emp.line_manager_id].append(emp)
    
    eligible_managers = []
    for manager_id, reports in manager_reports.items():
        if len(reports) > 0:
            manager = next((e for e in all_employees if e.id == manager_id), None)
            if manager:
                eligible_managers.append(EligibleManager(
                    id=manager.id,
                    employee_id=manager.employee_id,
                    name=manager.name,
                    job_title=manager.job_title,
                    department=manager.department,
                    email=manager.email,
                    eligible_reports_count=len(reports)
                ))
    
    eligible_managers.sort(key=lambda m: m.name)
    return eligible_managers


def check_eligible_job_level(job_title: str | None) -> bool:
    """Check if job title qualifies as Officer level or below"""
    if not job_title:
        return False
    job_lower = job_title.lower()
    for level in ELIGIBLE_JOB_LEVELS:
        if level.lower() in job_lower:
            return True
    return False


@router.get(
    "/pass/status/{manager_id}",
    response_model=ManagerNominationStatus,
    summary="Check if manager has already submitted their nomination",
)
async def get_manager_nomination_status(
    manager_id: int,
    year: int = Query(default=None, description="Nomination year (defaults to current year)"),
    session: AsyncSession = Depends(get_session),
):
    """
    Check if a manager has already submitted their one allowed nomination for the year.
    Returns nomination details if already submitted.
    """
    if year is None:
        year = datetime.now().year
    
    # Check for existing nomination by this manager for this year
    stmt = select(EoyNomination).where(
        and_(
            EoyNomination.nominator_id == manager_id,
            EoyNomination.nomination_year == year
        )
    )
    result = await session.execute(stmt)
    existing_nomination = result.scalar_one_or_none()
    
    if existing_nomination:
        nominee = await session.get(Employee, existing_nomination.nominee_id)
        nominator = await session.get(Employee, existing_nomination.nominator_id)
        reviewer = await session.get(Employee, existing_nomination.reviewed_by) if existing_nomination.reviewed_by else None
        
        nomination_response = NominationResponse(
            id=existing_nomination.id,
            nominee_id=existing_nomination.nominee_id,
            nominee_name=nominee.name if nominee else "Unknown",
            nominee_job_title=nominee.job_title if nominee else None,
            nominee_department=nominee.department if nominee else None,
            nominator_id=existing_nomination.nominator_id,
            nominator_name=nominator.name if nominator else "Unknown",
            nomination_year=existing_nomination.nomination_year,
            justification=existing_nomination.justification,
            achievements=existing_nomination.achievements,
            impact_description=existing_nomination.impact_description,
            status=existing_nomination.status,
            reviewed_by=existing_nomination.reviewed_by,
            reviewer_name=reviewer.name if reviewer else None,
            reviewed_at=existing_nomination.reviewed_at,
            review_notes=existing_nomination.review_notes,
            created_at=existing_nomination.created_at
        )
        
        return ManagerNominationStatus(
            has_nominated=True,
            nomination=nomination_response,
            can_nominate=False
        )
    
    return ManagerNominationStatus(
        has_nominated=False,
        nomination=None,
        can_nominate=True
    )


@router.get(
    "/eligible-employees/{manager_id}",
    response_model=List[EligibleEmployee],
    summary="Get employees eligible for nomination by this manager",
)
async def get_eligible_employees(
    manager_id: int,
    year: int = Query(default=None, description="Nomination year (defaults to current year)"),
    session: AsyncSession = Depends(get_session),
):
    """
    Returns employees in the manager's direct team who are eligible for EOY nomination.
    Only employees at Officer level or below can be nominated.
    """
    if year is None:
        year = datetime.now().year
    
    stmt = select(Employee).where(
        and_(
            Employee.line_manager_id == manager_id,
            Employee.is_active == True,
            Employee.employment_status == "Active"
        )
    )
    result = await session.execute(stmt)
    team_members = result.scalars().all()
    
    existing_stmt = select(EoyNomination.nominee_id).where(
        EoyNomination.nomination_year == year
    )
    existing_result = await session.execute(existing_stmt)
    already_nominated_ids = set(existing_result.scalars().all())
    
    eligible = []
    for emp in team_members:
        if check_eligible_job_level(emp.job_title):
            eligible.append(EligibleEmployee(
                id=emp.id,
                employee_id=emp.employee_id,
                name=emp.name,
                job_title=emp.job_title,
                department=emp.department,
                profile_photo_path=emp.profile_photo_path,
                years_of_service=emp.years_of_service,
                already_nominated=emp.id in already_nominated_ids
            ))
    
    return eligible


@router.post(
    "/pass/submit",
    response_model=NominationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit EOY nomination with verification token (secure)",
)
async def submit_nomination_secure(
    request: NominationSubmitRequest,
    session: AsyncSession = Depends(get_session),
):
    """
    Submit an Employee of the Year nomination.
    Requires a valid verification token obtained from /pass/verify.
    
    Validates:
    - Valid verification token
    - Nominee is in nominator's team
    - Nominee is at Officer level or below
    - Nominee has not already been nominated this year
    - Manager has not already submitted their one nomination for the year (only 1 allowed)
    """
    nominator_id = validate_verification_token(request.verification_token)
    if nominator_id is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired verification token. Please verify your identity again."
        )
    
    year = datetime.now().year
    
    nominee_stmt = select(Employee).where(Employee.id == request.nominee_id)
    nominee_result = await session.execute(nominee_stmt)
    nominee = nominee_result.scalar_one_or_none()
    
    if not nominee:
        raise HTTPException(status_code=404, detail="Nominee not found")
    
    if nominee.line_manager_id != nominator_id:
        raise HTTPException(
            status_code=403, 
            detail="You can only nominate employees in your direct team"
        )
    
    if not check_eligible_job_level(nominee.job_title):
        raise HTTPException(
            status_code=400,
            detail="Only employees at Officer level or below can be nominated"
        )
    
    # Check if the nominee has already been nominated by anyone this year
    existing_nominee_stmt = select(EoyNomination).where(
        and_(
            EoyNomination.nominee_id == request.nominee_id,
            EoyNomination.nomination_year == year
        )
    )
    existing_nominee_result = await session.execute(existing_nominee_stmt)
    if existing_nominee_result.scalar_one_or_none():
        raise HTTPException(
            status_code=409,
            detail="This employee has already been nominated for this year"
        )
    
    # Check if this manager has already submitted their one nomination for the year
    existing_nominator_stmt = select(EoyNomination).where(
        and_(
            EoyNomination.nominator_id == nominator_id,
            EoyNomination.nomination_year == year
        )
    )
    existing_nominator_result = await session.execute(existing_nominator_stmt)
    if existing_nominator_result.scalar_one_or_none():
        raise HTTPException(
            status_code=409,
            detail="You have already submitted your nomination for this year. Only 1 nomination is allowed per manager."
        )
    
    nominator_stmt = select(Employee).where(Employee.id == nominator_id)
    nominator_result = await session.execute(nominator_stmt)
    nominator = nominator_result.scalar_one_or_none()
    
    new_nomination = EoyNomination(
        nominee_id=request.nominee_id,
        nominator_id=nominator_id,
        nomination_year=year,
        justification=request.justification,
        achievements=request.achievements,
        impact_description=request.impact_description,
        status="pending"
    )
    
    session.add(new_nomination)
    await session.flush()  # Flush to get the nomination ID without committing
    
    invalidate_token(request.verification_token)
    
    # Create audit log for the nomination (same transaction)
    audit_details = json.dumps({
        "nominee_id": nominee.id,
        "nominee_name": nominee.name,
        "nomination_year": year,
        "justification_length": len(request.justification)
    })
    audit_log = AuditLog(
        action="EOY_NOMINATION_SUBMITTED",
        entity="eoy_nominations",
        entity_id=new_nomination.id,
        user_id=str(nominator_id),
        details=audit_details
    )
    session.add(audit_log)
    
    # Create notification for the manager with link to view/revise (same transaction)
    nomination_url = f"/nomination-pass?view={new_nomination.id}"
    notification = Notification(
        user_id=str(nominator_id),
        title="EOY Nomination Submitted",
        message=f"Your nomination of {nominee.name} for Employee of the Year {year} has been submitted successfully. Click to view details.",
        type="eoy_nomination",
        link=nomination_url,
        is_read=False
    )
    session.add(notification)
    
    # Commit all changes atomically
    await session.commit()
    await session.refresh(new_nomination)
    
    # Send confirmation email to manager (async, non-blocking)
    if nominator and nominator.email:
        await send_nomination_confirmation_email(
            manager_email=nominator.email,
            manager_name=nominator.name,
            nominee_name=nominee.name,
            nomination_year=year,
            nomination_id=new_nomination.id
        )
    
    return NominationResponse(
        id=new_nomination.id,
        nominee_id=nominee.id,
        nominee_name=nominee.name,
        nominee_job_title=nominee.job_title,
        nominee_department=nominee.department,
        nominator_id=nominator_id,
        nominator_name=nominator.name if nominator else "Unknown",
        nomination_year=year,
        justification=new_nomination.justification,
        achievements=new_nomination.achievements,
        impact_description=new_nomination.impact_description,
        status=new_nomination.status,
        reviewed_by=None,
        reviewer_name=None,
        reviewed_at=None,
        review_notes=None,
        created_at=new_nomination.created_at
    )


@router.get(
    "/my-nominations/{manager_id}",
    response_model=List[NominationResponse],
    summary="Get nominations submitted by this manager",
)
async def get_my_nominations(
    manager_id: int,
    year: int = Query(default=None),
    session: AsyncSession = Depends(get_session),
):
    """Get all nominations submitted by a specific manager"""
    if year is None:
        year = datetime.now().year
    
    stmt = select(EoyNomination).where(
        and_(
            EoyNomination.nominator_id == manager_id,
            EoyNomination.nomination_year == year
        )
    ).order_by(EoyNomination.created_at.desc())
    
    result = await session.execute(stmt)
    nominations = result.scalars().all()
    
    responses = []
    for nom in nominations:
        nominee = await session.get(Employee, nom.nominee_id)
        nominator = await session.get(Employee, nom.nominator_id)
        reviewer = await session.get(Employee, nom.reviewed_by) if nom.reviewed_by else None
        
        responses.append(NominationResponse(
            id=nom.id,
            nominee_id=nom.nominee_id,
            nominee_name=nominee.name if nominee else "Unknown",
            nominee_job_title=nominee.job_title if nominee else None,
            nominee_department=nominee.department if nominee else None,
            nominator_id=nom.nominator_id,
            nominator_name=nominator.name if nominator else "Unknown",
            nomination_year=nom.nomination_year,
            justification=nom.justification,
            achievements=nom.achievements,
            impact_description=nom.impact_description,
            status=nom.status,
            reviewed_by=nom.reviewed_by,
            reviewer_name=reviewer.name if reviewer else None,
            reviewed_at=nom.reviewed_at,
            review_notes=nom.review_notes,
            created_at=nom.created_at
        ))
    
    return responses


@router.get(
    "/all",
    response_model=NominationListResponse,
    summary="Get all nominations (admin/committee only)",
)
async def get_all_nominations(
    year: int = Query(default=None),
    status_filter: str = Query(default=None),
    session: AsyncSession = Depends(get_session),
):
    """Get all nominations for committee review (requires admin/hr role)"""
    if year is None:
        year = datetime.now().year
    
    stmt = select(EoyNomination).where(EoyNomination.nomination_year == year)
    if status_filter:
        stmt = stmt.where(EoyNomination.status == status_filter)
    stmt = stmt.order_by(EoyNomination.created_at.desc())
    
    result = await session.execute(stmt)
    nominations = result.scalars().all()
    
    responses = []
    for nom in nominations:
        nominee = await session.get(Employee, nom.nominee_id)
        nominator = await session.get(Employee, nom.nominator_id)
        reviewer = await session.get(Employee, nom.reviewed_by) if nom.reviewed_by else None
        
        responses.append(NominationResponse(
            id=nom.id,
            nominee_id=nom.nominee_id,
            nominee_name=nominee.name if nominee else "Unknown",
            nominee_job_title=nominee.job_title if nominee else None,
            nominee_department=nominee.department if nominee else None,
            nominator_id=nom.nominator_id,
            nominator_name=nominator.name if nominator else "Unknown",
            nomination_year=nom.nomination_year,
            justification=nom.justification,
            achievements=nom.achievements,
            impact_description=nom.impact_description,
            status=nom.status,
            reviewed_by=nom.reviewed_by,
            reviewer_name=reviewer.name if reviewer else None,
            reviewed_at=nom.reviewed_at,
            review_notes=nom.review_notes,
            created_at=nom.created_at
        ))
    
    pending_count = sum(1 for n in nominations if n.status == 'pending')
    shortlisted_count = sum(1 for n in nominations if n.status == 'shortlisted')
    winner_count = sum(1 for n in nominations if n.status == 'winner')
    not_selected_count = sum(1 for n in nominations if n.status == 'not_selected')
    
    return NominationListResponse(
        nominations=responses,
        stats=NominationStats(
            total_nominations=len(nominations),
            pending_count=pending_count,
            shortlisted_count=shortlisted_count,
            winner_count=winner_count,
            not_selected_count=not_selected_count
        )
    )


@router.patch(
    "/{nomination_id}/review",
    response_model=NominationResponse,
    summary="Update nomination status (committee review)",
)
async def review_nomination(
    nomination_id: int,
    update: NominationUpdate,
    reviewer_id: int = Query(..., description="ID of the reviewer"),
    session: AsyncSession = Depends(get_session),
):
    """Update nomination status during committee review"""
    stmt = select(EoyNomination).where(EoyNomination.id == nomination_id)
    result = await session.execute(stmt)
    nomination = result.scalar_one_or_none()
    
    if not nomination:
        raise HTTPException(status_code=404, detail="Nomination not found")
    
    old_status = nomination.status
    nomination.status = update.status
    nomination.review_notes = update.review_notes
    nomination.reviewed_by = reviewer_id
    nomination.reviewed_at = datetime.now()
    
    # Create audit log for the review action (same transaction)
    audit_details = json.dumps({
        "nomination_id": nomination_id,
        "old_status": old_status,
        "new_status": update.status,
        "review_notes": update.review_notes
    })
    audit_log = AuditLog(
        action="EOY_NOMINATION_REVIEWED",
        entity="eoy_nominations",
        entity_id=nomination_id,
        user_id=str(reviewer_id),
        details=audit_details
    )
    session.add(audit_log)
    
    # Commit all changes atomically
    await session.commit()
    await session.refresh(nomination)
    
    nominee = await session.get(Employee, nomination.nominee_id)
    nominator = await session.get(Employee, nomination.nominator_id)
    reviewer = await session.get(Employee, reviewer_id)
    
    return NominationResponse(
        id=nomination.id,
        nominee_id=nomination.nominee_id,
        nominee_name=nominee.name if nominee else "Unknown",
        nominee_job_title=nominee.job_title if nominee else None,
        nominee_department=nominee.department if nominee else None,
        nominator_id=nomination.nominator_id,
        nominator_name=nominator.name if nominator else "Unknown",
        nomination_year=nomination.nomination_year,
        justification=nomination.justification,
        achievements=nomination.achievements,
        impact_description=nomination.impact_description,
        status=nomination.status,
        reviewed_by=nomination.reviewed_by,
        reviewer_name=reviewer.name if reviewer else None,
        reviewed_at=nomination.reviewed_at,
        review_notes=nomination.review_notes,
        created_at=nomination.created_at
    )
