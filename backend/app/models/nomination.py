from datetime import datetime
from typing import Optional, List, TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func, UniqueConstraint, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.renewal import Base

if TYPE_CHECKING:
    from app.models.employee import Employee

NOMINATION_STATUSES = ["pending", "shortlisted", "winner", "not_selected"]

ELIGIBLE_JOB_LEVELS = [
    "Officer",
    "Senior Officer",
    "Junior Officer",
    "Assistant",
    "Coordinator",
    "Analyst",
    "Specialist",
    "Technician",
    "Administrator",
    "Clerk",
    "Representative",
]


class EoyNomination(Base):
    """Employee of the Year nomination submitted by managers"""

    __tablename__ = "eoy_nominations"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    nominee_id: Mapped[int] = mapped_column(ForeignKey("employees.id"), nullable=False, index=True)
    nominator_id: Mapped[int] = mapped_column(ForeignKey("employees.id"), nullable=False, index=True)
    nomination_year: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    justification: Mapped[str] = mapped_column(Text, nullable=False)
    achievements: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    impact_description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    achievement_categories: Mapped[Optional[List[str]]] = mapped_column(JSON, nullable=True, default=list)
    supporting_evidence_paths: Mapped[Optional[List[str]]] = mapped_column(JSON, nullable=True, default=list)
    status: Mapped[str] = mapped_column(String(30), default="pending", nullable=False)

    reviewed_by: Mapped[Optional[int]] = mapped_column(ForeignKey("employees.id"), nullable=True)
    reviewed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    review_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    __table_args__ = (
        UniqueConstraint("nominee_id", "nomination_year", name="uq_nominee_per_year"),
        UniqueConstraint("nominator_id", "nomination_year", name="uq_nominator_per_year"),
    )

    nominee: Mapped["Employee"] = relationship("Employee", foreign_keys=[nominee_id])
    nominator: Mapped["Employee"] = relationship("Employee", foreign_keys=[nominator_id])
    reviewer: Mapped[Optional["Employee"]] = relationship("Employee", foreign_keys=[reviewed_by])
