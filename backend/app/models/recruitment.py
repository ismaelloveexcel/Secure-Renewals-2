"""Recruitment models for ATS system."""
from datetime import date, datetime
from typing import List, Optional, TYPE_CHECKING

from sqlalchemy import (
    Boolean, Date, DateTime, ForeignKey, Integer,
    String, Text, DECIMAL, JSON, func
)
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.renewal import Base

if TYPE_CHECKING:
    from app.models.employee import Employee
    from app.models.passes import Pass


class RecruitmentRequest(Base):
    """Job requisition/opening."""

    __tablename__ = "recruitment_requests"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    request_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)

    # Position details
    position_title: Mapped[str] = mapped_column(String(200), nullable=False)
    department: Mapped[str] = mapped_column(String(100), nullable=False)
    # String reference for display
    hiring_manager_id: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    # FK to employees masterfile
    hiring_manager_employee_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("employees.id", ondelete="SET NULL"), nullable=True, index=True
    )

    # Request info - string reference for display
    requested_by: Mapped[str] = mapped_column(String(50), nullable=False)
    # FK to employees masterfile
    requested_by_employee_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("employees.id", ondelete="SET NULL"), nullable=True, index=True
    )
    request_date: Mapped[date] = mapped_column(Date, nullable=False, default=date.today)
    target_hire_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    # Position specs
    headcount: Mapped[int] = mapped_column(Integer, default=1)
    employment_type: Mapped[str] = mapped_column(String(50), nullable=False)  # Full-time, Contract, Intern
    job_description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    requirements: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    required_skills: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)  # List of required skills for CV scoring
    priority: Mapped[str] = mapped_column(String(20), default="normal", nullable=False)  # low, normal, high, urgent
    expected_start_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    
    # Enhanced position specs (from JSON analysis)
    location: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)  # Abu Dhabi HQ, Dubai Office, Remote, Hybrid
    experience_min: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # Minimum years experience
    experience_max: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # Maximum years experience
    education_level: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # High School, Diploma, Bachelors, Masters, PhD
    benefits: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)  # List of benefits/perks
    reporting_to: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)  # Position reports to

    # Salary
    salary_range_min: Mapped[Optional[float]] = mapped_column(DECIMAL(10, 2), nullable=True)
    salary_range_max: Mapped[Optional[float]] = mapped_column(DECIMAL(10, 2), nullable=True)

    # Status & approvals
    status: Mapped[str] = mapped_column(String(50), default="pending", nullable=False)
    # pending, approved, rejected, filled, cancelled
    approval_status: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    # {requisition: {status, approver, date}, budget: {...}, offer: {...}}

    # Manager pass reference - string reference
    manager_pass_number: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    # FK to passes masterfile
    manager_pass_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("passes.id", ondelete="SET NULL"), nullable=True, index=True
    )

    # Audit
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships to masterfiles
    hiring_manager: Mapped[Optional["Employee"]] = relationship(
        "Employee", foreign_keys=[hiring_manager_employee_id]
    )
    requester: Mapped[Optional["Employee"]] = relationship(
        "Employee", foreign_keys=[requested_by_employee_id]
    )
    manager_pass: Mapped[Optional["Pass"]] = relationship(
        "Pass", foreign_keys=[manager_pass_id]
    )
    candidates: Mapped[List["Candidate"]] = relationship(back_populates="recruitment_request", cascade="all, delete-orphan")


