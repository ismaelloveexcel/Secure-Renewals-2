from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class NominationCreate(BaseModel):
    nominee_id: int = Field(..., description="Employee ID of the nominee")
    justification: str = Field(..., min_length=50, max_length=2000, description="Why this employee deserves the award")
    achievements: Optional[str] = Field(None, max_length=1500, description="Key achievements")
    impact_description: Optional[str] = Field(None, max_length=1500, description="Impact on team/organization")


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
    expires_in_minutes: int = 15


class NominationSubmitRequest(BaseModel):
    """Request to submit nomination with verification token"""
    nominee_id: int = Field(..., description="Employee ID of the nominee")
    justification: str = Field(..., min_length=50, max_length=2000, description="Why this employee deserves the award")
    achievements: Optional[str] = Field(None, max_length=1500, description="Key achievements")
    impact_description: Optional[str] = Field(None, max_length=1500, description="Impact on team/organization")
    verification_token: str = Field(..., description="Token from identity verification step")


class ManagerNominationStatus(BaseModel):
    """Status of a manager's nomination for the year"""
    has_nominated: bool = Field(..., description="Whether the manager has already submitted a nomination")
    nomination: Optional[NominationResponse] = Field(None, description="The nomination if already submitted")
    can_nominate: bool = Field(..., description="Whether the manager can still submit a nomination")
