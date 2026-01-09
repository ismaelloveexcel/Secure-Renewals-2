from datetime import date, datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, Field


class ClockInRequest(BaseModel):
    """Request for clocking in."""
    work_type: str = Field(default="office", description="Type of work: office, wfh, field, client_site, business_travel")
    work_location: Optional[str] = Field(default=None, description="Work location override (Head Office, Kezad, Sites, etc.)")
    latitude: Optional[Decimal] = Field(default=None, description="GPS latitude")
    longitude: Optional[Decimal] = Field(default=None, description="GPS longitude")
    address: Optional[str] = Field(default=None, description="Location address")
    wfh_reason: Optional[str] = Field(default=None, description="Reason for WFH")
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
    work_location: Optional[str] = None
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
    # Offset tracking
    offset_hours_balance: Decimal = Decimal("0")
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
    # By location breakdown
    at_head_office: int = 0
    at_kezad: int = 0
    at_sites: int = 0
    on_client_site: int = 0
    on_business_travel: int = 0
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
