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
    required_skills: Optional[List[str]] = Field(None, description="List of required skills for CV scoring")
    priority: str = Field(default="normal", description="Priority: low, normal, high, urgent")
    expected_start_date: Optional[date] = None
    salary_range_min: Optional[float] = Field(None, ge=0)
    salary_range_max: Optional[float] = Field(None, ge=0)
    # Enhanced fields from JSON analysis
    location: Optional[str] = Field(None, max_length=100, description="Work location: Abu Dhabi HQ, Dubai Office, Remote, Hybrid")
    experience_min: Optional[int] = Field(None, ge=0, description="Minimum years of experience")
    experience_max: Optional[int] = Field(None, ge=0, description="Maximum years of experience")
    education_level: Optional[str] = Field(None, description="Required education: High School, Diploma, Bachelors, Masters, PhD")
    benefits: Optional[List[str]] = Field(None, description="List of benefits/perks")
    reporting_to: Optional[str] = Field(None, max_length=200, description="Position reports to")


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
    required_skills: Optional[List[str]] = None
    priority: Optional[str] = None
    expected_start_date: Optional[date] = None
    salary_range_min: Optional[float] = Field(None, ge=0)
    salary_range_max: Optional[float] = Field(None, ge=0)
    status: Optional[str] = None
    # Enhanced fields from JSON analysis
    location: Optional[str] = None
    experience_min: Optional[int] = Field(None, ge=0)
    experience_max: Optional[int] = Field(None, ge=0)
    education_level: Optional[str] = None
    benefits: Optional[List[str]] = None
    reporting_to: Optional[str] = None


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
    entity: Optional[str] = Field(None, max_length=200)
    current_position: Optional[str] = Field(None, max_length=200)
    current_company: Optional[str] = Field(None, max_length=200)
    years_experience: Optional[int] = Field(None, ge=0)
    industry_function: Optional[str] = Field(None, max_length=200)
    notice_period_days: Optional[int] = Field(None, ge=0)
    availability_date: Optional[date] = None
    expected_salary: Optional[float] = Field(None, ge=0)
    current_salary: Optional[float] = Field(None, ge=0)
    salary_currency: Optional[str] = Field("AED", max_length=10)
    salary_negotiable: Optional[bool] = None
    source: Optional[str] = Field(None, max_length=100)
    source_details: Optional[str] = None
    linkedin_url: Optional[str] = Field(None, max_length=500)
    portfolio_url: Optional[str] = Field(None, max_length=500)
    core_skills: Optional[List[str]] = None
    programming_languages: Optional[List[str]] = None
    hardware_platforms: Optional[List[str]] = None
    protocols_tools: Optional[List[str]] = None
    references: Optional[List[Dict[str, Any]]] = None
    soft_skills: Optional[Dict[str, int]] = None
    technical_skills: Optional[Dict[str, int]] = None
    notes: Optional[str] = None
    recruiter_notes: Optional[str] = None
    interview_observations: Optional[str] = None
    risk_flags: Optional[str] = None
    emirates_id: Optional[str] = Field(None, max_length=50)
    visa_status: Optional[str] = Field(None, max_length=100)
    visa_expiry_date: Optional[date] = None
    current_country: Optional[str] = Field(None, max_length=100)
    current_location: Optional[str] = Field(None, max_length=100)
    willing_to_relocate: Optional[bool] = None
    has_driving_license: Optional[bool] = None


class CandidateCreate(CandidateBase):
    """Schema for creating a candidate."""
    pass


