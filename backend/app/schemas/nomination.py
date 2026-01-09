from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


ACHIEVEMENT_CATEGORIES = [
    "Teamwork",
    "Innovation",
    "Customer Service",
    "Leadership",
    "Problem Solving",
    "Excellence",
]


class NominationCreate(BaseModel):
    nominee_id: int = Field(..., description="Employee ID of the nominee")
    justification: str = Field(..., min_length=50, max_length=2000, description="Why this employee deserves the award")
    achievements: Optional[str] = Field(None, max_length=1500, description="Key achievements")
    impact_description: Optional[str] = Field(None, max_length=1500, description="Impact on team/organization")
    achievement_categories: Optional[List[str]] = Field(None, description="Selected achievement categories")


class NominationResponse(BaseModel):
    id: int
    nominee_id: int
    nominee_name: str
    nominee_job_title: Optional[str]
    nominee_department: Optional[str]
    nominator_id: int
    nominator_name: str
    nomination_year: int
    justification: str
    achievements: Optional[str]
    impact_description: Optional[str]
    achievement_categories: Optional[List[str]] = None
    supporting_evidence_paths: Optional[List[str]] = None
    status: str
    reviewed_by: Optional[int]
    reviewer_name: Optional[str]
    reviewed_at: Optional[datetime]
    review_notes: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class NominationUpdate(BaseModel):
    status: str = Field(..., pattern="^(pending|shortlisted|winner|not_selected)$")
    review_notes: Optional[str] = Field(None, max_length=1000)


class NominationContentUpdate(BaseModel):
    """Schema for HR/Admin to edit nomination content"""
    justification: Optional[str] = Field(None, min_length=50, max_length=2000, description="Why this employee deserves the award")
    achievements: Optional[str] = Field(None, max_length=1500, description="Key achievements")
    impact_description: Optional[str] = Field(None, max_length=1500, description="Impact on team/organization")


class NominationReportEntry(BaseModel):
    """Entry for management selection report"""
    id: int
    rank: int
    nominee_name: str
    nominee_job_title: Optional[str]
    nominee_department: Optional[str]
    nominee_entity: Optional[str]
    years_of_service: Optional[int]
    nominator_name: str
    nominator_job_title: Optional[str]
    justification: str
    achievements: Optional[str]
    impact_description: Optional[str]
    status: str
    review_notes: Optional[str]
    reviewer_name: Optional[str]
    created_at: datetime


class ManagementReportResponse(BaseModel):
    """Management report for final selection"""
    year: int
    generated_at: datetime
    total_nominations: int
    shortlisted_count: int
    entries: List[NominationReportEntry]


class EligibleEmployee(BaseModel):
    id: int
    employee_id: str
    name: str
    job_title: Optional[str]
    department: Optional[str]
    profile_photo_path: Optional[str]
    years_of_service: Optional[int]
    already_nominated: bool = False

    model_config = {"from_attributes": True}


class NominationStats(BaseModel):
    total_nominations: int
    pending_count: int
    shortlisted_count: int
    winner_count: int
    not_selected_count: int


class NominationListResponse(BaseModel):
    nominations: List[NominationResponse]
    stats: NominationStats


class EligibleManager(BaseModel):
    """Manager who has direct reports eligible for nomination"""
    id: int
    employee_id: str
    name: str
    job_title: Optional[str]
    department: Optional[str]
    email: Optional[str]
    eligible_reports_count: int

    model_config = {"from_attributes": True}


class VerifyManagerRequest(BaseModel):
    """Request to verify manager identity"""
    manager_id: int = Field(..., description="Database ID of the manager")
    verification_input: str = Field(..., description="Email or Employee ID for verification")


class VerifyManagerResponse(BaseModel):
    """Response containing verification token"""
    success: bool
    token: str = Field(..., description="Short-lived verification token for submission")
    manager_name: str
    expires_in_minutes: int = 30


class NominationSubmitRequest(BaseModel):
    """Request to submit nomination with verification token"""
    nominee_id: int = Field(..., description="Employee ID of the nominee")
    justification: str = Field(..., min_length=50, max_length=2000, description="Why this employee deserves the award")
    achievements: Optional[str] = Field(None, max_length=1500, description="Key achievements")
    impact_description: Optional[str] = Field(None, max_length=1500, description="Impact on team/organization")
    achievement_categories: Optional[List[str]] = Field(None, description="Selected achievement categories")
    verification_token: str = Field(..., description="Token from identity verification step")


class ManagerNominationStatus(BaseModel):
    """Status of a manager's nomination for the year"""
    has_nominated: bool = Field(..., description="Whether the manager has already submitted a nomination")
    nomination: Optional[NominationResponse] = Field(None, description="The nomination if already submitted")
    can_nominate: bool = Field(..., description="Whether the manager can still submit a nomination")


class NominationSettingsBase(BaseModel):
    """Base schema for nomination settings"""
    year: int
    is_open: bool = False
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    announcement_message: Optional[str] = None
    invitation_email_subject: Optional[str] = None
    invitation_email_body: Optional[str] = None


class NominationSettingsResponse(NominationSettingsBase):
    """Response schema for nomination settings"""
    id: int
    last_email_sent_at: Optional[datetime] = None
    emails_sent_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class NominationSettingsUpdate(BaseModel):
    """Update schema for nomination settings"""
    is_open: Optional[bool] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    announcement_message: Optional[str] = None
    invitation_email_subject: Optional[str] = None
    invitation_email_body: Optional[str] = None


class ManagerProgress(BaseModel):
    """Manager nomination progress tracking"""
    id: int
    employee_id: str
    name: str
    email: Optional[str]
    job_title: Optional[str]
    department: Optional[str]
    has_nominated: bool
    nominated_at: Optional[datetime] = None
    nominee_name: Optional[str] = None


class ManagerProgressResponse(BaseModel):
    """Response for manager progress list"""
    managers: List[ManagerProgress]
    total_managers: int
    submitted_count: int
    pending_count: int


class SendInvitationsRequest(BaseModel):
    """Request to send invitation emails"""
    subject: Optional[str] = None
    body: Optional[str] = None
    send_to_all: bool = True
    manager_ids: Optional[List[int]] = None


class SendInvitationsResponse(BaseModel):
    """Response after sending invitations"""
    success: bool
    emails_sent: int
    failed_count: int
    message: str


class PublicNominationInfo(BaseModel):
    """Public info about nomination period for the pass"""
    year: int
    is_open: bool
    deadline: Optional[datetime] = None
    announcement_message: Optional[str] = None
    achievement_categories: List[str] = ACHIEVEMENT_CATEGORIES
