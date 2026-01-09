from datetime import date, datetime
from decimal import Decimal
from typing import Optional, List, TYPE_CHECKING
from pydantic import BaseModel, Field


class ClockInRequest(BaseModel):
    """Request for clocking in."""
    work_location: str = Field(
        default="Head Office", 
        description="Work location (dropdown): Head Office, KEZAD, Safario, Sites, Meeting, Event, Work From Home"
    )
    location_remarks: Optional[str] = Field(
        default=None, 
        description="Details/remarks (required for Sites, Meeting, Event, Work From Home)"
    )
    wfh_approval_confirmed: bool = Field(
        default=False,
        description="WFH Approval Confirmed? (Yes/No) - Employee confirms they have Line Manager approval"
    )
    latitude: Optional[Decimal] = Field(default=None, description="GPS latitude")
    longitude: Optional[Decimal] = Field(default=None, description="GPS longitude")
    address: Optional[str] = Field(default=None, description="Location address")
    notes: Optional[str] = Field(default=None, description="Additional notes")


class ClockOutRequest(BaseModel):
    """Request for clocking out."""
    latitude: Optional[Decimal] = Field(default=None, description="GPS latitude")
    longitude: Optional[Decimal] = Field(default=None, description="GPS longitude")
    address: Optional[str] = Field(default=None, description="Location address")
    notes: Optional[str] = Field(default=None, description="Additional notes")


class BreakRequest(BaseModel):
    """Request for break start/end."""
    latitude: Optional[Decimal] = Field(default=None, description="GPS latitude")
    longitude: Optional[Decimal] = Field(default=None, description="GPS longitude")


class ManualAttendanceRequest(BaseModel):
    """Request for manual attendance entry/correction."""
    employee_id: int = Field(..., description="Employee ID to create record for")
    attendance_date: date = Field(..., description="Date of attendance")
    clock_in: Optional[datetime] = Field(None, description="Clock in time")
    clock_out: Optional[datetime] = Field(None, description="Clock out time")
    work_type: str = Field(default="office", description="Type of work")
    work_location: Optional[str] = Field(None, description="Work location")
    reason: str = Field(..., description="Reason for manual entry")
    notes: Optional[str] = Field(None, description="Additional notes")


class AttendanceCorrectionRequest(BaseModel):
    """Request to correct an attendance record."""
    clock_in: Optional[datetime] = Field(None, description="Corrected clock in time")
    clock_out: Optional[datetime] = Field(None, description="Corrected clock out time")
    work_type: Optional[str] = Field(None, description="Corrected work type")
    work_location: Optional[str] = Field(None, description="Corrected work location")
    reason: str = Field(..., description="Reason for correction")


