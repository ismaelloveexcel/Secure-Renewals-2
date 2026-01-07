from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.models import Employee, EoyNomination, ELIGIBLE_JOB_LEVELS
from app.schemas.nomination import (
    NominationCreate, NominationResponse, NominationUpdate,
    EligibleEmployee, NominationListResponse, NominationStats
)

router = APIRouter(prefix="/nominations", tags=["nominations"])


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
    "/submit",
    response_model=NominationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a new EOY nomination",
)
async def submit_nomination(
    nomination: NominationCreate,
    nominator_id: int = Query(..., description="ID of the manager submitting"),
    session: AsyncSession = Depends(get_session),
):
    """
    Submit an Employee of the Year nomination.
    
    Validates:
    - Nominee is in nominator's team
    - Nominee is at Officer level or below
    - No duplicate nomination for same year
    """
    year = datetime.now().year
    
    nominee_stmt = select(Employee).where(Employee.id == nomination.nominee_id)
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
    
    existing_stmt = select(EoyNomination).where(
        and_(
            EoyNomination.nominee_id == nomination.nominee_id,
            EoyNomination.nomination_year == year
        )
    )
    existing_result = await session.execute(existing_stmt)
    if existing_result.scalar_one_or_none():
        raise HTTPException(
            status_code=409,
            detail="This employee has already been nominated for this year"
        )
    
    nominator_stmt = select(Employee).where(Employee.id == nominator_id)
    nominator_result = await session.execute(nominator_stmt)
    nominator = nominator_result.scalar_one_or_none()
    
    new_nomination = EoyNomination(
        nominee_id=nomination.nominee_id,
        nominator_id=nominator_id,
        nomination_year=year,
        justification=nomination.justification,
        achievements=nomination.achievements,
        impact_description=nomination.impact_description,
        status="pending"
    )
    
    session.add(new_nomination)
    await session.commit()
    await session.refresh(new_nomination)
    
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
    
    nomination.status = update.status
    nomination.review_notes = update.review_notes
    nomination.reviewed_by = reviewer_id
    nomination.reviewed_at = datetime.now()
    
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
