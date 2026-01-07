from datetime import datetime
from sqlalchemy import String, Integer, DateTime, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.models.employee import Base


class ActivityLog(Base):
    """Immutable activity log for audit trail across all pass types."""
    __tablename__ = "activity_logs"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    entity_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    entity_id: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    stage: Mapped[str] = mapped_column(String(50), nullable=False)
    action_type: Mapped[str] = mapped_column(String(100), nullable=False)
    action_description: Mapped[str] = mapped_column(Text, nullable=False)
    performed_by: Mapped[str] = mapped_column(String(50), nullable=False)
    performed_by_id: Mapped[str] = mapped_column(String(100), nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    visibility: Mapped[str] = mapped_column(String(20), default="internal", nullable=False)
    extra_data: Mapped[dict] = mapped_column(JSON, nullable=True)


ENTITY_TYPES = ["candidate", "requisition", "interview", "manager", "offer", "onboarding"]

VISIBILITY_LEVELS = ["internal", "candidate", "manager"]

ACTION_TYPES = [
    "profile_completed",
    "document_uploaded",
    "document_verified",
    "stage_changed",
    "status_changed",
    "interview_scheduled",
    "interview_confirmed",
    "interview_completed",
    "offer_sent",
    "offer_accepted",
    "offer_declined",
    "slot_booked",
    "slot_confirmed",
    "feedback_submitted",
    "message_sent",
    "pass_created",
    "pass_viewed",
]