class AttendanceResponse(BaseModel):
    """Attendance record response."""
    id: int
    employee_id: int
    employee_name: Optional[str] = None
    attendance_date: date
    clock_in: Optional[datetime] = None
    clock_out: Optional[datetime] = None
    clock_in_latitude: Optional[Decimal] = None
    clock_in_longitude: Optional[Decimal] = None
    clock_in_address: Optional[str] = None
    clock_out_latitude: Optional[Decimal] = None
    clock_out_longitude: Optional[Decimal] = None
    clock_out_address: Optional[str] = None
    work_type: str
    # Work location (dropdown values)
    work_location: Optional[str] = None
    location_remarks: Optional[str] = None  # Details for Sites, Meeting, Event, WFH
    wfh_approval_confirmed: bool = False  # Employee confirms WFH approval
    wfh_reason: Optional[str] = None
    wfh_approved: Optional[bool] = None
    wfh_approved_by: Optional[int] = None
    wfh_approved_at: Optional[datetime] = None
    total_hours: Optional[Decimal] = None
    regular_hours: Optional[Decimal] = None
    overtime_hours: Optional[Decimal] = None
    overtime_type: str
    overtime_approved: Optional[bool] = None
    # Offset tracking
    offset_hours_earned: Optional[Decimal] = None
    offset_day_reference: Optional[str] = None
    # Exceptional overtime (override for specific days)
    exceptional_overtime: bool = False
    exceptional_overtime_reason: Optional[str] = None
    # Paid overtime calculation
    overtime_rate: Optional[Decimal] = None  # 1.25 or 1.50
    overtime_amount: Optional[Decimal] = None  # Calculated amount in AED
    is_night_overtime: bool = False
    is_holiday_overtime: bool = False
    # Food/Meal allowance
    food_allowance_eligible: bool = False
    food_allowance_amount: Optional[Decimal] = None
    break_start: Optional[datetime] = None
    break_end: Optional[datetime] = None
    break_duration_minutes: Optional[int] = None
    status: str
    is_late: bool
    late_minutes: Optional[int] = None
    late_reason: Optional[str] = None
    is_early_departure: bool
    early_departure_minutes: Optional[int] = None
    early_departure_reason: Optional[str] = None
    # UAE Labor Law compliance flags
    is_ramadan_hours: bool = False
    is_rest_day: bool = False
    exceeds_daily_limit: bool = False
    exceeds_overtime_limit: bool = False
    # Manual entry/correction info
    is_manual_entry: bool = False
    manual_entry_reason: Optional[str] = None
    correction_approved: Optional[bool] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AttendanceSummary(BaseModel):
    """Summary of attendance for a period."""
    employee_id: int
    employee_name: str
    # Employee work settings (linked from Employee master)
    work_schedule: Optional[str] = None  # "5 days" or "6 days"
    work_location: Optional[str] = None  # Head Office, Kezad, Sites
    overtime_policy: Optional[str] = None  # N/A, Offset, Paid
    period_start: date
    period_end: date
    total_days: int
    present_days: int
    absent_days: int
    late_days: int
    wfh_days: int
    half_days: int
    leave_days: int
    rest_days: int = 0
    total_hours: Decimal
    regular_hours: Decimal
    overtime_hours: Decimal
    # Offset tracking (for Offset overtime policy employees)
    offset_hours_balance: Decimal = Decimal("0")
    offset_hours_earned: Decimal = Decimal("0")
    offset_days_equivalent: Decimal = Decimal("0")  # offset_hours_earned / 8
    # Paid overtime tracking (for Paid overtime policy employees)
    paid_overtime_hours: Decimal = Decimal("0")
    paid_overtime_amount: Decimal = Decimal("0")  # Total calculated pay
    exceptional_overtime_days: int = 0  # Days with exceptional overtime
    # Food allowance tracking
    food_allowance_days: int = 0
    total_food_allowance: Decimal = Decimal("0")
    average_clock_in: Optional[str] = None
    average_clock_out: Optional[str] = None
    # UAE compliance summary
    days_exceeding_limits: int = 0
    ramadan_days: int = 0


class EmployeeWorkSettings(BaseModel):
    """Employee work settings from Employee master - used for attendance calculations."""
    employee_id: int
    employee_name: str
    work_schedule: Optional[str] = None  # "5 days" or "6 days"
    location: Optional[str] = None  # Head Office, Kezad, Safario, Sites
    overtime_type: Optional[str] = None  # N/A, Offset, Paid
    standard_hours_per_day: int = 8  # Calculated from work_schedule
    is_ramadan_schedule: bool = False


class WFHApprovalRequest(BaseModel):
    """Request to approve/reject WFH."""
    approved: bool
    notes: Optional[str] = None


class OvertimeApprovalRequest(BaseModel):
    """Request to approve/reject overtime."""
    approved: bool
    hours: Optional[Decimal] = None
    notes: Optional[str] = None


class ExceptionalOvertimeRequest(BaseModel):
    """Request to mark a specific day as paid overtime (for employees normally not eligible).
    
    Used when an employee with N/A or Offset overtime policy should get paid overtime
    for a specific day due to exceptional circumstances.
    """
    exceptional_overtime: bool = Field(True, description="Mark this day as paid overtime")
    reason: str = Field(..., description="Reason for exceptional overtime")
    is_night_overtime: bool = Field(False, description="Is this night overtime (9 PM - 4 AM)? 150% rate")
    is_holiday_overtime: bool = Field(False, description="Is this holiday overtime? 150% rate")


class OffsetDayRecord(BaseModel):
    """Individual offset day record."""
    attendance_date: date
    hours_earned: Decimal
    hours_used: Decimal = Decimal("0")
    reference: Optional[str] = None  # e.g., "Used on 2026-01-15"
    status: str = "available"  # available, used, expired


class OffsetBalanceSummary(BaseModel):
    """Summary of offset hours balance for an employee."""
    employee_id: int
    employee_name: str
    total_offset_hours_earned: Decimal = Decimal("0")  # Total offset hours accumulated
    total_offset_hours_used: Decimal = Decimal("0")  # Hours used as time-off
    offset_hours_balance: Decimal = Decimal("0")  # Available balance
    offset_days_balance: Decimal = Decimal("0")  # Balance converted to days (balance / 8)
    records: List[OffsetDayRecord] = []  # Detailed breakdown


