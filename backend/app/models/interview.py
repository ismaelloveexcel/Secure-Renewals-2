"""Interview setup and scheduling models."""
from datetime import datetime, date, time
from typing import Optional
from sqlalchemy import String, Integer, Boolean, Text, Date, Time, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.models.renewal import Base


class InterviewSetup(Base):
    """Interview setup configuration for a recruitment request."""
    
    __tablename__ = "interview_setups"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    recruitment_request_id: Mapped[int] = mapped_column(Integer, ForeignKey("recruitment_requests.id", ondelete="CASCADE"), nullable=False)
    created_by: Mapped[str] = mapped_column(String(50), nullable=False)
    
    # Setup configuration
    technical_assessment_required: Mapped[bool] = mapped_column(Boolean, default=False)
    interview_format: Mapped[str] = mapped_column(String(50), default="online")  # online, in-person, hybrid
    interview_rounds: Mapped[int] = mapped_column(Integer, default=1)
    
    # Additional interviewers (JSON array of employee IDs)
    additional_interviewers: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    
    # Notes
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    slots = relationship("InterviewSlot", back_populates="setup", cascade="all, delete-orphan")


class InterviewSlot(Base):
    """Available interview time slots."""
    
    __tablename__ = "interview_slots"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    interview_setup_id: Mapped[int] = mapped_column(Integer, ForeignKey("interview_setups.id", ondelete="CASCADE"), nullable=False)
    
    slot_date: Mapped[date] = mapped_column(Date, nullable=False)
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time] = mapped_column(Time, nullable=False)
    
    # Booking status
    status: Mapped[str] = mapped_column(String(20), default="available")  # available, booked, cancelled
    booked_by_candidate_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("candidates.id"), nullable=True)
    booked_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Confirmation
    candidate_confirmed: Mapped[bool] = mapped_column(Boolean, default=False)
    candidate_confirmed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Round number
    round_number: Mapped[int] = mapped_column(Integer, default=1)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    setup = relationship("InterviewSetup", back_populates="slots")


class PassMessage(Base):
    """Messages/Inbox for passes."""
    
    __tablename__ = "pass_messages"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    
    # Link to pass
    pass_type: Mapped[str] = mapped_column(String(50), nullable=False)  # candidate, manager
    pass_holder_id: Mapped[int] = mapped_column(Integer, nullable=False)
    recruitment_request_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("recruitment_requests.id"), nullable=True)
    
    # Message details
    sender_type: Mapped[str] = mapped_column(String(20), nullable=False)  # hr, candidate, manager, system
    sender_id: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    subject: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    message_body: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Attachments
    attachments: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    
    # Status
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    read_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Message type
    message_type: Mapped[str] = mapped_column(String(50), default="general")
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class RecruitmentDocument(Base):
    """Documents for recruitment (JD, Recruitment Form, etc.)."""
    
    __tablename__ = "recruitment_documents"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    recruitment_request_id: Mapped[int] = mapped_column(Integer, ForeignKey("recruitment_requests.id", ondelete="CASCADE"), nullable=False)
    
    document_type: Mapped[str] = mapped_column(String(50), nullable=False)  # job_description, recruitment_form, offer_letter, contract
    document_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    # Status
    status: Mapped[str] = mapped_column(String(20), default="pending")  # pending, submitted, approved, rejected
    submitted_by: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    submitted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    reviewed_by: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    reviewed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Version control
    version: Mapped[int] = mapped_column(Integer, default=1)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
