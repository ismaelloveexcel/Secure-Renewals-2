"""Pydantic schemas for recruitment module."""
from datetime import date, datetime
from typing import List, Optional, Dict, Any

from pydantic import BaseModel, EmailStr, Field, ConfigDict


# Recruitment Request Schemas
class RecruitmentRequestBase(BaseModel):
    """Base schema for recruitment requests."""
    position_title: str = Field(..., min_length=1, max_length=200)
    department: str = Field(..., min_length=1, max_length=100)
    hiring_manager_id: Optional[str] = None
    target_hire_date: Optional[date] = None
    headcount: int = Field(default=1, ge=1)
    employment_type: str = Field(..., description="Full-time, Part-time, Contract, Internship")
    job_description: Optional[str] = None
    requirements: Optional[str] = None
    salary_range_min: Optional[float] = Field(None, ge=0)
    salary_range_max: Optional[float] = Field(None, ge=0)


class RecruitmentRequestCreate(RecruitmentRequestBase):
    """Schema for creating a recruitment request."""
    pass


class RecruitmentRequestUpdate(BaseModel):
    """Schema for updating a recruitment request."""
    position_title: Optional[str] = Field(None, min_length=1, max_length=200)
    department: Optional[str] = Field(None, min_length=1, max_length=100)
    hiring_manager_id: Optional[str] = None
    target_hire_date: Optional[date] = None
    headcount: Optional[int] = Field(None, ge=1)
    employment_type: Optional[str] = None
    job_description: Optional[str] = None
    requirements: Optional[str] = None
    salary_range_min: Optional[float] = Field(None, ge=0)
    salary_range_max: Optional[float] = Field(None, ge=0)
    status: Optional[str] = None


class RecruitmentRequestResponse(RecruitmentRequestBase):
    """Response schema for recruitment request."""
    id: int
    request_number: str
    requested_by: str
    request_date: date
    status: str
    approval_status: Optional[Dict[str, Any]] = None
    manager_pass_number: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Candidate Schemas
class CandidateBase(BaseModel):
    """Base schema for candidates."""
    recruitment_request_id: int
    full_name: str = Field(..., min_length=1, max_length=200)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=50)
    current_position: Optional[str] = Field(None, max_length=200)
    current_company: Optional[str] = Field(None, max_length=200)
    years_experience: Optional[int] = Field(None, ge=0)
    expected_salary: Optional[float] = Field(None, ge=0)
    notice_period_days: Optional[int] = Field(None, ge=0)
    source: Optional[str] = Field(None, max_length=100)
    source_details: Optional[str] = None
    linkedin_url: Optional[str] = Field(None, max_length=500)
    notes: Optional[str] = None
    emirates_id: Optional[str] = Field(None, max_length=50)
    visa_status: Optional[str] = Field(None, max_length=100)


class CandidateCreate(CandidateBase):
    """Schema for creating a candidate."""
    pass


class CandidateUpdate(BaseModel):
    """Schema for updating a candidate."""
    full_name: Optional[str] = Field(None, min_length=1, max_length=200)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=50)
    current_position: Optional[str] = Field(None, max_length=200)
    current_company: Optional[str] = Field(None, max_length=200)
    years_experience: Optional[int] = Field(None, ge=0)
    expected_salary: Optional[float] = Field(None, ge=0)
    notice_period_days: Optional[int] = Field(None, ge=0)
    source: Optional[str] = Field(None, max_length=100)
    source_details: Optional[str] = None
    linkedin_url: Optional[str] = Field(None, max_length=500)
    notes: Optional[str] = None
    status: Optional[str] = None
    stage: Optional[str] = None
    rejection_reason: Optional[str] = None
    emirates_id: Optional[str] = Field(None, max_length=50)
    visa_status: Optional[str] = Field(None, max_length=100)


class CandidateResponse(CandidateBase):
    """Response schema for candidate."""
    id: int
    candidate_number: str
    pass_number: Optional[str] = None
    resume_path: Optional[str] = None
    status: str
    stage: str
    stage_changed_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Interview Schemas
class InterviewSlot(BaseModel):
    """Schema for interview time slot."""
    start: datetime
    end: datetime