class PaidOvertimeRecord(BaseModel):
    """Individual paid overtime record."""
    attendance_date: date
    overtime_hours: Decimal
    rate: Decimal  # 1.25 or 1.50
    amount: Decimal  # hours * hourly_rate * rate
    is_exceptional: bool = False  # Was this an exceptional override?
    notes: Optional[str] = None


class PaidOvertimeSummary(BaseModel):
    """Summary of paid overtime for payroll."""
    employee_id: int
    employee_name: str
    period_start: date
    period_end: date
    total_overtime_hours: Decimal = Decimal("0")
    regular_overtime_hours: Decimal = Decimal("0")  # 125% rate
    night_overtime_hours: Decimal = Decimal("0")  # 150% rate
    holiday_overtime_hours: Decimal = Decimal("0")  # 150% rate
    total_overtime_amount: Decimal = Decimal("0")  # Total calculated pay
    hourly_rate: Optional[Decimal] = None  # Base hourly rate from salary
    records: List[PaidOvertimeRecord] = []


class CorrectionApprovalRequest(BaseModel):
    """Request to approve/reject attendance correction."""
    approved: bool
    notes: Optional[str] = None


class AttendanceFilter(BaseModel):
    """Filter for attendance records."""
    employee_id: Optional[int] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    work_type: Optional[str] = None
    work_location: Optional[str] = None
    status: Optional[str] = None
    has_overtime: Optional[bool] = None
    is_wfh: Optional[bool] = None
    is_manual_entry: Optional[bool] = None
    pending_corrections: Optional[bool] = None
    exceeds_limits: Optional[bool] = None


class TodayAttendanceStatus(BaseModel):
    """Today's attendance status for an employee."""
    date: date
    is_clocked_in: bool
    clock_in_time: Optional[datetime] = None
    is_on_break: bool
    break_start_time: Optional[datetime] = None
    work_type: Optional[str] = None
    work_location: Optional[str] = None
    location_remarks: Optional[str] = None
    wfh_approval_confirmed: bool = False
    # Employee work settings
    employee_work_schedule: Optional[str] = None
    employee_overtime_policy: Optional[str] = None
    standard_hours_today: int = 8
    is_ramadan_schedule: bool = False
    can_clock_in: bool
    can_clock_out: bool
    can_start_break: bool
    can_end_break: bool
    message: str


class ManagerDailySummaryRow(BaseModel):
    """Single row for manager daily attendance summary email."""
    employee_name: str
    status: str  # Present, On Leave, Not Checked In
    work_location: Optional[str] = None
    last_update: Optional[str] = None  # Time of last action (e.g., "08:42")
    remarks: Optional[str] = None  # location_remarks or leave type


class ManagerDailySummary(BaseModel):
    """Daily attendance summary for manager email (sent at 10:00 AM)."""
    manager_id: int
    manager_name: str
    summary_date: date
    team_size: int
    present_count: int
    on_leave_count: int
    not_checked_in_count: int
    wfh_count: int
    employees: List[ManagerDailySummaryRow] = []


class AttendanceDashboard(BaseModel):
    """Attendance dashboard for admin/HR."""
    total_employees: int
    clocked_in_today: int
    wfh_today: int
    absent_today: int
    late_today: int
    pending_wfh_approvals: int
    pending_overtime_approvals: int
    pending_corrections: int = 0
    on_leave_today: int
    # By location breakdown (updated to match new WORK_LOCATIONS)
    at_head_office: int = 0
    at_kezad: int = 0
    at_safario: int = 0
    at_sites: int = 0
    at_meeting: int = 0
    at_event: int = 0
    at_wfh: int = 0  # Work From Home
    # UAE compliance alerts
    exceeding_daily_limits: int = 0
    exceeding_overtime_limits: int = 0


class WeeklyAttendanceSummary(BaseModel):
    """Weekly attendance summary for UAE Labor Law compliance."""
    employee_id: int
    employee_name: str
    week_start: date
    week_end: date
    work_schedule: Optional[str] = None  # "5 days" or "6 days"
    total_work_days: int = 0
    total_rest_days: int = 0
    total_hours: Decimal = Decimal("0")
    total_overtime_hours: Decimal = Decimal("0")
    # UAE Labor Law compliance
    exceeds_weekly_limit: bool = False  # More than 48 hours
    has_rest_day: bool = True  # At least one rest day per week required
    compliance_notes: Optional[str] = None
