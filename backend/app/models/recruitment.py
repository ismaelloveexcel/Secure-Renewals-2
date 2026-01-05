"""Recruitment models for ATS system."""
from datetime import date, datetime
from typing import List, Optional

from sqlalchemy import (
    Boolean, Date, DateTime, ForeignKey, Integer,
    String, Text, DECIMAL, JSON, func
)
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.renewal import Base


class RecruitmentRequest(Base):
    """Job requisition/opening."""

    __tablename__ = "recruitment_requests"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    request_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)

    # Position details
    position_title: Mapped[str] = mapped_column(String(200), nullable=False)
    department: Mapped[str] = mapped_column(String(100), nullable=False)
    hiring_manager_id: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    # Request info
    requested_by: Mapped[str] = mapped_column(String(50), nullable=False)
    request_date: Mapped[date] = mapped_column(Date, nullable=False, default=date.today)
    target_hire_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    # Position specs
    headcount: Mapped[int] = mapped_column(Integer, default=1)
    employment_type: Mapped[str] = mapped_column(String(50), nullable=False)  # Full-time, Contract, Intern
    job_description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    requirements: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Salary
    salary_range_min: Mapped[Optional[float]] = mapped_column(DECIMAL(10, 2), nullable=True)
    salary_range_max: Mapped[Optional[float]] = mapped_column(DECIMAL(10, 2), nullable=True)

    # Status & approvals
    status: Mapped[str] = mapped_column(String(50), default="pending", nullable=False)
    # pending, approved, rejected, filled, cancelled
    approval_status: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    # {requisition: {status, approver, date}, budget: {...}, offer: {...}}

    # Manager pass reference
    manager_pass_number: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    # Audit
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    candidates: Mapped[List["Candidate"]] = relationship(back_populates="recruitment_request", cascade="all, delete-orphan")


class Candidate(Base):
    """Candidate/applicant for a position."""

    __tablename__ = "candidates"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    candidate_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)

    # Link to recruitment request
    recruitment_request_id: Mapped[int] = mapped_column(ForeignKey("recruitment_requests.id"), nullable=False)

    # Pass reference
    pass_number: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, index=True)

    # Personal info
    full_name: Mapped[str] = mapped_column(String(200), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    # Current employment
    current_position: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    current_company: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    years_experience: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Expectations
    expected_salary: Mapped[Optional[float]] = mapped_column(DECIMAL(10, 2), nullable=True)
    notice_period_days: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Source
    source: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    # LinkedIn, Referral, Agency, Direct Application, etc.
    source_details: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Resume
    resume_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    linkedin_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Status & stage
    status: Mapped[str] = mapped_column(String(50), default="applied", nullable=False)
    # applied, screening, interview, offer, hired, rejected
    stage: Mapped[str] = mapped_column(String(50), default="applied", nullable=False, index=True)
    stage_changed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Rejection
    rejection_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Notes
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # UAE-specific (parsed from CV or manually entered)
    emirates_id: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    visa_status: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Audit
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    recruitment_request: Mapped["RecruitmentRequest"] = relationship(back_populates="candidates")
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

# Interview types
INTERVIEW_TYPES = [
    {"key": "phone_screen", "name": "Phone Screening"},
    {"key": "technical", "name": "Technical Interview"},
    {"key": "hr", "name": "HR Interview"},
    {"key": "manager", "name": "Hiring Manager Interview"},
    {"key": "panel", "name": "Panel Interview"},
    {"key": "final", "name": "Final Interview"},
]

# Employment types
EMPLOYMENT_TYPES = [
    {"key": "full_time", "name": "Full-time"},
    {"key": "part_time", "name": "Part-time"},
    {"key": "contract", "name": "Contract"},
    {"key": "internship", "name": "Internship"},
    {"key": "temporary", "name": "Temporary"},
]
