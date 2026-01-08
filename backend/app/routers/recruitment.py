"""API endpoints for recruitment module."""
import hmac
from typing import List, Optional
from fastapi import (
    APIRouter, Depends, HTTPException, File, UploadFile,
    Query, status, Request
)
from sqlalchemy.ext.asyncio import AsyncSession
import tempfile
import os
from pathlib import Path

from app.auth.dependencies import require_role
from app.database import get_session
from app.routers.auth import get_current_employee_id
from app.main import limiter
from app.schemas.recruitment import (
    RecruitmentRequestCreate, RecruitmentRequestUpdate, RecruitmentRequestResponse,
    CandidateCreate, CandidateUpdate, CandidateResponse, CandidateSelfServiceUpdate,
    InterviewCreate, InterviewUpdate, InterviewResponse,
    InterviewSlotsProvide, InterviewSlotConfirm,
    EvaluationCreate, EvaluationResponse,
    ParsedResumeData, RecruitmentStats, RecruitmentMetrics,
    StageInfo, InterviewTypeInfo, EmploymentTypeInfo,
    BulkCandidateStageUpdate, BulkCandidateReject, BulkOperationResult
)
from app.services.recruitment_service import recruitment_service
from app.services.resume_parser import resume_parser_service
from app.services.cv_scoring_service import score_candidate_cv

router = APIRouter(prefix="/recruitment", tags=["recruitment"])


# ============================================================================
# METADATA ENDPOINTS
# ============================================================================

@router.get("/stages", response_model=List[StageInfo], summary="Get pipeline stages")
async def get_stages():
    """Get list of recruitment pipeline stages."""
    return recruitment_service.get_stages()


@router.get("/interview-types", response_model=List[InterviewTypeInfo], summary="Get interview types")
async def get_interview_types():
    """Get list of interview types."""
    return recruitment_service.get_interview_types()


@router.get("/employment-types", response_model=List[EmploymentTypeInfo], summary="Get employment types")
async def get_employment_types():
    """Get list of employment types."""
    return recruitment_service.get_employment_types()


@router.get("/stats", response_model=RecruitmentStats, summary="Get recruitment statistics")
async def get_stats(
    role: str = Depends(require_role(["admin", "hr"])),
    session: AsyncSession = Depends(get_session)
):
    """
    Get recruitment statistics.

    **Admin and HR only.**
    """
    return await recruitment_service.get_stats(session)


# ============================================================================
# RECRUITMENT REQUESTS
# ============================================================================

@router.post(
    "/requests",
    response_model=RecruitmentRequestResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create recruitment request"
)
async def create_recruitment_request(
    data: RecruitmentRequestCreate,
    employee_id: str = Depends(get_current_employee_id),
    role: str = Depends(require_role(["admin", "hr"])),
    session: AsyncSession = Depends(get_session)
):
    """
    Create a new recruitment request (job requisition).

    Auto-generates:
    - Request number (RRF-YYYYMMDD-XXXX)
    - Manager pass for hiring manager (if specified)

    **Admin and HR only.**
    """
    return await recruitment_service.create_request(session, data, employee_id)


@router.get(
    "/requests",
    response_model=List[RecruitmentRequestResponse],
    summary="List recruitment requests"
)
async def list_recruitment_requests(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status"),
    department: Optional[str] = Query(None, description="Filter by department"),
    role: str = Depends(require_role(["admin", "hr"])),
    session: AsyncSession = Depends(get_session)
):
    """
    List all recruitment requests with optional filters.

    **Admin and HR only.**
    """
    return await recruitment_service.list_requests(session, status_filter, department)


@router.get(
    "/requests/{request_id}",
    response_model=RecruitmentRequestResponse,
    summary="Get recruitment request"
)
async def get_recruitment_request(
    request_id: int,
    role: str = Depends(require_role(["admin", "hr"])),
    session: AsyncSession = Depends(get_session)
):
    """
    Get recruitment request details by ID.

    **Admin and HR only.**
    """
    request = await recruitment_service.get_request(session, request_id)
    if not request:
        raise HTTPException(status_code=404, detail="Recruitment request not found")
    return request