class CandidateUpdate(BaseModel):
    """Schema for updating a candidate."""
    full_name: Optional[str] = Field(None, min_length=1, max_length=200)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=50)
    entity: Optional[str] = Field(None, max_length=200)
    current_position: Optional[str] = Field(None, max_length=200)
    current_company: Optional[str] = Field(None, max_length=200)
    years_experience: Optional[int] = Field(None, ge=0)
    industry_function: Optional[str] = Field(None, max_length=200)
    notice_period_days: Optional[int] = Field(None, ge=0)
    availability_date: Optional[date] = None
    expected_salary: Optional[float] = Field(None, ge=0)
    current_salary: Optional[float] = Field(None, ge=0)
    salary_currency: Optional[str] = Field(None, max_length=10)
    salary_negotiable: Optional[bool] = None
    source: Optional[str] = Field(None, max_length=100)
    source_details: Optional[str] = None
    linkedin_url: Optional[str] = Field(None, max_length=500)
    portfolio_url: Optional[str] = Field(None, max_length=500)
    documents: Optional[Dict[str, Any]] = None
    core_skills: Optional[List[str]] = None
    programming_languages: Optional[List[str]] = None
    hardware_platforms: Optional[List[str]] = None
    protocols_tools: Optional[List[str]] = None
    references: Optional[List[Dict[str, Any]]] = None
    soft_skills: Optional[Dict[str, int]] = None
    technical_skills: Optional[Dict[str, int]] = None
    notes: Optional[str] = None
    recruiter_notes: Optional[str] = None
    interview_observations: Optional[str] = None
    risk_flags: Optional[str] = None
    status: Optional[str] = None
    stage: Optional[str] = None
    rejection_reason: Optional[str] = None
    emirates_id: Optional[str] = Field(None, max_length=50)
    visa_status: Optional[str] = Field(None, max_length=100)
    visa_expiry_date: Optional[date] = None
    current_country: Optional[str] = Field(None, max_length=100)
    current_location: Optional[str] = Field(None, max_length=100)
    willing_to_relocate: Optional[bool] = None
    has_driving_license: Optional[bool] = None
    details_confirmed_by_candidate: Optional[bool] = None
    details_confirmed_at: Optional[datetime] = None
    last_updated_by: Optional[str] = None


class CandidateResponse(CandidateBase):
    """Response schema for candidate."""
    id: int
    candidate_number: str
    pass_number: Optional[str] = None
    resume_path: Optional[str] = None
    documents: Optional[Dict[str, Any]] = None
    status: str
    stage: str
    stage_changed_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    details_confirmed_by_candidate: Optional[bool] = None
    details_confirmed_at: Optional[datetime] = None
    last_updated_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CandidateSelfServiceUpdate(BaseModel):
    """Schema for candidate self-service profile updates."""
    pass_token: str = Field(..., min_length=64, max_length=64, description="Secure pass token for verification")
    phone: Optional[str] = Field(None, max_length=50)
    email: Optional[EmailStr] = None
    current_location: Optional[str] = Field(None, max_length=100)
    visa_status: Optional[str] = Field(None, max_length=100)
    notice_period_days: Optional[int] = Field(None, ge=0)
    expected_salary: Optional[float] = Field(None, ge=0)
    details_confirmed: Optional[bool] = None


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


# Bulk Operations Schemas
class BulkCandidateStageUpdate(BaseModel):
    """Schema for bulk updating candidate stages."""
    candidate_ids: List[int] = Field(..., min_length=1, max_length=100, description="List of candidate IDs")
    new_stage: str = Field(..., description="New stage: applied, screening, interview, offer, hired, rejected")
    notes: Optional[str] = Field(None, description="Optional notes for the stage change")


class BulkCandidateReject(BaseModel):
    """Schema for bulk rejecting candidates."""
    candidate_ids: List[int] = Field(..., min_length=1, max_length=100, description="List of candidate IDs")
    rejection_reason: str = Field(..., min_length=1, description="Reason for rejection")


class BulkOperationResult(BaseModel):
    """Schema for bulk operation results."""
    success_count: int
    failed_count: int
    failed_ids: List[int]
    message: str


# Enhanced Analytics Schemas
class RecruitmentMetrics(BaseModel):
    """Schema for detailed recruitment metrics."""
    # Overview
    total_requests: int
    active_requests: int
    filled_requests: int
    cancelled_requests: int
    
    # Pipeline metrics
    total_candidates: int
    candidates_by_stage: Dict[str, int]
    candidates_by_source: Dict[str, int]
    candidates_by_status: Dict[str, int]
    
    # Time metrics (in days)
    avg_time_to_fill: Optional[float] = None
    avg_time_in_screening: Optional[float] = None
    avg_time_to_offer: Optional[float] = None
    
    # Conversion rates (percentages)
    application_to_screening_rate: Optional[float] = None
    screening_to_interview_rate: Optional[float] = None
    interview_to_offer_rate: Optional[float] = None
    offer_acceptance_rate: Optional[float] = None
    
    # Recent activity
    recent_hires: int
    pending_interviews: int
    pending_offers: int
    
    # SLA tracking
    overdue_requests: int
    requests_by_priority: Dict[str, int]


# Assessment Schemas (from JSON analysis)
class AssessmentBase(BaseModel):
    """Base schema for candidate assessments."""
    candidate_id: int
    recruitment_request_id: int
    assessment_type: str = Field(..., description="soft-skills, technical, cognitive, personality")
    label: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    assessment_link: Optional[str] = Field(None, max_length=500)
    platform: Optional[str] = Field(None, max_length=100)
    is_required: bool = True