class Candidate(Base):
    """Candidate/applicant for a position."""

    __tablename__ = "candidates"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    candidate_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)

    # Link to recruitment request
    recruitment_request_id: Mapped[int] = mapped_column(ForeignKey("recruitment_requests.id"), nullable=False)

    # Pass reference - string reference for display
    pass_number: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, index=True)
    # FK to passes masterfile
    pass_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("passes.id", ondelete="SET NULL"), nullable=True, index=True
    )

    # Personal info
    full_name: Mapped[str] = mapped_column(String(200), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    
    # Entity (for multi-company recruitment)
    entity: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)

    # Professional Summary
    current_position: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    current_company: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    years_experience: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    industry_function: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)  # Industry / Function

    # Availability & Compensation
    notice_period_days: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    availability_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)  # Auto-calc from notice period
    expected_salary: Mapped[Optional[float]] = mapped_column(DECIMAL(10, 2), nullable=True)
    current_salary: Mapped[Optional[float]] = mapped_column(DECIMAL(10, 2), nullable=True)
    salary_currency: Mapped[Optional[str]] = mapped_column(String(10), default="AED", nullable=True)
    salary_negotiable: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)

    # Source
    source: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    # LinkedIn, Referral, Agency, Direct Application, etc.
    source_details: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Resume & Documents
    resume_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    linkedin_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    portfolio_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    documents: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # {cv: path, portfolio: path, certificates: [], passport: path, visa: path}

    # Skills (structured)
    core_skills: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)  # Array of skill tags
    programming_languages: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    hardware_platforms: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    protocols_tools: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    
    # References for reference checks
    references_list: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)  # [{name, relationship, company, email, phone}]
    
    # Evaluations (HR/Hiring Manager only - NOT visible to candidates)
    soft_skills: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # {communication: 4, teamwork: 5, ...}
    technical_skills: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # {domain_knowledge: 4, ...}
    
    # Screening scores (Manager-only, for candidate ranking)
    ai_ranking: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # Legacy field, use cv_scoring instead
    cv_scoring: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # CV match % (0-100) - auto-generated on upload
    skills_match_score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # Core skills match % (0-100)
    education_level: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)  # PhD, Masters, Bachelors, Diploma, High School
    screening_rank: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # Position rank within position
    resume_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)  # Link to uploaded CV
    cv_scored_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)  # When CV was last scored
    
    # Enhanced AI scoring (from JSON analysis)
    ai_score_breakdown: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # {skills_match: 30, experience_match: 25, education_match: 15, salary_fit: 15, culture_fit: 15}
    hr_rating: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # HR rating 1-5
    manager_rating: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # Hiring manager rating 1-5
    last_activity_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)  # Last activity timestamp

    # Status & stage
    status: Mapped[str] = mapped_column(String(50), default="applied", nullable=False)
    # applied, screening, interview, offer, hired, rejected
    stage: Mapped[str] = mapped_column(String(50), default="applied", nullable=False, index=True)
    stage_changed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Rejection
    rejection_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Notes (split)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # Legacy - kept for migration
    recruiter_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # HR-only
    interview_observations: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # HR-only
    risk_flags: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # HR-only

    # UAE-specific (parsed from CV or manually entered)
    emirates_id: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    visa_status: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    visa_expiry_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    
    # Location & Mobility
    current_country: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)  # Country
    current_location: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)  # Emirate
    willing_to_relocate: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    has_driving_license: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    
    # Candidate confirmation & audit
    details_confirmed_by_candidate: Mapped[Optional[bool]] = mapped_column(Boolean, default=False, nullable=True)
    details_confirmed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    last_updated_by: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)  # "Candidate" or employee_id
    
    # Secure pass token for self-service verification (cryptographically random)
    pass_token: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)

    # Audit
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    recruitment_request: Mapped["RecruitmentRequest"] = relationship(back_populates="candidates")
    candidate_pass: Mapped[Optional["Pass"]] = relationship("Pass", foreign_keys=[pass_id])
    interviews: Mapped[List["Interview"]] = relationship(back_populates="candidate", cascade="all, delete-orphan")
    evaluations: Mapped[List["Evaluation"]] = relationship(back_populates="candidate", cascade="all, delete-orphan")


class Interview(Base):
    """Interview scheduling and management."""

    __tablename__ = "interviews"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    interview_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)

    # Links
    candidate_id: Mapped[int] = mapped_column(ForeignKey("candidates.id"), nullable=False)
    recruitment_request_id: Mapped[int] = mapped_column(ForeignKey("recruitment_requests.id"), nullable=False)

    # Interview details
    interview_type: Mapped[str] = mapped_column(String(50), nullable=False)
    # phone_screen, technical, hr, manager, panel
    interview_round: Mapped[int] = mapped_column(Integer, default=1)

    # Availability slots (from hiring manager) - JSON array
    available_slots: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    # [{"start": "2026-01-10T10:00:00Z", "end": "2026-01-10T11:00:00Z"}, ...]

    # Scheduled slot (selected by candidate)
    scheduled_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True, index=True)
    duration_minutes: Mapped[int] = mapped_column(Integer, default=60)

    # Interview setup
    interviewer_ids: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # Comma-separated
    location: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    # Office, Video Call, Phone
    meeting_link: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Status
    status: Mapped[str] = mapped_column(String(50), default="pending", nullable=False)
    # pending, slots_provided, scheduled, completed, cancelled
    confirmed_by_candidate: Mapped[bool] = mapped_column(Boolean, default=False)
    confirmed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Completion
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Audit
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    candidate: Mapped["Candidate"] = relationship(back_populates="interviews")
    evaluations: Mapped[List["Evaluation"]] = relationship(back_populates="interview", cascade="all, delete-orphan")


