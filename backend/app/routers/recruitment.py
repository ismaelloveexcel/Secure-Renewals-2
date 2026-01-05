"""API endpoints for recruitment module."""
from typing import List, Optional
from fastapi import (
    APIRouter, Depends, HTTPException, File, UploadFile,
    Query, status
)
from sqlalchemy.ext.asyncio import AsyncSession
import tempfile
import os
from pathlib import Path

from app.auth.dependencies import require_role
from app.database import get_session
from app.routers.auth import get_current_employee_id
from app.schemas.recruitment import (
    RecruitmentRequestCreate, RecruitmentRequestUpdate, RecruitmentRequestResponse,
    CandidateCreate, CandidateUpdate, CandidateResponse,
    InterviewCreate, InterviewUpdate, InterviewResponse,
    InterviewSlotsProvide, InterviewSlotConfirm,
    EvaluationCreate, EvaluationResponse,
    ParsedResumeData, RecruitmentStats,
    StageInfo, InterviewTypeInfo, EmploymentTypeInfo
)
from app.services.recruitment_service import recruitment_service
from app.services.resume_parser import resume_parser_service

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


# ============================================================================
# CANDIDATES
# ============================================================================

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


# ============================================================================
# AI RESUME PARSING
# ============================================================================

@router.get("/parse-resume/status", summary="Check resume parsing availability")
async def check_resume_parsing_status():
    """Check if AI resume parsing is available."""
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
    Parse uploaded resume using AI to extract candidate data.

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
        # Parse resume using AI
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
    Create candidate directly from resume using AI parsing.

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
        # Parse using AI
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

        # Refresh to get updated data
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