class InterviewBase(BaseModel):
    """Base schema for interviews."""
    candidate_id: int
    recruitment_request_id: int
    interview_type: str = Field(..., description="phone_screen, technical, hr, manager, panel")
    interview_round: int = Field(default=1, ge=1)
    duration_minutes: int = Field(default=60, ge=15)
    interviewer_ids: Optional[str] = None  # Comma-separated
    location: Optional[str] = Field(None, max_length=200)
    meeting_link: Optional[str] = Field(None, max_length=500)


class InterviewCreate(InterviewBase):
    """Schema for creating an interview."""
    pass


class InterviewUpdate(BaseModel):
    """Schema for updating an interview."""
    interview_type: Optional[str] = None
    interview_round: Optional[int] = Field(None, ge=1)
    duration_minutes: Optional[int] = Field(None, ge=15)
    interviewer_ids: Optional[str] = None
    location: Optional[str] = Field(None, max_length=200)
    meeting_link: Optional[str] = Field(None, max_length=500)
    status: Optional[str] = None
    notes: Optional[str] = None


class InterviewSlotsProvide(BaseModel):
    """Schema for providing availability slots."""
    available_slots: List[InterviewSlot]


class InterviewSlotConfirm(BaseModel):
    """Schema for confirming a selected slot."""
    selected_slot: InterviewSlot


class InterviewResponse(InterviewBase):
    """Response schema for interview."""
    id: int
    interview_number: str
    available_slots: Optional[Dict[str, Any]] = None
    scheduled_date: Optional[datetime] = None
    status: str
    confirmed_by_candidate: bool
    confirmed_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Evaluation Schemas
class EvaluationBase(BaseModel):
    """Base schema for evaluations."""
    interview_id: int
    candidate_id: int
    technical_skills_score: Optional[int] = Field(None, ge=1, le=5)
    communication_score: Optional[int] = Field(None, ge=1, le=5)
    cultural_fit_score: Optional[int] = Field(None, ge=1, le=5)
    overall_score: Optional[int] = Field(None, ge=1, le=5)
    strengths: Optional[str] = None
    concerns: Optional[str] = None
    additional_comments: Optional[str] = None
    recommendation: Optional[str] = Field(None, description="strong_hire, hire, maybe, no_hire")
    next_steps: Optional[str] = None


class EvaluationCreate(EvaluationBase):
    """Schema for creating an evaluation."""
    pass


class EvaluationUpdate(BaseModel):
    """Schema for updating an evaluation."""
    technical_skills_score: Optional[int] = Field(None, ge=1, le=5)
    communication_score: Optional[int] = Field(None, ge=1, le=5)
    cultural_fit_score: Optional[int] = Field(None, ge=1, le=5)
    overall_score: Optional[int] = Field(None, ge=1, le=5)
    strengths: Optional[str] = None
    concerns: Optional[str] = None
    additional_comments: Optional[str] = None
    recommendation: Optional[str] = None
    next_steps: Optional[str] = None


class EvaluationResponse(EvaluationBase):
    """Response schema for evaluation."""
    id: int
    evaluation_number: str
    evaluator_id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Resume Parsing Schemas
class ParsedResumeData(BaseModel):
    """Schema for parsed resume data."""
    name: Optional[str] = None
    email: Optional[str] = None
    mobile_number: Optional[str] = None
    skills: List[str] = []
    experience: List[str] = []
    education: List[str] = []
    designation: List[str] = []
    company_names: List[str] = []
    degree: List[str] = []
    college_name: List[str] = []
    total_experience: Optional[int] = None
    emirates_id: Optional[str] = None
    visa_status: Optional[str] = None
    parsed: bool = False
    error: Optional[str] = None


# Pipeline and Stats Schemas
class PipelineStage(BaseModel):
    """Schema for pipeline stage info."""
    key: str
    name: str
    count: int = 0


class RecruitmentStats(BaseModel):
    """Schema for recruitment statistics."""
    total_requests: int
    active_requests: int
    total_candidates: int
    by_stage: Dict[str, int]
    by_source: Dict[str, int]
    recent_hires: int


class StageInfo(BaseModel):
    """Schema for stage information."""
    key: str
    name: str
    order: int


class InterviewTypeInfo(BaseModel):
    """Schema for interview type information."""
    key: str
    name: str


class EmploymentTypeInfo(BaseModel):
    """Schema for employment type information."""
    key: str
    name: str