# Valid assessment statuses
ASSESSMENT_STATUSES = ["pending", "in_progress", "completed", "expired"]


class AssessmentCreate(AssessmentBase):
    """Schema for creating an assessment."""
    pass


class AssessmentUpdate(BaseModel):
    """Schema for updating an assessment."""
    status: Optional[str] = Field(None, description="Status: pending, in_progress, completed, expired")
    score: Optional[int] = Field(None, ge=0, le=100)
    passed: Optional[bool] = None
    result_details: Optional[Dict[str, Any]] = None


class AssessmentResponse(AssessmentBase):
    """Response schema for assessment."""
    id: int
    status: str
    score: Optional[int] = None
    passed: Optional[bool] = None
    result_details: Optional[Dict[str, Any]] = None
    sent_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Valid offer statuses
OFFER_STATUSES = ["draft", "pending_approval", "approved", "sent", "accepted", "declined", "expired", "withdrawn"]

# Offer Schemas (from JSON analysis)
class OfferBase(BaseModel):
    """Base schema for job offers."""
    candidate_id: int
    recruitment_request_id: int
    position_title: str = Field(..., min_length=1, max_length=200)
    department: str = Field(..., min_length=1, max_length=100)
    reporting_to: Optional[str] = Field(None, max_length=200)
    base_salary: float = Field(..., ge=0)
    housing_allowance: Optional[float] = Field(None, ge=0)
    transport_allowance: Optional[float] = Field(None, ge=0)
    other_allowances: Optional[float] = Field(None, ge=0)
    currency: str = Field(default="AED", max_length=10)
    start_date: Optional[date] = None
    contract_type: str = Field(default="Permanent")
    probation_period_months: int = Field(default=6, ge=0)
    working_hours: Optional[str] = Field(None, max_length=100)
    annual_leave_days: int = Field(default=30, ge=0)
    benefits: Optional[List[str]] = None
    special_conditions: Optional[str] = None
    expires_at: Optional[datetime] = None


class OfferCreate(OfferBase):
    """Schema for creating an offer."""
    pass


class OfferUpdate(BaseModel):
    """Schema for updating an offer."""
    position_title: Optional[str] = Field(None, min_length=1, max_length=200)
    base_salary: Optional[float] = Field(None, ge=0)
    housing_allowance: Optional[float] = Field(None, ge=0)
    transport_allowance: Optional[float] = Field(None, ge=0)
    other_allowances: Optional[float] = Field(None, ge=0)
    start_date: Optional[date] = None
    benefits: Optional[List[str]] = None
    special_conditions: Optional[str] = None
    status: Optional[str] = None
    expires_at: Optional[datetime] = None


class OfferResponse(OfferBase):
    """Response schema for offer."""
    id: int
    offer_number: str
    total_package: Optional[float] = None
    status: str
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    sent_at: Optional[datetime] = None
    responded_at: Optional[datetime] = None
    decline_reason: Optional[str] = None
    offer_letter_path: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# NextStep Schema (from JSON analysis)
class NextStepBase(BaseModel):
    """Base schema for candidate next step."""
    candidate_id: int
    recruitment_request_id: int
    label: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    instructions: Optional[str] = None
    scheduled_date: Optional[date] = None
    scheduled_time: Optional[str] = Field(None, max_length=50)
    location: Optional[str] = Field(None, max_length=200)
    meeting_link: Optional[str] = Field(None, max_length=500)


class NextStepCreate(NextStepBase):
    """Schema for creating a next step."""
    pass


class NextStepResponse(NextStepBase):
    """Response schema for next step."""
    id: int
    status: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Reference Data Schemas (enhanced from JSON)
class LocationInfo(BaseModel):
    """Schema for work location info."""
    key: str
    name: str


class EducationLevelInfo(BaseModel):
    """Schema for education level info."""
    key: str
    name: str


class CandidateSourceInfo(BaseModel):
    """Schema for candidate source info."""
    key: str
    name: str


class NoticePeriodInfo(BaseModel):
    """Schema for notice period info."""
    key: str
    name: str
    days: int


class AIScoringCriteria(BaseModel):
    """Schema for AI scoring criteria."""
    skills_match: int = Field(30, description="Weight for skills match")
    experience_match: int = Field(25, description="Weight for experience match")
    education_match: int = Field(15, description="Weight for education match")
    salary_fit: int = Field(15, description="Weight for salary fit")
    culture_fit: int = Field(15, description="Weight for culture fit")