@router.put(
    "/requests/{request_id}",
    response_model=RecruitmentRequestResponse,
    summary="Update recruitment request"
)
async def update_recruitment_request(
    request_id: int,
    data: RecruitmentRequestUpdate,
    role: str = Depends(require_role(["admin", "hr"])),
    session: AsyncSession = Depends(get_session)
):
    """
    Update a recruitment request.

    **Admin and HR only.**
    """
    request = await recruitment_service.update_request(session, request_id, data)
    if not request:
        raise HTTPException(status_code=404, detail="Recruitment request not found")
    return request


@router.post(
    "/requests/{request_id}/approve",
    response_model=RecruitmentRequestResponse,
    summary="Approve recruitment request"
)
async def approve_recruitment_request(
    request_id: int,
    approval_type: str = Query(..., description="Type: requisition, budget, or offer"),
    employee_id: str = Depends(get_current_employee_id),
    role: str = Depends(require_role(["admin", "hr"])),
    session: AsyncSession = Depends(get_session)
):
    """
    Approve a recruitment request.

    Approval types:
    - `requisition`: Approve the job requisition
    - `budget`: Approve the salary budget
    - `offer`: Approve the offer to be extended

    **Admin and HR only.**
    """
    try:
        request = await recruitment_service.approve_request(
            session, request_id, approval_type, employee_id
        )
        if not request:
            raise HTTPException(status_code=404, detail="Recruitment request not found")
        return request
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get(
    "/manager/{manager_id}/passes",
    response_model=List[dict],
    summary="Get all recruitment passes for a manager"
)
async def get_manager_passes(
    manager_id: str,
    session: AsyncSession = Depends(get_session)
):
    """
    Get all recruitment requests/passes for a specific manager.
    
    Used by ManagerPassDashboard when a manager has multiple recruitment requests.
    Each recruitment request = 1 position = 1 pass.
    """
    from app.models.recruitment import RecruitmentRequest, Candidate, ManagerPass
    from sqlalchemy import select, func
    from datetime import datetime, timezone
    
    # Get all recruitment requests for this manager
    result = await session.execute(
        select(RecruitmentRequest).where(
            RecruitmentRequest.hiring_manager_id == manager_id
        ).order_by(RecruitmentRequest.created_at.desc())
    )
    requests = result.scalars().all()
    
    passes = []
    for req in requests:
        # Get candidate counts
        candidate_result = await session.execute(
            select(func.count(Candidate.id)).where(
                Candidate.recruitment_request_id == req.id
            )
        )
        total_candidates = candidate_result.scalar() or 0
        
        # Get shortlisted count (screening + interview + offer)
        shortlisted_result = await session.execute(
            select(func.count(Candidate.id)).where(
                Candidate.recruitment_request_id == req.id,
                Candidate.stage.in_(['screening', 'interview', 'offer', 'hired'])
            )
        )
        shortlisted = shortlisted_result.scalar() or 0
        
        # Get interviewed count
        interviewed_result = await session.execute(
            select(func.count(Candidate.id)).where(
                Candidate.recruitment_request_id == req.id,
                Candidate.stage.in_(['interview', 'offer', 'hired'])
            )
        )
        interviewed = interviewed_result.scalar() or 0
        
        # Calculate days since request
        days_since = (datetime.now(timezone.utc) - req.created_at).days if req.created_at else 0
        
        # Get manager pass info
        pass_result = await session.execute(
            select(ManagerPass).where(
                ManagerPass.recruitment_request_id == req.id
            )
        )
        manager_pass = pass_result.scalar_one_or_none()
        
        passes.append({
            "id": req.id,
            "pass_id": manager_pass.pass_id if manager_pass else f"MGR-{req.id}",
            "position_title": req.position_title,
            "department": req.department,
            "status": req.status,
            "total_candidates": total_candidates,
            "candidates_shortlisted": shortlisted,
            "candidates_interviewed": interviewed,
            "days_since_request": days_since,
            "priority": getattr(req, 'priority', 'normal') or 'normal',
            "created_at": req.created_at.isoformat() if req.created_at else None,
            "entity": getattr(req, 'entity', None)
        })
    
    return passes


# ============================================================================
# CANDIDATES
# ============================================================================

