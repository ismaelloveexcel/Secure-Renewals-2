"""Interview scheduling API endpoints."""
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.auth.dependencies import require_role
from app.routers.auth import get_current_employee_id
from app.services.interview_service import interview_service
from app.schemas.interview import (
    InterviewSetupCreate, InterviewSetupUpdate, InterviewSetupResponse,
    InterviewSlotBulkCreate, InterviewSlotResponse,
    SlotBookingRequest, SlotConfirmRequest,
    PassMessageCreate, PassMessageResponse,
    RecruitmentDocumentCreate, RecruitmentDocumentResponse,
    CandidatePassData, ManagerPassData
)

router = APIRouter(prefix="/interview", tags=["Interview Scheduling"])


@router.post("/setup", response_model=InterviewSetupResponse)
async def create_interview_setup(
    data: InterviewSetupCreate,
    session: AsyncSession = Depends(get_session),
    current_employee_id: str = Depends(get_current_employee_id)
):
    """Create interview setup for a position (HR/Admin/Manager)."""
    return await interview_service.create_interview_setup(
        session, data, current_employee_id or "system"
    )


@router.get("/setup/{recruitment_request_id}", response_model=Optional[InterviewSetupResponse])
async def get_interview_setup(
    recruitment_request_id: int,
    session: AsyncSession = Depends(get_session)
):
    """Get interview setup for a position."""
    return await interview_service.get_interview_setup(session, recruitment_request_id)


@router.put("/setup/{setup_id}", response_model=InterviewSetupResponse)
async def update_interview_setup(
    setup_id: int,
    data: InterviewSetupUpdate,
    session: AsyncSession = Depends(get_session),
    _: str = Depends(require_role(["admin", "hr"]))
):
    """Update interview setup."""
    return await interview_service.update_interview_setup(session, setup_id, data)


@router.post("/slots/bulk", response_model=List[InterviewSlotResponse])
async def create_slots_bulk(
    data: InterviewSlotBulkCreate,
    session: AsyncSession = Depends(get_session),
    _: str = Depends(require_role(["admin", "hr"]))
):
    """Create multiple interview slots at once."""
    return await interview_service.create_slots_bulk(session, data)


@router.get("/slots/{recruitment_request_id}", response_model=List[InterviewSlotResponse])
async def get_available_slots(
    recruitment_request_id: int,
    round_number: int = Query(1, ge=1),
    session: AsyncSession = Depends(get_session)
):
    """Get available interview slots for a position."""
    return await interview_service.get_available_slots(session, recruitment_request_id, round_number)


@router.post("/slots/book", response_model=InterviewSlotResponse)
async def book_slot(
    data: SlotBookingRequest,
    session: AsyncSession = Depends(get_session)
):
    """Book an interview slot for a candidate."""
    return await interview_service.book_slot(session, data.slot_id, data.candidate_id)


@router.post("/slots/confirm", response_model=InterviewSlotResponse)
async def confirm_slot(
    data: SlotConfirmRequest,
    candidate_id: int = Query(...),
    session: AsyncSession = Depends(get_session)
):
    """Confirm a booked interview slot."""
    return await interview_service.confirm_slot(session, data.slot_id, candidate_id)


@router.get("/confirmed/{recruitment_request_id}", response_model=List[InterviewSlotResponse])
async def get_confirmed_interviews(
    recruitment_request_id: int,
    session: AsyncSession = Depends(get_session),
    _: str = Depends(require_role(["admin", "hr"]))
):
    """Get all confirmed interviews for a position."""
    return await interview_service.get_confirmed_interviews(session, recruitment_request_id)


@router.post("/messages", response_model=PassMessageResponse)
async def create_message(
    data: PassMessageCreate,
    session: AsyncSession = Depends(get_session)
):
    """Send a message to pass inbox."""
    return await interview_service.create_message(session, data)


@router.get("/messages/{pass_type}/{pass_holder_id}", response_model=List[PassMessageResponse])
async def get_inbox(
    pass_type: str,
    pass_holder_id: int,
    session: AsyncSession = Depends(get_session)
):
    """Get inbox messages for a pass holder."""
    return await interview_service.get_inbox(session, pass_type, pass_holder_id)


@router.put("/messages/{message_id}/read", response_model=PassMessageResponse)
async def mark_message_read(
    message_id: int,
    session: AsyncSession = Depends(get_session)
):
    """Mark a message as read."""
    return await interview_service.mark_message_read(session, message_id)


@router.post("/documents", response_model=RecruitmentDocumentResponse)
async def create_document(
    data: RecruitmentDocumentCreate,
    session: AsyncSession = Depends(get_session),
    current_employee_id: str = Depends(get_current_employee_id)
):
    """Upload a recruitment document."""
    return await interview_service.create_document(
        session, data, current_employee_id or "system"
    )


@router.get("/documents/{recruitment_request_id}", response_model=List[RecruitmentDocumentResponse])
async def get_documents(
    recruitment_request_id: int,
    session: AsyncSession = Depends(get_session)
):
    """Get all documents for a position."""
    return await interview_service.get_documents(session, recruitment_request_id)


@router.get("/pass/candidate/{candidate_id}", response_model=CandidatePassData)
async def get_candidate_pass(
    candidate_id: int,
    session: AsyncSession = Depends(get_session)
):
    """Get candidate pass data."""
    return await interview_service.get_candidate_pass_data(session, candidate_id)


@router.get("/pass/manager/{recruitment_request_id}", response_model=ManagerPassData)
async def get_manager_pass(
    recruitment_request_id: int,
    manager_id: str = Query(...),
    session: AsyncSession = Depends(get_session),
    _: str = Depends(require_role(["admin", "hr"]))
):
    """Get manager pass data."""
    return await interview_service.get_manager_pass_data(session, recruitment_request_id, manager_id)
