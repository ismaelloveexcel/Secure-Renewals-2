from datetime import date, datetime, time
from decimal import Decimal
from typing import Optional

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, Numeric, String, Text, Time, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.renewal import Base


class AttendanceRecord(Base):
    """Attendance record for tracking employee clock in/out, GPS, overtime, and WFH.
    
    This module is linked to Employee master data for:
    - Working Days (5 days or 6 days per week) via employee.work_schedule
    - Work Location (Head Office, KEZAD, Sites) via employee.location
    - Extra Hours Policy (Offset, Paid, N/A) via employee.overtime_type
    
    UAE Labor Law Compliance (Federal Decree-Law No. 33/2021):
    - Maximum 8 regular working hours per day (Article 17)
    - Maximum 48 working hours per week (Article 17)  
    - Maximum 2 hours overtime per day (Article 19)
    - Overtime compensation: 125% for regular hours, 150% for night/holidays (Article 19)
    - One day rest minimum per week (Article 21)
    - Ramadan: 2 hours reduction per day for Muslims (Article 18)
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
    
    # Work type: office, wfh (work from home), field, client_site, business_travel, leave, holiday
    work_type: Mapped[str] = mapped_column(String(20), default="office", nullable=False)
    
    # Work location (dropdown with locked values - see WORK_LOCATIONS constant)
    # Shows employee's default location, can be changed by employee at clock-in
    work_location: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    # Location remarks/details (required for: Sites, Meeting, Event, Work From Home)
    # Examples: "ADNOC Meeting", "Client site - Abu Dhabi", "Working from home - approved"
    location_remarks: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # WFH Approval Confirmation (employee self-confirms they have approval)
    # Default: False. Employee sets to True only if they have obtained Line Manager approval
    # Note: Actual approval workflow is handled outside the portal currently
    wfh_approval_confirmed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    # WFH specific fields (legacy - kept for backward compatibility)
    wfh_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    wfh_approved: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    wfh_approved_by: Mapped[Optional[int]] = mapped_column(ForeignKey("employees.id"), nullable=True)
    wfh_approved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Calculated hours
    total_hours: Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 2), nullable=True)
    regular_hours: Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 2), nullable=True)
    overtime_hours: Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 2), nullable=True)
    
    # Overtime tracking - inherits from employee.overtime_type (Offset/Paid/N/A)
    overtime_type: Mapped[str] = mapped_column(String(20), default="none", nullable=False)
    overtime_approved: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    overtime_approved_by: Mapped[Optional[int]] = mapped_column(ForeignKey("employees.id"), nullable=True)
    overtime_approved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Offset day tracking (for employees with overtime_type = "Offset")
    offset_hours_earned: Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 2), nullable=True)
    offset_day_reference: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    # Exceptional overtime handling (override employee's default overtime_type for specific days)
    # Used when an N/A or Offset employee should get paid overtime exceptionally
    exceptional_overtime: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    exceptional_overtime_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    exceptional_overtime_approved_by: Mapped[Optional[int]] = mapped_column(ForeignKey("employees.id"), nullable=True)
    
    # Paid overtime calculation (for employees with overtime_type = "Paid" or exceptional_overtime = True)
    # Article 19: 125% for regular overtime, 150% for night/holiday overtime
    overtime_rate: Mapped[Optional[Decimal]] = mapped_column(Numeric(4, 2), nullable=True)  # 1.25 or 1.50
    overtime_amount: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)  # Calculated pay
    is_night_overtime: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)  # 9 PM - 4 AM
    is_holiday_overtime: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)  # Public holiday
    
    # Meal/Food allowance tracking
    food_allowance_eligible: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    food_allowance_amount: Mapped[Optional[Decimal]] = mapped_column(Numeric(8, 2), nullable=True)
    
    # Break time tracking
    break_start: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    break_end: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    break_duration_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Status: pending, present, absent, late, half-day, on-leave, holiday, rest-day
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)
    
    # Late arrival tracking
    is_late: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    late_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    late_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Early departure tracking
    is_early_departure: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    early_departure_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    early_departure_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # UAE Labor Law compliance flags
    is_ramadan_hours: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_rest_day: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    exceeds_daily_limit: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    exceeds_overtime_limit: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    # Manual correction tracking
    is_manual_entry: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    manual_entry_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    manual_entry_by: Mapped[Optional[int]] = mapped_column(ForeignKey("employees.id"), nullable=True)
    manual_entry_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    correction_approved: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    correction_approved_by: Mapped[Optional[int]] = mapped_column(ForeignKey("employees.id"), nullable=True)
    correction_approved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Notes and remarks
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
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
    exceptional_overtime_approver = relationship("Employee", foreign_keys=[exceptional_overtime_approved_by])
    manual_entry_approver = relationship("Employee", foreign_keys=[manual_entry_by])
    correction_approver = relationship("Employee", foreign_keys=[correction_approved_by])


# Work type constants - expanded per requirements
WORK_TYPES = ["office", "wfh", "field", "client_site", "business_travel", "leave", "holiday"]

# Work locations (locked dropdown values per requirements)
# These are the ONLY valid work location values for clock-in
WORK_LOCATIONS = [
    "Head Office",      # Default office location
    "KEZAD",            # Khalifa Industrial Zone
    "Safario",          # Manufacturing site
    "Sites",            # Various project sites (requires remarks)
    "Meeting",          # External meeting (requires remarks)
    "Event",            # Company event (requires remarks)
    "Work From Home"    # WFH (requires remarks + approval confirmation)
]

# Work locations that require remarks/details
WORK_LOCATIONS_REQUIRE_REMARKS = ["Sites", "Meeting", "Event", "Work From Home"]

# Attendance status constants
ATTENDANCE_STATUSES = ["pending", "present", "absent", "late", "half-day", "on-leave", "holiday", "rest-day"]

# Overtime types - linked to Employee master overtime_type field
# N/A: Employee not eligible for overtime
# Offset: Overtime converted to time off
# Paid: Overtime paid at premium rate
OVERTIME_TYPES = ["none", "pre-approved", "auto-calculated", "requested"]
EMPLOYEE_OVERTIME_POLICIES = ["N/A", "Offset", "Paid"]

# Work schedule types - linked to Employee master work_schedule field
WORK_SCHEDULES = ["5 days", "6 days"]

# UAE Labor Law Constants (Federal Decree-Law No. 33/2021)
# Article 17: Maximum regular working hours
STANDARD_WORK_HOURS_5_DAY = 8  # 8 hours/day for 5-day week = 40 hours/week
STANDARD_WORK_HOURS_6_DAY = 8  # 8 hours/day for 6-day week = 48 hours/week
MAX_WEEKLY_HOURS = 48  # Article 17: Maximum 48 hours per week

# Article 18: Ramadan reduced hours (2 hours less per day)
RAMADAN_REDUCTION_HOURS = 2
RAMADAN_WORK_HOURS = 6  # 8 - 2 = 6 hours during Ramadan

# Article 19: Maximum overtime per day
MAX_OVERTIME_HOURS_PER_DAY = 2

# Standard timings (UAE)
STANDARD_CLOCK_IN = time(8, 0)  # 8:00 AM
STANDARD_CLOCK_OUT = time(17, 0)  # 5:00 PM (8 hours + 1 hour break)
RAMADAN_CLOCK_OUT = time(15, 0)  # 3:00 PM during Ramadan
GRACE_PERIOD_MINUTES = 15  # 15 minutes grace period for late arrivals

# Friday timing (optional - for companies that implement Friday half-day)
# Note: Friday half-day is a company policy, NOT a UAE Labor Law requirement
FRIDAY_CLOCK_OUT = time(12, 0)  # 12:00 PM on Fridays (if half day policy is used)
FRIDAY_WORK_HOURS = 4  # Half day on Fridays (company policy, not law)

# Break duration
STANDARD_BREAK_MINUTES = 60  # 1 hour break (not counted in work hours)

# Overtime multipliers per UAE Labor Law Article 19
OVERTIME_RATE_REGULAR = Decimal("1.25")  # 125% for regular overtime
OVERTIME_RATE_NIGHT = Decimal("1.50")  # 150% for night hours (9 PM - 4 AM)
OVERTIME_RATE_HOLIDAY = Decimal("1.50")  # 150% for holidays/rest days