@router.get(
    "/requests/{request_id}/candidates",
    response_model=List[dict],
    summary="Get candidates for a recruitment request"
)
async def get_candidates_for_request(
    request_id: int,
    session: AsyncSession = Depends(get_session)
):
    """
    Get list of candidates for a specific recruitment request.
    Used by manager pass to view applicants. Accessible via pass token.
    
    Returns PIPELINE VIEW fields only (LOCKED DESIGN):
    - Identity: Name, Current Job Title, Current Company
    - Role Fit: Position, Years of Experience, Location
    - Progress: Stage, Status, Assessment Status, Interview Status
    - Signals: Assessment Score, Interview Outcome
    - Risk: Days in Stage, On Hold Flag
    """
    from app.models.recruitment import Candidate, RecruitmentRequest, Assessment
    from sqlalchemy import select
    from datetime import datetime, timezone
    
    # Get recruitment request for position info
    req_result = await session.execute(
        select(RecruitmentRequest).where(RecruitmentRequest.id == request_id)
    )
    req = req_result.scalar_one_or_none()
    
    result = await session.execute(
        select(Candidate).where(
            Candidate.recruitment_request_id == request_id
        ).order_by(Candidate.created_at.desc())
    )
    candidates = result.scalars().all()
    
    pipeline_candidates = []
    for c in candidates:
        # Calculate days in stage
        stage_date = getattr(c, 'stage_changed_at', None) or c.created_at
        days_in_stage = (datetime.now(timezone.utc) - stage_date).days if stage_date else 0
        
        # Get assessment status
        assessment_result = await session.execute(
            select(Assessment).where(
                Assessment.candidate_id == c.id
            ).order_by(Assessment.created_at.desc())
        )
        assessment = assessment_result.scalar_one_or_none()
        assessment_status = getattr(assessment, 'status', None) if assessment else 'none'
        assessment_score = getattr(assessment, 'score', None) if assessment else None
        
        # Determine interview status from candidate status
        interview_status = 'none'
        if c.stage == 'interview':
            if 'scheduled' in (c.status or '').lower():
                interview_status = 'scheduled'
            elif 'completed' in (c.status or '').lower():
                interview_status = 'completed'
            elif 'no_show' in (c.status or '').lower():
                interview_status = 'no_show'
            else:
                interview_status = 'pending'
        
        pipeline_candidates.append({
            "id": c.id,
            "candidate_number": c.candidate_number,
            # Identity (from CV - auto)
            "full_name": c.full_name,
            "current_job_title": getattr(c, 'current_position', None),
            "current_company": getattr(c, 'current_company', None),
            # Role Fit
            "recruitment_request_id": c.recruitment_request_id,
            "position_title": req.position_title if req else "",
            "years_experience": getattr(c, 'years_experience', None),
            "current_location": getattr(c, 'current_location', None),
            # Progress (System)
            "stage": c.stage,
            "status": c.status,
            "assessment_status": assessment_status,
            "interview_status": interview_status,
            # Signals
            "assessment_score": assessment_score,
            "interview_outcome": None,  # To be derived from evaluation
            # Risk
            "days_in_stage": days_in_stage,
            "on_hold": c.status == 'on_hold' if c.status else False,
            # Internal (for filtering, not display)
            "department": req.department if req else "",
            "entity": getattr(req, 'entity', None) if req else None,
            "applied_at": c.created_at.isoformat() if c.created_at else None
        })
    
    return pipeline_candidates


@router.post(
    "/candidates",
    response_model=CandidateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add candidate"
)
async def add_candidate(
    data: CandidateCreate,
    employee_id: str = Depends(get_current_employee_id),
    role: str = Depends(require_role(["admin", "hr"])),
    session: AsyncSession = Depends(get_session)
):
    """
    Add a new candidate manually.

    Auto-generates:
    - Candidate number (CAN-YYYYMMDD-XXXX)
    - Candidate pass

    **Admin and HR only.**
    """
    return await recruitment_service.add_candidate(session, data, employee_id)


