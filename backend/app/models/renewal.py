from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Integer, JSON, String, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class Renewal(Base):
    __tablename__ = "renewals"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    employee_name: Mapped[str] = mapped_column(String(120), nullable=False)
    contract_end_date: Mapped[date] = mapped_column(Date, nullable=False)
    renewal_period_months: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False)
    created_by_role: Mapped[str] = mapped_column(String(20), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    audit_logs: Mapped[list["RenewalAuditLog"]] = relationship(
        back_populates="renewal", cascade="save-update, merge", passive_deletes=True
    )


class RenewalAuditLog(Base):
    __tablename__ = "renewal_audit_log"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    renewal_id: Mapped[int] = mapped_column(ForeignKey("renewals.id"), nullable=False)
    action: Mapped[str] = mapped_column(String(50), nullable=False)
    performed_by_role: Mapped[str] = mapped_column(String(20), nullable=False)
    performed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    snapshot: Mapped[dict] = mapped_column(JSON, nullable=False)

    renewal: Mapped[Renewal] = relationship(back_populates="audit_logs")
