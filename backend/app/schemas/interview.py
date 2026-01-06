"""Interview scheduling schemas."""
from datetime import datetime, date, time
from typing import Optional, List, Any
from pydantic import BaseModel, Field, ConfigDict


class InterviewSetupBase(BaseModel):
    """Base schema for interview setup."""
    technical_assessment_required: bool = False
    interview_format: str = Field(default="online", description="online, in-person, hybrid")
    interview_rounds: int = Field(default=1, ge=1, le=5)
    additional_interviewers: Optional[List[str]] = None
    notes: Optional[str] = None


class InterviewSetupCreate(InterviewSetupBase):
    """Create interview setup."""
    recruitment_request_id: int


class InterviewSetupUpdate(BaseModel):
    """Update interview setup."""
    technical_assessment_required: Optional[bool] = None
    interview_format: Optional[str] = None
    interview_rounds: Optional[int] = None
    additional_interviewers: Optional[List[str]] = None
    notes: Optional[str] = None


class InterviewSetupResponse(InterviewSetupBase):
    """Response for interview setup."""
    id: int
    recruitment_request_id: int
    created_by: str
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class InterviewSlotBase(BaseModel):
    """Base schema for interview slot."""
    slot_date: date
    start_time: time
    end_time: time
    round_number: int = 1


class InterviewSlotCreate(InterviewSlotBase):
    """Create interview slot."""
    interview_setup_id: int


class InterviewSlotBulkCreate(BaseModel):
    """Bulk create interview slots."""
    interview_setup_id: int
    dates: List[date]
    time_slots: List[dict]  # [{start_time: "09:00", end_time: "10:00"}, ...]
    round_number: int = 1


class InterviewSlotResponse(InterviewSlotBase):
    """Response for interview slot."""
    id: int
    interview_setup_id: int
    status: str
    booked_by_candidate_id: Optional[int] = None
    booked_at: Optional[datetime] = None
    candidate_confirmed: bool = False
    candidate_confirmed_at: Optional[datetime] = None
    created_at: datetime
    
    # Populated on response
    candidate_name: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)


class SlotBookingRequest(BaseModel):
    """Request to book a slot."""
    slot_id: int
    candidate_id: int


class SlotConfirmRequest(BaseModel):
    """Request to confirm a booked slot."""
    slot_id: int


class PassMessageBase(BaseModel):
    """Base schema for pass message."""
    subject: Optional[str] = None
    message_body: Optional[str] = None
    message_type: str = "general"  # general, document_request, interview_invite, reminder, system
    attachments: Optional[List[dict]] = None


class PassMessageCreate(PassMessageBase):
    """Create pass message."""
    pass_type: str  # candidate, manager
    pass_holder_id: int
    recruitment_request_id: Optional[int] = None
    sender_type: str  # hr, candidate, manager, system
    sender_id: Optional[str] = None


class PassMessageResponse(PassMessageBase):
    """Response for pass message."""
    id: int
    pass_type: str
    pass_holder_id: int
    recruitment_request_id: Optional[int] = None
    sender_type: str
    sender_id: Optional[str] = None
    is_read: bool = False
    read_at: Optional[datetime] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class RecruitmentDocumentBase(BaseModel):
    """Base schema for recruitment document."""
    document_type: str  # job_description, recruitment_form, offer_letter, contract
    document_name: str
    file_path: Optional[str] = None


class RecruitmentDocumentCreate(RecruitmentDocumentBase):
    """Create recruitment document."""
    recruitment_request_id: int


class RecruitmentDocumentResponse(RecruitmentDocumentBase):
    """Response for recruitment document."""
    id: int
    recruitment_request_id: int
    status: str
    submitted_by: Optional[str] = None
    submitted_at: Optional[datetime] = None
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    version: int
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class CandidatePassData(BaseModel):
    """Data structure for candidate pass view."""
    # Pass info
    pass_id: str
    pass_token: str  # Secure token for QR code
    
    # Candidate info
    candidate_id: int
    candidate_number: str
    full_name: str
    email: str
    phone: Optional[str] = None
    
    # Position info
    position_title: str
    position_id: int
    entity: Optional[str] = None
    
    # Stage tracking
    current_stage: str
    status: str
    stages: List[dict]  # [{name, status, timestamp}]
    
    # Interview
    interview_slots: List[InterviewSlotResponse] = []
    booked_slot: Optional[InterviewSlotResponse] = None
    
    # Messages/Inbox
    unread_messages: int = 0
    
    # Actions
    next_actions: List[dict] = []  # [{action_id, label, type}]
    
    # Contact
    hr_whatsapp: str = "+971564966546"
    hr_email: str = "HR@baynunah.ae"


class ManagerPassData(BaseModel):
    """Data structure for manager pass view."""
    # Pass info
    pass_id: str
    pass_token: str
    
    # Manager info
    manager_id: str
    manager_name: str
    department: str
    
    # Position info
    position_id: int
    position_title: str
    position_status: str
    sla_days: int  # Days since request created
    
    # Documents
    documents: List[RecruitmentDocumentResponse] = []
    jd_status: str = "pending"  # pending, submitted
    recruitment_form_status: str = "pending"
    
    # Pipeline
    pipeline_stats: dict = {}  # {screening: 2, interview: 3, ...}
    total_candidates: int = 0
    
    # Interview setup
    interview_setup: Optional[InterviewSetupResponse] = None
    
    # Calendar (confirmed interviews)
    confirmed_interviews: List[InterviewSlotResponse] = []
    
    # Messages
    unread_messages: int = 0
    
    # Contact
    hr_whatsapp: str = "+971564966546"
    hr_email: str = "HR@baynunah.ae"
