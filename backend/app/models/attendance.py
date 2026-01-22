from datetime import date, datetime, time
from decimal import Decimal
from typing import Optional

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, Numeric, String, Text, Time, func, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from app.models.renewal import Base


class WorkWeekType(str, enum.Enum):
    """UAE work week types."""
    FIVE_DAY = "5-day"  # Sun-Thu (most common)
    SIX_DAY = "6-day"   # Sun-Fri (older standard)


class OvertimeCompensationType(str, enum.Enum):
    """UAE overtime compensation types."""
    PAID = "paid"           # 125% base pay + 25% if night/weekend
    OFFSET_DAYS = "offset"  # 1 day off per 48 overtime hours
    NONE = "none"           # Managerial positions


class LocationChangeStatus(str, enum.Enum):
    """Status of location change requests."""
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    AUTO_APPROVED = "auto_approved"  # If within expected location


class AttendanceRecord(Base):
    """Attendance record for tracking employee clock in/out, GPS, overtime, and WFH.
    
    UAE Labor Law Compliance:
    - Tracks 5-day vs 6-day work weeks
    - Manages overtime (max 2 hours/day, paid at 125%)
    - Supports offset days (1 day per 48 OT hours)
    - No overtime for managerial positions
    - Daily logs mandatory for compliance
    - Location tracking for remote work
    """

    __tablename__ = "attendance_records"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    employee_id: Mapped[int] = mapped_column(ForeignKey("employees.id"), nullable=False, index=True)
    
    # Date of attendance
    attendance_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    
    # Clock in/out times
    clock_in: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    clock_out: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # GPS coordinates for clock in
    clock_in_latitude: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 8), nullable=True)
    clock_in_longitude: Mapped[Optional[Decimal]] = mapped_column(Numeric(11, 8), nullable=True)
    clock_in_address: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    # GPS coordinates for clock out
    clock_out_latitude: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 8), nullable=True)
    clock_out_longitude: Mapped[Optional[Decimal]] = mapped_column(Numeric(11, 8), nullable=True)
    clock_out_address: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    # Work type: office, wfh (work from home), field, leave
    work_type: Mapped[str] = mapped_column(String(20), default="office", nullable=False)
    
    # UAE Compliance: Work week type and overtime eligibility
    work_week_type: Mapped[str] = mapped_column(String(10), default="5-day", nullable=False)
    is_managerial: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    overtime_compensation_type: Mapped[str] = mapped_column(String(10), default="paid", nullable=False)
    
    # Location tracking
    expected_location: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)  # From employee profile
    actual_location: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)  # Where they clocked in
    location_changed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    location_change_status: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    location_change_notified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    location_change_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # WFH specific fields (requires approval)
    wfh_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    wfh_approved: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    wfh_approved_by: Mapped[Optional[int]] = mapped_column(ForeignKey("employees.id"), nullable=True)
    wfh_approved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    wfh_rejection_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Calculated hours (UAE: Standard 8 hours/day, max 48 hours/week)
    total_hours: Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 2), nullable=True)
    regular_hours: Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 2), nullable=True)
    overtime_hours: Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 2), nullable=True)
    
    # UAE Overtime tracking (max 2 hours/day)
    overtime_type: Mapped[str] = mapped_column(String(20), default="none", nullable=False)
    overtime_approved: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    overtime_approved_by: Mapped[Optional[int]] = mapped_column(ForeignKey("employees.id"), nullable=True)
    overtime_approved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    overtime_pay_rate: Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 2), default=1.25, nullable=True)  # 125%
    offset_day_accrued: Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 2), nullable=True)  # Fraction of day
    
    # Break time tracking (UAE: 1 hour unpaid break for 6+ hour shifts)
    break_start: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    break_end: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    break_duration_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Status: pending, present, absent, late, half-day, on-leave
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)
    
    # Reminder tracking (10:00 AM and 13:00 PM)
    reminder_10am_sent: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    reminder_1pm_sent: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    marked_absent_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Late arrival tracking (UAE: Grace period typically 15 minutes)
    is_late: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    late_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    late_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Early departure tracking
    is_early_departure: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    early_departure_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    early_departure_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Non-compliance tracking (no workflow block, just reporting)
    is_compliant: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    non_compliance_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    included_in_weekly_report: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    # Backdated entry tracking
    is_backdated: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    backdated_by: Mapped[Optional[int]] = mapped_column(ForeignKey("employees.id"), nullable=True)
    backdated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    backdated_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Notes and remarks
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    employee_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # Employee can add notes
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
    
    # Relationships
    employee = relationship("Employee", foreign_keys=[employee_id], backref="attendance_records")
    wfh_approver = relationship("Employee", foreign_keys=[wfh_approved_by])
    overtime_approver = relationship("Employee", foreign_keys=[overtime_approved_by])
    backdated_by_employee = relationship("Employee", foreign_keys=[backdated_by])


# Work type constants
WORK_TYPES = ["office", "wfh", "field", "leave", "holiday"]

# Attendance status constants
ATTENDANCE_STATUSES = ["pending", "present", "absent", "late", "half-day", "on-leave", "holiday"]

# Overtime types
OVERTIME_TYPES = ["none", "pre-approved", "auto-calculated", "requested"]

# UAE Labor Law Constants
STANDARD_WORK_HOURS = 8
STANDARD_CLOCK_IN = time(8, 0)  # 8:00 AM
STANDARD_CLOCK_OUT = time(17, 0)  # 5:00 PM
GRACE_PERIOD_MINUTES = 15  # 15 minutes grace period for late arrivals

# UAE Overtime rules
MAX_OVERTIME_HOURS_PER_DAY = 2
MAX_WORK_HOURS_PER_WEEK_5DAY = 40  # 5-day week
MAX_WORK_HOURS_PER_WEEK_6DAY = 48  # 6-day week
OVERTIME_PAY_RATE = Decimal("1.25")  # 125% of base
OVERTIME_PAY_RATE_NIGHT_WEEKEND = Decimal("1.50")  # 150% for night/weekend
OFFSET_DAYS_PER_OVERTIME_HOURS = 48  # 1 day off per 48 OT hours

# Reminder times
FRIENDLY_REMINDER_TIME = time(10, 0)  # 10:00 AM
FINAL_REMINDER_TIME = time(13, 0)  # 1:00 PM
