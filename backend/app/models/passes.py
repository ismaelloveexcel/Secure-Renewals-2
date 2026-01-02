from datetime import date, datetime
from typing import Optional

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.renewal import Base


class Pass(Base):
    """Pass model for recruitment and onboarding passes."""

    __tablename__ = "passes"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    pass_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    pass_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)  # recruitment, onboarding, visitor, contractor
    
    # Person details
    full_name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    department: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    position: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    # Pass validity
    valid_from: Mapped[date] = mapped_column(Date, nullable=False)
    valid_until: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    
    # Access details
    access_areas: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON list of allowed areas
    purpose: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    sponsor_name: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)  # Employee sponsoring
    
    # Status
    status: Mapped[str] = mapped_column(String(20), default="active", nullable=False, index=True)  # active, expired, revoked
    is_printed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    # Linked employee (for onboarding passes)
    employee_id: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    
    # Audit
    created_by: Mapped[str] = mapped_column(String(50), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )


# Pass types
PASS_TYPES = [
    {"key": "recruitment", "name": "Recruitment Pass", "description": "For candidates attending interviews"},
    {"key": "onboarding", "name": "Onboarding Pass", "description": "For new employees during onboarding period"},
    {"key": "visitor", "name": "Visitor Pass", "description": "For general visitors to the office"},
    {"key": "contractor", "name": "Contractor Pass", "description": "For contractors and external workers"},
    {"key": "temporary", "name": "Temporary Pass", "description": "Short-term access for specific purposes"},
]