class Evaluation(Base):
    """Interview evaluation/feedback."""

    __tablename__ = "evaluations"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    evaluation_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)

    # Links
    interview_id: Mapped[int] = mapped_column(ForeignKey("interviews.id"), nullable=False)
    candidate_id: Mapped[int] = mapped_column(ForeignKey("candidates.id"), nullable=False)
    evaluator_id: Mapped[str] = mapped_column(String(50), nullable=False)

    # Scores (1-5 scale)
    technical_skills_score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    communication_score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    cultural_fit_score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    overall_score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Feedback
    strengths: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    concerns: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    additional_comments: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Decision
    recommendation: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    # strong_hire, hire, maybe, no_hire
    next_steps: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Audit
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    interview: Mapped["Interview"] = relationship(back_populates="evaluations")
    candidate: Mapped["Candidate"] = relationship(back_populates="evaluations")


# Pipeline stages
RECRUITMENT_STAGES = [
    {"key": "applied", "name": "Applied", "order": 1},
    {"key": "screening", "name": "Screening", "order": 2},
    {"key": "interview", "name": "Interview", "order": 3},
    {"key": "offer", "name": "Offer", "order": 4},
    {"key": "hired", "name": "Hired", "order": 5},
    {"key": "rejected", "name": "Rejected", "order": 99},
]

# Interview types - Categories of interviews (used for interview_type field)
# These describe WHAT kind of interview it is
INTERVIEW_TYPES = [
    {"key": "phone_screen", "name": "Phone Screening"},
    {"key": "technical", "name": "Technical Interview"},
    {"key": "hr", "name": "HR Interview"},
    {"key": "manager", "name": "Hiring Manager Interview"},
    {"key": "panel", "name": "Panel Interview"},
    {"key": "final", "name": "Final Interview"},
]

# Interview rounds - Ordered sequence of interview stages in the process
# These describe WHEN in the process the interview occurs (order matters)
INTERVIEW_ROUNDS = [
    {"key": "hr_screening", "name": "HR Screening", "order": 1},
    {"key": "technical_1", "name": "Technical Round 1", "order": 2},
    {"key": "technical_2", "name": "Technical Round 2", "order": 3},
    {"key": "panel", "name": "Panel Interview", "order": 4},
    {"key": "final", "name": "Final Interview", "order": 5},
    {"key": "ceo", "name": "CEO Interview", "order": 6},
]

# Employment types
EMPLOYMENT_TYPES = [
    {"key": "full_time", "name": "Full-time"},
    {"key": "part_time", "name": "Part-time"},
    {"key": "contract", "name": "Contract"},
    {"key": "internship", "name": "Internship"},
    {"key": "temporary", "name": "Temporary"},
]

# Work locations
WORK_LOCATIONS = [
    {"key": "abu_dhabi_hq", "name": "Abu Dhabi HQ"},
    {"key": "dubai_office", "name": "Dubai Office"},
    {"key": "al_ain", "name": "Al Ain"},
    {"key": "remote", "name": "Remote"},
    {"key": "hybrid", "name": "Hybrid"},
]

# Education levels
EDUCATION_LEVELS = [
    {"key": "high_school", "name": "High School"},
    {"key": "diploma", "name": "Diploma"},
    {"key": "bachelors", "name": "Bachelor's Degree"},
    {"key": "masters", "name": "Master's Degree"},
    {"key": "phd", "name": "PhD"},
]

# Candidate sources
CANDIDATE_SOURCES = [
    {"key": "linkedin", "name": "LinkedIn"},
    {"key": "indeed", "name": "Indeed"},
    {"key": "bayt", "name": "Bayt"},
    {"key": "gulftalent", "name": "GulfTalent"},
    {"key": "company_website", "name": "Company Website"},
    {"key": "referral", "name": "Referral"},
    {"key": "agency", "name": "Agency"},
    {"key": "walk_in", "name": "Walk-in"},
    {"key": "other", "name": "Other"},
]