@router.get(
    "/candidates",
    response_model=List[CandidateResponse],
    summary="List candidates"
)
async def list_candidates(
    recruitment_request_id: Optional[int] = Query(None, description="Filter by request"),
    stage: Optional[str] = Query(None, description="Filter by stage"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status"),
    role: str = Depends(require_role(["admin", "hr"])),
    session: AsyncSession = Depends(get_session)
):
    """
    List all candidates with optional filters.

    **Admin and HR only.**
    """
    return await recruitment_service.list_candidates(
        session, recruitment_request_id, stage, status_filter
    )


@router.get(
    "/candidates/{candidate_id}",
    response_model=CandidateResponse,
    summary="Get candidate"
)
async def get_candidate(
    candidate_id: int,
    role: str = Depends(require_role(["admin", "hr"])),
    session: AsyncSession = Depends(get_session)
):
    """
    Get candidate details by ID.

    **Admin and HR only.**
    """
    candidate = await recruitment_service.get_candidate(session, candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return candidate


@router.put(
    "/candidates/{candidate_id}",
    response_model=CandidateResponse,
    summary="Update candidate"
)
async def update_candidate(
    candidate_id: int,
    data: CandidateUpdate,
    role: str = Depends(require_role(["admin", "hr"])),
    session: AsyncSession = Depends(get_session)
):
    """
    Update a candidate.

    **Admin and HR only.**
    """
    candidate = await recruitment_service.update_candidate(session, candidate_id, data)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return candidate


@router.post(
    "/candidates/{candidate_id}/stage",
    response_model=CandidateResponse,
    summary="Move candidate stage"
)
async def move_candidate_stage(
    candidate_id: int,
    new_stage: str = Query(..., description="New stage: applied, screening, interview, offer, hired"),
    role: str = Depends(require_role(["admin", "hr"])),
    session: AsyncSession = Depends(get_session)
):
    """
    Move candidate to a new stage in the pipeline.

    Stages: applied → screening → interview → offer → hired

    **Admin and HR only.**
    """
    try:
        return await recruitment_service.move_candidate_stage(session, candidate_id, new_stage)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post(
    "/candidates/{candidate_id}/reject",
    response_model=CandidateResponse,
    summary="Reject candidate"
)
async def reject_candidate(
    candidate_id: int,
    reason: str = Query(..., description="Rejection reason"),
    role: str = Depends(require_role(["admin", "hr"])),
    session: AsyncSession = Depends(get_session)
):
    """
    Reject a candidate.

    **Admin and HR only.**
    """
    try:
        return await recruitment_service.reject_candidate(session, candidate_id, reason)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post(
    "/candidates/{candidate_id}/self-service-update",
    response_model=CandidateResponse,
    summary="Update candidate details (self-service)"
)
@limiter.limit("5/minute")
async def update_candidate_details_self_service(
    request: Request,
    candidate_id: int,
    data: CandidateSelfServiceUpdate,
    session: AsyncSession = Depends(get_session)
):
    """
    Update candidate details (self-service).
    
    This endpoint allows candidates to update their own profile information
    including phone, email, location, visa status, notice period, and expected salary.
    
    Security:
    - Requires cryptographically secure pass_token (64 hex chars) in request body
    - Rate limited to 5 requests per minute per IP
    - Constant-time token comparison to prevent timing attacks
    """
    from datetime import datetime, timezone
    
    candidate = await recruitment_service.get_candidate(session, candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    # Verify pass_token matches using constant-time comparison
    if not candidate.pass_token or not hmac.compare_digest(candidate.pass_token, data.pass_token):
        raise HTTPException(status_code=403, detail="Invalid pass token")
    
    # Build update data from self-service fields only
    update_data = {}
    if data.phone is not None:
        update_data['phone'] = data.phone
    if data.email is not None:
        update_data['email'] = data.email
    if data.current_location is not None:
        update_data['current_location'] = data.current_location
    if data.visa_status is not None:
        update_data['visa_status'] = data.visa_status
    if data.notice_period_days is not None:
        update_data['notice_period_days'] = data.notice_period_days
    if data.expected_salary is not None:
        update_data['expected_salary'] = data.expected_salary
    if data.details_confirmed is not None:
        update_data['details_confirmed_by_candidate'] = data.details_confirmed
        if data.details_confirmed:
            update_data['details_confirmed_at'] = datetime.now(timezone.utc)
    
    update_data['last_updated_by'] = 'Candidate'
    
    updated = await recruitment_service.update_candidate(
        session, candidate_id, CandidateUpdate(**update_data)
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Failed to update candidate")
    return updated


@router.get(
    "/pipeline",
    summary="Get pipeline counts"
)
async def get_pipeline_counts(
    recruitment_request_id: Optional[int] = Query(None, description="Filter by request"),
    role: str = Depends(require_role(["admin", "hr"])),
    session: AsyncSession = Depends(get_session)
):
    """
    Get count of candidates by pipeline stage.

    **Admin and HR only.**
    """
    return await recruitment_service.get_pipeline_counts(session, recruitment_request_id)


@router.post(
    "/candidates/{candidate_id}/upload-cv",
    summary="Upload CV and trigger scoring"
)
async def upload_candidate_cv(
    candidate_id: int,
    file: UploadFile = File(...),
    role: str = Depends(require_role(["admin", "hr"])),
    session: AsyncSession = Depends(get_session)
):
    """
    Upload a CV for an existing candidate and automatically score it.
    
    Supports: PDF, DOCX, TXT files.
    
    Automatically calculates:
    - CV Scoring (overall match %)
    - Core Skills Match %
    - Education level
    - Years of experience
    
    **Admin and HR only.**
    """
    # Get candidate and their recruitment request
    candidate = await recruitment_service.get_candidate(session, candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    # Get job details from recruitment request
    request = await recruitment_service.get_request(session, candidate.recruitment_request_id)
    if not request:
        raise HTTPException(status_code=404, detail="Recruitment request not found")
    
    # Read file content
    content = await file.read()
    filename = file.filename or "resume.pdf"
    
    # Save CV to storage
    resume_dir = Path("storage/resumes")
    resume_dir.mkdir(parents=True, exist_ok=True)
    resume_path = resume_dir / f"{candidate.candidate_number}_{filename}"
    
    with open(resume_path, 'wb') as f:
        f.write(content)
    
    # Score the CV against job requirements
    job_description = request.job_description or f"Position: {request.position_title}"
    required_skills = getattr(request, 'required_skills', None) or []
    
    scores = await score_candidate_cv(
        candidate_id=candidate_id,
        cv_content=content,
        filename=filename,
        job_title=request.position_title,
        job_description=job_description,
        required_skills=required_skills,
        db_session=session
    )
    
    if scores:
        return {
            "success": True,
            "candidate_id": candidate_id,
            "filename": filename,
            "resume_path": str(resume_path),
            "scores": {
                "cv_scoring": scores["cv_scoring"],
                "skills_match_score": scores["skills_match_score"],
                "education_level": scores["education_level"],
                "years_experience": scores["years_experience"],
                "current_position": scores["current_position"]
            }
        }
    else:
        # CV saved but scoring failed
        return {
            "success": True,
            "candidate_id": candidate_id,
            "filename": filename,
            "resume_path": str(resume_path),
            "scores": None,
            "message": "CV uploaded but automatic scoring could not be completed"
        }


# ============================================================================
# AUTOMATED RESUME PARSING
# ============================================================================

@router.get("/parse-resume/status", summary="Check resume parsing availability")
async def check_resume_parsing_status():
    """Check if automated resume parsing is available."""
    return {
        "available": resume_parser_service.is_available(),
        "supported_formats": resume_parser_service.get_supported_formats()
    }


@router.post("/parse-resume", summary="Parse resume")
async def parse_resume(
    file: UploadFile = File(...),
    role: str = Depends(require_role(["admin", "hr"]))
):
    """
    Parse uploaded resume to extract candidate data.

    Supports: PDF, DOCX, DOC, TXT

    Returns structured data: name, email, phone, skills, experience, education

    **Admin and HR only.**
    """
    # Save uploaded file temporarily
    suffix = Path(file.filename).suffix if file.filename else '.pdf'
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp_file:
        content = await file.read()
        tmp_file.write(content)
        tmp_file_path = tmp_file.name

    try:
        # Parse resume
        parsed_data = await resume_parser_service.parse_resume(tmp_file_path)

        return {
            "success": parsed_data.get('parsed', False),
            "filename": file.filename,
            "data": parsed_data
        }

    finally:
        # Clean up temp file
        if os.path.exists(tmp_file_path):
            os.remove(tmp_file_path)


@router.post(
    "/candidates/from-resume",
    response_model=CandidateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create candidate from resume"
)
async def create_candidate_from_resume(
    file: UploadFile = File(...),
    recruitment_request_id: int = Query(..., description="Recruitment request ID"),
    source: str = Query("Resume Upload", description="Candidate source"),
    employee_id: str = Depends(get_current_employee_id),
    role: str = Depends(require_role(["admin", "hr"])),
    session: AsyncSession = Depends(get_session)
):
    """
    Create candidate directly from resume using automated parsing.

    Automatically extracts and populates candidate data from resume.

    **Admin and HR only.**
    """
    # Save uploaded file temporarily
    suffix = Path(file.filename).suffix if file.filename else '.pdf'
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp_file:
        content = await file.read()
        tmp_file.write(content)
        tmp_file_path = tmp_file.name

    try:
        # Parse resume
        parsed_data = await resume_parser_service.parse_resume(tmp_file_path)

        if not parsed_data.get('parsed'):
            raise HTTPException(
                status_code=400,
                detail=f"Failed to parse resume: {parsed_data.get('error', 'Unknown error')}"
            )

        # Validate we got minimum required data
        if not parsed_data.get('name') and not parsed_data.get('email'):
            raise HTTPException(
                status_code=400,
                detail="Could not extract name or email from resume. Please add candidate manually."
            )

        # Build notes from parsed data
        notes_parts = []
        if parsed_data.get('skills'):
            notes_parts.append(f"Skills: {', '.join(parsed_data['skills'][:10])}")
        if parsed_data.get('education'):
            notes_parts.append(f"Education: {', '.join(parsed_data['education'][:3])}")
        if parsed_data.get('company_names'):
            notes_parts.append(f"Previous companies: {', '.join(parsed_data['company_names'][:3])}")

        # Create candidate from parsed data
        candidate_data = CandidateCreate(
            recruitment_request_id=recruitment_request_id,
            full_name=parsed_data.get('name') or 'Unknown',
            email=parsed_data.get('email') or 'unknown@example.com',
            phone=parsed_data.get('mobile_number'),
            current_position=(
                parsed_data.get('designation', [''])[0]
                if parsed_data.get('designation') else None
            ),
            current_company=(
                parsed_data.get('company_names', [''])[0]
                if parsed_data.get('company_names') else None
            ),
            years_experience=parsed_data.get('total_experience'),
            source=source,
            notes='\n'.join(notes_parts) if notes_parts else None,
            emirates_id=parsed_data.get('emirates_id'),
            visa_status=parsed_data.get('visa_status')
        )

        # Create candidate
        candidate = await recruitment_service.add_candidate(session, candidate_data, employee_id)

        # Save resume file
        resume_dir = Path("storage/resumes")
        resume_dir.mkdir(parents=True, exist_ok=True)
        resume_path = resume_dir / f"{candidate.candidate_number}_{file.filename}"

        with open(resume_path, 'wb') as f:
            f.write(content)

        # Update candidate with resume path
        await recruitment_service.update_candidate(
            session, candidate.id,
            CandidateUpdate(notes=f"{candidate.notes or ''}\nResume: {resume_path}".strip())
        )

        # Get recruitment request for job details
        request = await recruitment_service.get_request(session, recruitment_request_id)
        if request:
            # Automatically score the CV against job requirements
            job_description = request.job_description or f"Position: {request.position_title}"
            required_skills = getattr(request, 'required_skills', None) or []
            
            await score_candidate_cv(
                candidate_id=candidate.id,
                cv_content=content,
                filename=file.filename or "resume.pdf",
                job_title=request.position_title,
                job_description=job_description,
                required_skills=required_skills,
                db_session=session
            )

        # Refresh to get updated data including scores
        candidate = await recruitment_service.get_candidate(session, candidate.id)

        return candidate

    finally:
        if os.path.exists(tmp_file_path):
            os.remove(tmp_file_path)


# ============================================================================
# INTERVIEWS
# ============================================================================

@router.post(
    "/interviews",
    response_model=InterviewResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Schedule interview"
)
async def schedule_interview(
    data: InterviewCreate,
    role: str = Depends(require_role(["admin", "hr"])),
    session: AsyncSession = Depends(get_session)
):
    """
    Schedule a new interview.

    Auto-generates interview number (INT-YYYYMMDD-XXXX).

    **Admin and HR only.**
    """
    return await recruitment_service.create_interview(session, data)


@router.get(
    "/interviews",
    response_model=List[InterviewResponse],
    summary="List interviews"
)
async def list_interviews(
    candidate_id: Optional[int] = Query(None, description="Filter by candidate"),
    recruitment_request_id: Optional[int] = Query(None, description="Filter by request"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status"),
    role: str = Depends(require_role(["admin", "hr"])),
    session: AsyncSession = Depends(get_session)
):
    """
    List all interviews with optional filters.

    **Admin and HR only.**
    """
    return await recruitment_service.list_interviews(
        session, candidate_id, recruitment_request_id, status_filter
    )


@router.get(
    "/interviews/{interview_id}",
    response_model=InterviewResponse,
    summary="Get interview"
)
async def get_interview(
    interview_id: int,
    role: str = Depends(require_role(["admin", "hr"])),
    session: AsyncSession = Depends(get_session)
):
    """
    Get interview details by ID.

    **Admin and HR only.**
    """
    interview = await recruitment_service.get_interview(session, interview_id)
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    return interview


@router.post(
    "/interviews/{interview_id}/slots",
    response_model=InterviewResponse,
    summary="Provide interview slots"
)
async def provide_interview_slots(
    interview_id: int,
    slots: InterviewSlotsProvide,
    role: str = Depends(require_role(["admin", "hr"])),
    session: AsyncSession = Depends(get_session)
):
    """
    Provide available time slots for an interview (by hiring manager).

    **Admin and HR only.**
    """
    try:
        return await recruitment_service.provide_interview_slots(session, interview_id, slots)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post(
    "/interviews/{interview_id}/confirm",
    response_model=InterviewResponse,
    summary="Confirm interview slot"
)
async def confirm_interview_slot(
    interview_id: int,
    confirmation: InterviewSlotConfirm,
    session: AsyncSession = Depends(get_session)
):
    """
    Confirm a selected interview slot (by candidate via pass).

    This endpoint does not require admin/hr role as it's accessed via candidate pass.
    """
    try:
        return await recruitment_service.confirm_interview_slot(
            session, interview_id, confirmation
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


class CandidateSlotSelection(InterviewSlotConfirm):
    """Schema for candidate slot selection with pass token validation."""
    pass_token: str


@router.post(
    "/interviews/{interview_id}/select-slot",
    response_model=InterviewResponse,
    summary="Select interview slot (candidate self-service)"
)
@limiter.limit("10/minute")
async def select_interview_slot(
    request: Request,
    interview_id: int,
    selection: CandidateSlotSelection,
    session: AsyncSession = Depends(get_session)
):
    """
    Select an interview slot (by candidate via their pass).
    
    This endpoint is accessed by candidates through their pass.
    Once a slot is selected:
    1. The slot is marked as booked
    2. The slot becomes unavailable to other candidates for the same position
    3. The interview status changes to 'scheduled'
    
    Security:
    - Requires cryptographically secure pass_token (64 hex chars)
    - Rate limited to 10 requests per minute per IP
    - Validates candidate owns the interview
    """
    # Get interview
    interview = await recruitment_service.get_interview(session, interview_id)
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    
    # Get candidate
    candidate = await recruitment_service.get_candidate(session, interview.candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    # Verify pass_token using constant-time comparison
    if not candidate.pass_token or not hmac.compare_digest(candidate.pass_token, selection.pass_token):
        raise HTTPException(status_code=403, detail="Invalid pass token")
    
    # Validate interview belongs to this candidate
    if interview.candidate_id != candidate.id:
        raise HTTPException(status_code=403, detail="Interview does not belong to this candidate")
    
    try:
        return await recruitment_service.confirm_interview_slot(
            session, interview_id, selection, candidate_id=candidate.id
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post(
    "/interviews/{interview_id}/complete",
    response_model=InterviewResponse,
    summary="Complete interview"
)
async def complete_interview(
    interview_id: int,
    notes: Optional[str] = Query(None, description="Interview notes"),
    role: str = Depends(require_role(["admin", "hr"])),
    session: AsyncSession = Depends(get_session)
):
    """
    Mark an interview as completed.

    **Admin and HR only.**
    """
    try:
        return await recruitment_service.complete_interview(session, interview_id, notes)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ============================================================================
# EVALUATIONS
# ============================================================================

@router.post(
    "/evaluations",
    response_model=EvaluationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit evaluation"
)
async def submit_evaluation(
    data: EvaluationCreate,
    employee_id: str = Depends(get_current_employee_id),
    role: str = Depends(require_role(["admin", "hr"])),
    session: AsyncSession = Depends(get_session)
):
    """
    Submit an interview evaluation.

    Auto-generates evaluation number (EVL-YYYYMMDD-XXXX).

    **Admin and HR only.**
    """
    return await recruitment_service.create_evaluation(session, data, employee_id)


@router.get(
    "/evaluations",
    response_model=List[EvaluationResponse],
    summary="List evaluations"
)
async def list_evaluations(
    candidate_id: Optional[int] = Query(None, description="Filter by candidate"),
    interview_id: Optional[int] = Query(None, description="Filter by interview"),
    role: str = Depends(require_role(["admin", "hr"])),
    session: AsyncSession = Depends(get_session)
):
    """
    List all evaluations with optional filters.

    **Admin and HR only.**
    """
    return await recruitment_service.list_evaluations(session, candidate_id, interview_id)


@router.get(
    "/evaluations/{evaluation_id}",
    response_model=EvaluationResponse,
    summary="Get evaluation"
)
async def get_evaluation(
    evaluation_id: int,
    role: str = Depends(require_role(["admin", "hr"])),
    session: AsyncSession = Depends(get_session)
):
    """
    Get evaluation details by ID.

    **Admin and HR only.**
    """
    evaluation = await recruitment_service.get_evaluation(session, evaluation_id)
    if not evaluation:
        raise HTTPException(status_code=404, detail="Evaluation not found")
    return evaluation


# ============================================================================
# BULK OPERATIONS (EFFICIENCY ENDPOINTS)
# ============================================================================

@router.post(
    "/candidates/bulk/stage",
    response_model=BulkOperationResult,
    summary="Bulk update candidate stages"
)
async def bulk_update_candidate_stage(
    data: BulkCandidateStageUpdate,
    role: str = Depends(require_role(["admin", "hr"])),
    session: AsyncSession = Depends(get_session)
):
    """
    Bulk update multiple candidates to a new stage.
    
    Efficiently moves multiple candidates through the pipeline at once,
    reducing processing time for shortlisting and stage transitions.
    
    Maximum 100 candidates per request.

    **Admin and HR only.**
    """
    try:
        result = await recruitment_service.bulk_update_stage(
            session, data.candidate_ids, data.new_stage, data.notes
        )
        return BulkOperationResult(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post(
    "/candidates/bulk/reject",
    response_model=BulkOperationResult,
    summary="Bulk reject candidates"
)
async def bulk_reject_candidates(
    data: BulkCandidateReject,
    role: str = Depends(require_role(["admin", "hr"])),
    session: AsyncSession = Depends(get_session)
):
    """
    Bulk reject multiple candidates at once.
    
    Efficiently rejects multiple candidates with a single reason,
    reducing processing time for screening decisions.
    
    Maximum 100 candidates per request.

    **Admin and HR only.**
    """
    result = await recruitment_service.bulk_reject_candidates(
        session, data.candidate_ids, data.rejection_reason
    )
    return BulkOperationResult(**result)


# ============================================================================
# ENHANCED ANALYTICS
# ============================================================================

@router.get(
    "/metrics",
    response_model=RecruitmentMetrics,
    summary="Get detailed recruitment metrics"
)
async def get_recruitment_metrics(
    role: str = Depends(require_role(["admin", "hr"])),
    session: AsyncSession = Depends(get_session)
):
    """
    Get detailed recruitment metrics for dashboard and analytics.
    
    Includes:
    - Request and candidate counts
    - Pipeline distribution by stage, source, and status
    - Conversion rates between stages
    - SLA tracking (overdue requests)
    - Priority distribution

    **Admin and HR only.**
    """
    return await recruitment_service.get_recruitment_metrics(session)