# Notice periods
NOTICE_PERIODS = [
    {"key": "immediate", "name": "Immediate", "days": 0},
    {"key": "1_week", "name": "1 Week", "days": 7},
    {"key": "2_weeks", "name": "2 Weeks", "days": 14},
    {"key": "1_month", "name": "1 Month", "days": 30},
    {"key": "2_months", "name": "2 Months", "days": 60},
    {"key": "3_months", "name": "3 Months", "days": 90},
]

# AI scoring criteria weights
AI_SCORING_CRITERIA = {
    "skills_match": {"weight": 30, "label": "Skills Match"},
    "experience_match": {"weight": 25, "label": "Experience Match"},
    "education_match": {"weight": 15, "label": "Education Match"},
    "salary_fit": {"weight": 15, "label": "Salary Fit"},
    "culture_fit": {"weight": 15, "label": "Culture Fit"},
}


class Assessment(Base):
    """Candidate assessments (technical, soft-skills, etc.)."""
    
    __tablename__ = "assessments"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    candidate_id: Mapped[int] = mapped_column(ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False)
    recruitment_request_id: Mapped[int] = mapped_column(ForeignKey("recruitment_requests.id", ondelete="CASCADE"), nullable=False)
    
    # Assessment details
    assessment_type: Mapped[str] = mapped_column(String(50), nullable=False)  # soft-skills, technical, cognitive, personality
    label: Mapped[str] = mapped_column(String(200), nullable=False)  # "Soft Skills Assessment"
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Assessment link/platform
    assessment_link: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    platform: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)  # Internal, HackerRank, Codility, etc.
    
    # Status
    is_required: Mapped[bool] = mapped_column(Boolean, default=True)
    status: Mapped[str] = mapped_column(String(50), default="pending")  # pending, in_progress, completed, expired
    
    # Results
    score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # 0-100
    passed: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    result_details: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # Detailed breakdown
    
    # Timing
    sent_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Audit
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class Offer(Base):
    """Job offer for candidates."""
    
    __tablename__ = "offers"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    offer_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    
    # Links
    candidate_id: Mapped[int] = mapped_column(ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False)
    recruitment_request_id: Mapped[int] = mapped_column(ForeignKey("recruitment_requests.id", ondelete="CASCADE"), nullable=False)
    
    # Position details
    position_title: Mapped[str] = mapped_column(String(200), nullable=False)
    department: Mapped[str] = mapped_column(String(100), nullable=False)
    reporting_to: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    
    # Compensation package
    base_salary: Mapped[float] = mapped_column(DECIMAL(10, 2), nullable=False)
    housing_allowance: Mapped[Optional[float]] = mapped_column(DECIMAL(10, 2), nullable=True)
    transport_allowance: Mapped[Optional[float]] = mapped_column(DECIMAL(10, 2), nullable=True)
    other_allowances: Mapped[Optional[float]] = mapped_column(DECIMAL(10, 2), nullable=True)
    total_package: Mapped[Optional[float]] = mapped_column(DECIMAL(10, 2), nullable=True)  # Computed
    currency: Mapped[str] = mapped_column(String(10), default="AED")
    
    # Employment terms
    start_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    contract_type: Mapped[str] = mapped_column(String(50), default="Permanent")  # Permanent, Fixed Term, Probation
    probation_period_months: Mapped[int] = mapped_column(Integer, default=6)
    working_hours: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)  # "8:00 AM - 5:00 PM"
    annual_leave_days: Mapped[int] = mapped_column(Integer, default=30)
    
    # Benefits and conditions
    benefits: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)  # List of benefits
    special_conditions: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Status and approvals
    status: Mapped[str] = mapped_column(String(50), default="draft")  # draft, pending_approval, approved, sent, accepted, declined, expired, withdrawn
    approved_by: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    approved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Offer lifecycle
    sent_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    responded_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    decline_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Document
    offer_letter_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    # Audit
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class NextStep(Base):
    """Next step/action for candidate."""
    
    __tablename__ = "next_steps"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    candidate_id: Mapped[int] = mapped_column(ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False)
    recruitment_request_id: Mapped[int] = mapped_column(ForeignKey("recruitment_requests.id", ondelete="CASCADE"), nullable=False)
    
    # Step details
    label: Mapped[str] = mapped_column(String(200), nullable=False)  # "Final Interview"
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    instructions: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # Special instructions for candidate
    
    # Scheduling
    scheduled_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    scheduled_time: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # "10:00 AM"
    location: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    meeting_link: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    # Status
    status: Mapped[str] = mapped_column(String(50), default="pending")  # pending, in_progress, completed, cancelled
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    # Audit
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
