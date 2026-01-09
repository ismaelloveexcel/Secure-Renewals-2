from datetime import date, datetime, timezone, timedelta
from decimal import Decimal
from typing import List, Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
import jwt
from jwt.exceptions import PyJWTError
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.database import get_session
from app.models.employee import Employee
from app.models.attendance import (
    AttendanceRecord, 
    STANDARD_WORK_HOURS_5_DAY, STANDARD_WORK_HOURS_6_DAY,
    MAX_OVERTIME_HOURS_PER_DAY, MAX_WEEKLY_HOURS,
    RAMADAN_WORK_HOURS, GRACE_PERIOD_MINUTES, 
    FRIDAY_WORK_HOURS,
    OVERTIME_RATE_REGULAR, OVERTIME_RATE_NIGHT, OVERTIME_RATE_HOLIDAY,
    WORK_LOCATIONS, WORK_LOCATIONS_REQUIRE_REMARKS
)
from app.models.system_settings import SystemSetting
from app.schemas.attendance import (
    ClockInRequest, ClockOutRequest, BreakRequest,
    AttendanceResponse, AttendanceDashboard, EmployeeWorkSettings,
    WFHApprovalRequest, OvertimeApprovalRequest, TodayAttendanceStatus,
    ManualAttendanceRequest, AttendanceCorrectionRequest, CorrectionApprovalRequest,
    ExceptionalOvertimeRequest, OffsetBalanceSummary, OffsetDayRecord,
    PaidOvertimeSummary, PaidOvertimeRecord,
    ManagerDailySummary, ManagerDailySummaryRow
)

router = APIRouter(prefix="/attendance", tags=["Attendance"])


async def check_feature_enabled(session: AsyncSession, feature_key: str) -> bool:
    """Check if a feature toggle is enabled."""
    result = await session.execute(
        select(SystemSetting).where(SystemSetting.key == feature_key)
    )
    setting = result.scalar_one_or_none()
    if not setting:
        return True  # Default to enabled if setting doesn't exist
    return setting.is_enabled


async def get_current_employee(
    authorization: str = Header(...),
    session: AsyncSession = Depends(get_session)
) -> Employee:
    """Extract and validate employee from JWT token."""
    try:
        scheme, _, token = authorization.partition(" ")
        if scheme.lower() != "bearer" or not token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authorization header",
            )
        settings = get_settings()
        payload = jwt.decode(token, settings.auth_secret_key, algorithms=["HS256"])
        employee_id = payload.get("sub")
        if not employee_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
            )
        
        # Get employee from database
        result = await session.execute(
            select(Employee).where(Employee.employee_id == employee_id)
        )
        employee = result.scalar_one_or_none()
        if not employee:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Employee not found",
            )
        return employee
    except PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )


def get_employee_work_settings(employee: Employee, is_ramadan: bool = False) -> EmployeeWorkSettings:
    """Get employee work settings from Employee master for attendance calculations.
    
    Links attendance to:
    - Working Days (5 days or 6 days) via employee.work_schedule
    - Work Location (Head Office, KEZAD, Sites) via employee.location  
    - Extra Hours Policy (Offset, Paid, N/A) via employee.overtime_type
    """
    # Parse work schedule to determine standard hours
    work_schedule = employee.work_schedule or "5 days"
    
    if "6" in work_schedule:
        standard_hours = STANDARD_WORK_HOURS_6_DAY  # 8 hours
    else:
        standard_hours = STANDARD_WORK_HOURS_5_DAY  # 8 hours
    
    # Apply Ramadan reduction if applicable
    if is_ramadan:
        standard_hours = RAMADAN_WORK_HOURS  # 6 hours during Ramadan
    
    return EmployeeWorkSettings(
        employee_id=employee.id,
        employee_name=employee.name,
        work_schedule=work_schedule,
        location=employee.location,
        overtime_type=employee.overtime_type,
        standard_hours_per_day=standard_hours,
        is_ramadan_schedule=is_ramadan
    )


def is_friday(check_date: date) -> bool:
    """Check if the given date is a Friday.
    
    Note: Friday half-day is a company policy option for 6-day workers, not a UAE Labor Law requirement.
    """
    return check_date.weekday() == 4  # Friday = 4


def get_standard_hours_for_day(
    employee: Employee, 
    check_date: date, 
    is_ramadan: bool = False
) -> int:
    """Get the standard work hours for a specific day based on employee settings.
    
    Note: Friday half-day for 6-day workers is a company policy option, not a UAE Labor Law requirement.
    Companies can configure whether to use reduced Friday hours or full 8-hour days.
    Currently configured to use Friday half-day - modify FRIDAY_WORK_HOURS if needed.
    """
    work_schedule = employee.work_schedule or "5 days"
    
    # For 6-day workers, Friday can be a half-day (company policy, not law)
    if "6" in work_schedule and is_friday(check_date):
        return FRIDAY_WORK_HOURS  # 4 hours on Friday (configurable)
    
    # Regular hours (with Ramadan reduction if applicable)
    if is_ramadan:
        return RAMADAN_WORK_HOURS  # 6 hours
    
    return STANDARD_WORK_HOURS_5_DAY  # 8 hours


def calculate_hours_with_employee_settings(
    clock_in: datetime, 
    clock_out: datetime, 
    break_minutes: int,
    employee: Employee,
    attendance_date: date,
    is_ramadan: bool = False
) -> tuple:
    """Calculate total, regular, and overtime hours based on employee work settings.
    
    This function links attendance to Employee master data:
    - Uses employee.work_schedule for standard hours (5 days = 8hrs, 6 days = 8hrs + half-day Friday)
    - Uses employee.overtime_type to determine if overtime should be tracked (N/A, Offset, Paid)
    - Applies UAE Labor Law limits (max 2 hours overtime per day per Article 19)
    
    Returns:
        tuple: (total_hours, regular_hours, overtime_hours, exceeds_daily_limit, exceeds_overtime_limit)
    """
    if not clock_in or not clock_out:
        return None, None, None, False, False
    
    # Calculate total worked time
    total_seconds = (clock_out - clock_in).total_seconds()
    total_hours = Decimal(str(total_seconds / 3600)) - Decimal(str(break_minutes / 60))
    
    if total_hours < 0:
        total_hours = Decimal("0")
    
    # Get standard hours for this day based on employee settings
    standard_hours = get_standard_hours_for_day(employee, attendance_date, is_ramadan)
    standard_hours_decimal = Decimal(str(standard_hours))
    
    # Calculate regular and overtime hours
    regular_hours = min(total_hours, standard_hours_decimal)
    overtime_hours = max(total_hours - standard_hours_decimal, Decimal("0"))
    
    # Check employee's overtime policy (from Employee master)
    overtime_policy = employee.overtime_type or "N/A"
    
    # If employee is not eligible for overtime (N/A), zero out overtime
    if overtime_policy.upper() == "N/A":
        overtime_hours = Decimal("0")
    
    # UAE Labor Law compliance checks
    # Article 17: Maximum 8 regular hours + Article 19: Maximum 2 hours overtime = 10 hours max
    max_daily_hours = Decimal(str(standard_hours + MAX_OVERTIME_HOURS_PER_DAY))
    exceeds_daily_limit = total_hours > max_daily_hours
    
    # Article 19: Maximum 2 hours overtime per day
    exceeds_overtime_limit = overtime_hours > Decimal(str(MAX_OVERTIME_HOURS_PER_DAY))
    
    # Cap overtime at legal limit if exceeded
    if exceeds_overtime_limit:
        overtime_hours = Decimal(str(MAX_OVERTIME_HOURS_PER_DAY))
    
    return (
        round(total_hours, 2), 
        round(regular_hours, 2), 
        round(overtime_hours, 2),
        exceeds_daily_limit,
        exceeds_overtime_limit
    )


def calculate_hours(clock_in: datetime, clock_out: datetime, break_minutes: int = 0) -> tuple:
    """Calculate total, regular, and overtime hours.
    
    DEPRECATED: This legacy function does not consider employee-specific work settings.
    Use calculate_hours_with_employee_settings() instead for proper UAE Labor Law compliance
    and employee work schedule integration.
    
    Kept for backward compatibility only.
    """
    if not clock_in or not clock_out:
        return None, None, None
    
    total_seconds = (clock_out - clock_in).total_seconds()
    total_hours = Decimal(str(total_seconds / 3600)) - Decimal(str(break_minutes / 60))
    
    if total_hours < 0:
        total_hours = Decimal("0")
    
    regular_hours = min(total_hours, Decimal(str(STANDARD_WORK_HOURS_5_DAY)))
    overtime_hours = max(total_hours - Decimal(str(STANDARD_WORK_HOURS_5_DAY)), Decimal("0"))
    
    return round(total_hours, 2), round(regular_hours, 2), round(overtime_hours, 2)


def build_response(record: AttendanceRecord, employee_name: str) -> AttendanceResponse:
    """Build attendance response from record."""
    return AttendanceResponse(
        id=record.id,
        employee_id=record.employee_id,
        employee_name=employee_name,
        attendance_date=record.attendance_date,
        clock_in=record.clock_in,
        clock_out=record.clock_out,
        clock_in_latitude=record.clock_in_latitude,
        clock_in_longitude=record.clock_in_longitude,
        clock_in_address=record.clock_in_address,
        clock_out_latitude=record.clock_out_latitude,
        clock_out_longitude=record.clock_out_longitude,
        clock_out_address=record.clock_out_address,
        work_type=record.work_type,
        work_location=record.work_location,
        location_remarks=record.location_remarks,
        wfh_approval_confirmed=record.wfh_approval_confirmed,
        wfh_reason=record.wfh_reason,
        wfh_approved=record.wfh_approved,
        wfh_approved_by=record.wfh_approved_by,
        wfh_approved_at=record.wfh_approved_at,
        total_hours=record.total_hours,
        regular_hours=record.regular_hours,
        overtime_hours=record.overtime_hours,
        overtime_type=record.overtime_type,
        overtime_approved=record.overtime_approved,
        offset_hours_earned=record.offset_hours_earned,
        offset_day_reference=record.offset_day_reference,
        # Exceptional overtime (for N/A/Offset employees getting paid OT)
        exceptional_overtime=record.exceptional_overtime,
        exceptional_overtime_reason=record.exceptional_overtime_reason,
        # Paid overtime calculation
        overtime_rate=record.overtime_rate,
        overtime_amount=record.overtime_amount,
        is_night_overtime=record.is_night_overtime,
        is_holiday_overtime=record.is_holiday_overtime,
        # Food allowance
        food_allowance_eligible=record.food_allowance_eligible,
        food_allowance_amount=record.food_allowance_amount,
        break_start=record.break_start,
        break_end=record.break_end,
        break_duration_minutes=record.break_duration_minutes,
        status=record.status,
        is_late=record.is_late,
        late_minutes=record.late_minutes,
        late_reason=record.late_reason,
        is_early_departure=record.is_early_departure,
        early_departure_minutes=record.early_departure_minutes,
        early_departure_reason=record.early_departure_reason,
        is_ramadan_hours=record.is_ramadan_hours,
        is_rest_day=record.is_rest_day,
        exceeds_daily_limit=record.exceeds_daily_limit,
        exceeds_overtime_limit=record.exceeds_overtime_limit,
        is_manual_entry=record.is_manual_entry,
        manual_entry_reason=record.manual_entry_reason,
        correction_approved=record.correction_approved,
        notes=record.notes,
        created_at=record.created_at,
        updated_at=record.updated_at
    )


@router.get("/employee-work-settings/{employee_id}", response_model=EmployeeWorkSettings)
async def get_employee_attendance_settings(
    employee_id: int,
    current_user: Employee = Depends(get_current_employee),
    session: AsyncSession = Depends(get_session)
):
    """Get employee work settings that affect attendance calculations.
    
    Returns the employee's work settings from Employee master:
    - Working Days: 5 days or 6 days per week
    - Work Location: Head Office, KEZAD, Safario, Sites
    - Extra Hours Policy: Offset, Paid, or N/A
    
    These settings determine:
    - Standard work hours per day
    - Whether overtime is tracked
    - How overtime is compensated
    """
    # Check if admin/HR or the employee themselves
    if current_user.role not in ["admin", "hr"] and current_user.id != employee_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    result = await session.execute(
        select(Employee).where(Employee.id == employee_id)
    )
    employee = result.scalar_one_or_none()
    
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    return get_employee_work_settings(employee)


@router.get("/today", response_model=TodayAttendanceStatus)
async def get_today_status(
    current_user: Employee = Depends(get_current_employee),
    session: AsyncSession = Depends(get_session)
):
    """Get today's attendance status for current user, including employee work settings."""
    # Check if attendance feature is enabled
    if not await check_feature_enabled(session, "feature_attendance"):
        raise HTTPException(status_code=403, detail="Attendance feature is disabled")
    
    today = date.today()
    work_settings = get_employee_work_settings(current_user)
    standard_hours_today = get_standard_hours_for_day(current_user, today)
    
    result = await session.execute(
        select(AttendanceRecord).where(
            and_(
                AttendanceRecord.employee_id == current_user.id,
                AttendanceRecord.attendance_date == today
            )
        )
    )
    record = result.scalar_one_or_none()
    
    if not record:
        return TodayAttendanceStatus(
            date=today,
            is_clocked_in=False,
            clock_in_time=None,
            is_on_break=False,
            break_start_time=None,
            work_type=None,
            work_location=current_user.location,
            location_remarks=None,
            wfh_approval_confirmed=False,
            employee_work_schedule=work_settings.work_schedule,
            employee_overtime_policy=work_settings.overtime_type,
            standard_hours_today=standard_hours_today,
            is_ramadan_schedule=work_settings.is_ramadan_schedule,
            can_clock_in=True,
            can_clock_out=False,
            can_start_break=False,
            can_end_break=False,
            message="You haven't clocked in yet today"
        )
    
    is_on_break = record.break_start is not None and record.break_end is None
    is_clocked_out = record.clock_out is not None
    
    can_clock_in = False
    can_clock_out = record.clock_in is not None and record.clock_out is None
    can_start_break = record.clock_in is not None and record.clock_out is None and not is_on_break
    can_end_break = is_on_break
    
    if is_clocked_out:
        clock_out_str = record.clock_out.strftime('%I:%M %p') if record.clock_out else ""
        message = f"You clocked out at {clock_out_str}"
    elif is_on_break:
        break_start_str = record.break_start.strftime('%I:%M %p') if record.break_start else ""
        message = f"You are on break since {break_start_str}"
    else:
        clock_in_str = record.clock_in.strftime('%I:%M %p') if record.clock_in else ""
        message = f"You clocked in at {clock_in_str}"
    
    return TodayAttendanceStatus(
        date=today,
        is_clocked_in=record.clock_in is not None,
        clock_in_time=record.clock_in,
        is_on_break=is_on_break,
        break_start_time=record.break_start,
        work_type=record.work_type,
        work_location=record.work_location or current_user.location,
        location_remarks=record.location_remarks,
        wfh_approval_confirmed=record.wfh_approval_confirmed,
        employee_work_schedule=work_settings.work_schedule,
        employee_overtime_policy=work_settings.overtime_type,
        standard_hours_today=standard_hours_today,
        is_ramadan_schedule=work_settings.is_ramadan_schedule,
        can_clock_in=can_clock_in,
        can_clock_out=can_clock_out,
        can_start_break=can_start_break,
        can_end_break=can_end_break,
        message=message
    )


@router.post("/clock-in", response_model=AttendanceResponse)
async def clock_in(
    request: ClockInRequest,
    current_user: Employee = Depends(get_current_employee),
    session: AsyncSession = Depends(get_session)
):
    """Clock in for the day with work location dropdown.
    
    Work Location dropdown values (locked):
    - Head Office, KEZAD, Safario, Sites, Meeting, Event, Work From Home
    
    For Sites, Meeting, Event, Work From Home:
    - location_remarks field is required
    
    For Work From Home:
    - wfh_approval_confirmed should be True if employee has obtained Line Manager approval
    """
    # Check if attendance feature is enabled
    if not await check_feature_enabled(session, "feature_attendance"):
        raise HTTPException(status_code=403, detail="Attendance feature is disabled")
    
    # Validate work location is in allowed list
    work_location = request.work_location or current_user.location or "Head Office"
    if work_location not in WORK_LOCATIONS:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid work location. Must be one of: {', '.join(WORK_LOCATIONS)}"
        )
    
    # Validate remarks are provided for locations that require them
    if work_location in WORK_LOCATIONS_REQUIRE_REMARKS:
        if not request.location_remarks or not request.location_remarks.strip():
            raise HTTPException(
                status_code=400,
                detail=f"Details/Remarks are required for work location: {work_location}"
            )
    
    # Validate WFH request if feature is disabled
    if work_location == "Work From Home":
        if not await check_feature_enabled(session, "feature_attendance_wfh"):
            raise HTTPException(status_code=403, detail="WFH feature is disabled")
    
    today = date.today()
    now = datetime.now(timezone.utc)
    
    # Check if already clocked in today
    result = await session.execute(
        select(AttendanceRecord).where(
            and_(
                AttendanceRecord.employee_id == current_user.id,
                AttendanceRecord.attendance_date == today
            )
        )
    )
    existing = result.scalar_one_or_none()
    
    if existing and existing.clock_in:
        raise HTTPException(status_code=400, detail="Already clocked in today")
    
    # Check if late (after 8:15 AM - using UTC for now, assuming UAE timezone UTC+4)
    # Standard start time is 8:00 AM UAE (04:00 UTC)
    uae_hour = (now.hour + 4) % 24  # Convert UTC to UAE time
    uae_minute = now.minute
    is_late = uae_hour > 8 or (uae_hour == 8 and uae_minute > GRACE_PERIOD_MINUTES)
    late_minutes = None
    if is_late:
        # Calculate minutes late from 8:00 AM UAE time
        late_minutes = (uae_hour - 8) * 60 + uae_minute
        if late_minutes < 0:
            late_minutes = 0
    
    # Determine status
    att_status = "late" if is_late else "present"
    
    # Determine work_type based on work_location
    if work_location == "Work From Home":
        work_type = "wfh"
    elif work_location in ["Sites", "Meeting", "Event"]:
        work_type = "field"
    else:
        work_type = "office"
    
    # Store GPS coordinates if GPS feature is enabled
    gps_enabled = await check_feature_enabled(session, "feature_attendance_gps")
    lat = request.latitude if gps_enabled else None
    lng = request.longitude if gps_enabled else None
    addr = request.address if gps_enabled else None
    
    record = AttendanceRecord(
        employee_id=current_user.id,
        attendance_date=today,
        clock_in=now,
        clock_in_latitude=lat,
        clock_in_longitude=lng,
        clock_in_address=addr,
        work_type=work_type,
        work_location=work_location,
        location_remarks=request.location_remarks,
        wfh_approval_confirmed=request.wfh_approval_confirmed if work_location == "Work From Home" else False,
        # wfh_reason is kept for backward compatibility but location_remarks is primary
        status=att_status,
        is_late=is_late,
        late_minutes=late_minutes,
        notes=request.notes
    )
    
    session.add(record)
    await session.commit()
    await session.refresh(record)
    
    return build_response(record, current_user.name)


@router.post("/clock-out", response_model=AttendanceResponse)
async def clock_out(
    request: ClockOutRequest,
    current_user: Employee = Depends(get_current_employee),
    session: AsyncSession = Depends(get_session)
):
    """Clock out for the day with employee work settings integration.
    
    Calculates hours based on employee's work settings:
    - Uses employee.work_schedule for standard hours
    - Applies employee.overtime_type to determine overtime tracking (Offset, Paid, N/A)
    - Enforces UAE Labor Law limits (max 2 hours overtime per day)
    """
    # Check if attendance feature is enabled
    if not await check_feature_enabled(session, "feature_attendance"):
        raise HTTPException(status_code=403, detail="Attendance feature is disabled")
    
    today = date.today()
    now = datetime.now(timezone.utc)
    
    result = await session.execute(
        select(AttendanceRecord).where(
            and_(
                AttendanceRecord.employee_id == current_user.id,
                AttendanceRecord.attendance_date == today
            )
        )
    )
    record = result.scalar_one_or_none()
    
    if not record or not record.clock_in:
        raise HTTPException(status_code=400, detail="You haven't clocked in today")
    
    if record.clock_out:
        raise HTTPException(status_code=400, detail="Already clocked out today")
    
    # End break if on break (accumulate with previous breaks)
    if record.break_start and not record.break_end:
        previous_break_mins = record.break_duration_minutes or 0
        this_break_mins = int((now - record.break_start).total_seconds() / 60)
        record.break_end = now
        record.break_duration_minutes = previous_break_mins + this_break_mins
    
    # Store GPS coordinates if GPS feature is enabled
    gps_enabled = await check_feature_enabled(session, "feature_attendance_gps")
    record.clock_out = now
    record.clock_out_latitude = request.latitude if gps_enabled else None
    record.clock_out_longitude = request.longitude if gps_enabled else None
    record.clock_out_address = request.address if gps_enabled else None
    if request.notes:
        record.notes = (record.notes or "") + "\n" + request.notes
    
    # Calculate hours using employee work settings
    break_mins = record.break_duration_minutes or 0
    (
        total_hrs, 
        regular_hrs, 
        overtime_hrs,
        exceeds_daily_limit,
        exceeds_overtime_limit
    ) = calculate_hours_with_employee_settings(
        record.clock_in, 
        record.clock_out, 
        break_mins,
        current_user,
        today
    )
    
    record.total_hours = total_hrs
    record.regular_hours = regular_hrs
    record.overtime_hours = overtime_hrs
    record.exceeds_daily_limit = exceeds_daily_limit
    record.exceeds_overtime_limit = exceeds_overtime_limit
    
    # Get employee's overtime policy and apply it
    overtime_policy = current_user.overtime_type or "N/A"
    
    # Check if overtime feature is enabled
    overtime_enabled = await check_feature_enabled(session, "feature_attendance_overtime")
    
    if overtime_hrs and overtime_hrs > 0 and overtime_enabled and overtime_policy.upper() != "N/A":
        record.overtime_type = "auto-calculated"
        record.overtime_approved = None  # Requires approval
        
        # For Offset policy, track offset hours earned
        if overtime_policy.upper() == "OFFSET":
            record.offset_hours_earned = overtime_hrs
    elif overtime_hrs and overtime_hrs > 0:
        # Overtime not applicable for this employee
        record.overtime_hours = Decimal("0")
        record.overtime_type = "none"
    
    # Check early departure based on employee's work schedule
    standard_hours_today = get_standard_hours_for_day(current_user, today)
    expected_end_hour = 8 + standard_hours_today + 1  # 8 AM + work hours + 1 hour break
    uae_hour = (now.hour + 4) % 24  # Convert UTC to UAE time
    
    if uae_hour < expected_end_hour:
        record.is_early_departure = True
        # Calculate minutes before expected end time
        record.early_departure_minutes = (expected_end_hour - uae_hour) * 60 - now.minute
    
    await session.commit()
    await session.refresh(record)
    
    return build_response(record, current_user.name)


@router.post("/break/start", response_model=AttendanceResponse)
async def start_break(
    request: BreakRequest,
    current_user: Employee = Depends(get_current_employee),
    session: AsyncSession = Depends(get_session)
):
    """Start break."""
    # Check if attendance feature is enabled
    if not await check_feature_enabled(session, "feature_attendance"):
        raise HTTPException(status_code=403, detail="Attendance feature is disabled")
    
    today = date.today()
    now = datetime.now(timezone.utc)
    
    result = await session.execute(
        select(AttendanceRecord).where(
            and_(
                AttendanceRecord.employee_id == current_user.id,
                AttendanceRecord.attendance_date == today
            )
        )
    )
    record = result.scalar_one_or_none()
    
    if not record or not record.clock_in:
        raise HTTPException(status_code=400, detail="You haven't clocked in today")
    
    if record.clock_out:
        raise HTTPException(status_code=400, detail="Already clocked out")
    
    if record.break_start and not record.break_end:
        raise HTTPException(status_code=400, detail="Already on break")
    
    # Accumulate break duration from previous breaks
    previous_break_mins = record.break_duration_minutes or 0
    
    record.break_start = now
    record.break_end = None
    # Store previous accumulated duration to add to when break ends
    record.break_duration_minutes = previous_break_mins
    
    await session.commit()
    await session.refresh(record)
    
    return build_response(record, current_user.name)


@router.post("/break/end", response_model=AttendanceResponse)
async def end_break(
    request: BreakRequest,
    current_user: Employee = Depends(get_current_employee),
    session: AsyncSession = Depends(get_session)
):
    """End break."""
    # Check if attendance feature is enabled
    if not await check_feature_enabled(session, "feature_attendance"):
        raise HTTPException(status_code=403, detail="Attendance feature is disabled")
    
    today = date.today()
    now = datetime.now(timezone.utc)
    
    result = await session.execute(
        select(AttendanceRecord).where(
            and_(
                AttendanceRecord.employee_id == current_user.id,
                AttendanceRecord.attendance_date == today
            )
        )
    )
    record = result.scalar_one_or_none()
    
    if not record or not record.break_start:
        raise HTTPException(status_code=400, detail="You're not on break")
    
    if record.break_end:
        raise HTTPException(status_code=400, detail="Break already ended")
    
    # Calculate this break's duration and add to accumulated total
    this_break_mins = int((now - record.break_start).total_seconds() / 60)
    previous_break_mins = record.break_duration_minutes or 0
    
    record.break_end = now
    record.break_duration_minutes = previous_break_mins + this_break_mins
    
    await session.commit()
    await session.refresh(record)
    
    return build_response(record, current_user.name)


@router.post("/manual-entry", response_model=AttendanceResponse)
async def create_manual_entry(
    request: ManualAttendanceRequest,
    current_user: Employee = Depends(get_current_employee),
    session: AsyncSession = Depends(get_session)
):
    """Create a manual attendance entry (admin/HR only).
    
    Used for:
    - Missing clock-in/clock-out corrections
    - Backdating attendance for employees who forgot to clock in
    - Historical data entry
    
    Requires HR approval if created by the employee themselves.
    """
    if current_user.role not in ["admin", "hr"]:
        raise HTTPException(status_code=403, detail="Access denied. Manual entries require HR/Admin role.")
    
    # Get the target employee
    result = await session.execute(
        select(Employee).where(Employee.id == request.employee_id)
    )
    employee = result.scalar_one_or_none()
    
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Check if record already exists for this date
    existing = await session.execute(
        select(AttendanceRecord).where(
            and_(
                AttendanceRecord.employee_id == request.employee_id,
                AttendanceRecord.attendance_date == request.attendance_date
            )
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Attendance record already exists for this date. Use correction endpoint instead.")
    
    now = datetime.now(timezone.utc)
    
    # Determine work location
    work_location = request.work_location or employee.location
    
    # Create the manual entry
    record = AttendanceRecord(
        employee_id=request.employee_id,
        attendance_date=request.attendance_date,
        clock_in=request.clock_in,
        clock_out=request.clock_out,
        work_type=request.work_type,
        work_location=work_location,
        status="present" if request.clock_in else "pending",
        is_manual_entry=True,
        manual_entry_reason=request.reason,
        manual_entry_by=current_user.id,
        manual_entry_at=now,
        correction_approved=True,  # Auto-approved since created by HR/Admin
        correction_approved_by=current_user.id,
        correction_approved_at=now,
        notes=request.notes
    )
    
    # Calculate hours if both clock in and clock out are provided
    if request.clock_in and request.clock_out:
        (
            total_hrs, 
            regular_hrs, 
            overtime_hrs,
            exceeds_daily_limit,
            exceeds_overtime_limit
        ) = calculate_hours_with_employee_settings(
            request.clock_in, 
            request.clock_out, 
            0,  # No break duration for manual entry
            employee,
            request.attendance_date
        )
        
        record.total_hours = total_hrs
        record.regular_hours = regular_hrs
        record.overtime_hours = overtime_hrs
        record.exceeds_daily_limit = exceeds_daily_limit
        record.exceeds_overtime_limit = exceeds_overtime_limit
    
    session.add(record)
    await session.commit()
    await session.refresh(record)
    
    return build_response(record, employee.name)


@router.post("/{record_id}/request-correction", response_model=AttendanceResponse)
async def request_correction(
    record_id: int,
    request: AttendanceCorrectionRequest,
    current_user: Employee = Depends(get_current_employee),
    session: AsyncSession = Depends(get_session)
):
    """Request correction to an attendance record.
    
    Employees can request corrections to their own attendance records.
    Corrections require HR approval before taking effect.
    """
    result = await session.execute(
        select(AttendanceRecord, Employee.name).join(
            Employee, AttendanceRecord.employee_id == Employee.id
        ).where(AttendanceRecord.id == record_id)
    )
    row = result.first()
    
    if not row:
        raise HTTPException(status_code=404, detail="Record not found")
    
    record, emp_name = row
    
    # Check if user can request correction (own record or HR/Admin)
    if record.employee_id != current_user.id and current_user.role not in ["admin", "hr"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    now = datetime.now(timezone.utc)
    
    # Store the correction request
    record.is_manual_entry = True
    record.manual_entry_reason = request.reason
    record.manual_entry_by = current_user.id
    record.manual_entry_at = now
    record.correction_approved = None  # Pending approval
    
    # Store proposed corrections in notes (they will be applied upon approval)
    correction_details = []
    if request.clock_in:
        correction_details.append(f"Clock In: {request.clock_in}")
    if request.clock_out:
        correction_details.append(f"Clock Out: {request.clock_out}")
    if request.work_type:
        correction_details.append(f"Work Type: {request.work_type}")
    if request.work_location:
        correction_details.append(f"Location: {request.work_location}")
    
    record.notes = (record.notes or "") + f"\n[Correction Requested: {', '.join(correction_details)}]"
    
    await session.commit()
    await session.refresh(record)
    
    return build_response(record, emp_name)


@router.post("/{record_id}/approve-correction", response_model=AttendanceResponse)
async def approve_correction(
    record_id: int,
    request: CorrectionApprovalRequest,
    current_user: Employee = Depends(get_current_employee),
    session: AsyncSession = Depends(get_session)
):
    """Approve or reject an attendance correction request (admin/HR only)."""
    if current_user.role not in ["admin", "hr"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    result = await session.execute(
        select(AttendanceRecord, Employee.name).join(
            Employee, AttendanceRecord.employee_id == Employee.id
        ).where(AttendanceRecord.id == record_id)
    )
    row = result.first()
    
    if not row:
        raise HTTPException(status_code=404, detail="Record not found")
    
    record, emp_name = row
    
    if not record.is_manual_entry or record.correction_approved is not None:
        raise HTTPException(status_code=400, detail="No pending correction for this record")
    
    now = datetime.now(timezone.utc)
    
    record.correction_approved = request.approved
    record.correction_approved_by = current_user.id
    record.correction_approved_at = now
    
    if request.notes:
        record.notes = (record.notes or "") + f"\nCorrection {'Approved' if request.approved else 'Rejected'}: {request.notes}"
    
    await session.commit()
    await session.refresh(record)
    
    return build_response(record, emp_name)


@router.get("/my-records", response_model=List[AttendanceResponse])
async def get_my_records(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    current_user: Employee = Depends(get_current_employee),
    session: AsyncSession = Depends(get_session)
):
    """Get current user's attendance records."""
    query = select(AttendanceRecord).where(AttendanceRecord.employee_id == current_user.id)
    
    if start_date:
        query = query.where(AttendanceRecord.attendance_date >= start_date)
    if end_date:
        query = query.where(AttendanceRecord.attendance_date <= end_date)
    
    query = query.order_by(AttendanceRecord.attendance_date.desc())
    
    result = await session.execute(query)
    records = result.scalars().all()
    
    return [build_response(r, current_user.name) for r in records]


@router.get("/records", response_model=List[AttendanceResponse])
async def get_all_records(
    employee_id: Optional[int] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    work_type: Optional[str] = Query(None),
    work_location: Optional[str] = Query(None),
    att_status: Optional[str] = Query(None, alias="status"),
    pending_corrections: Optional[bool] = Query(None),
    exceeds_limits: Optional[bool] = Query(None),
    current_user: Employee = Depends(get_current_employee),
    session: AsyncSession = Depends(get_session)
):
    """Get all attendance records (admin/HR only) with enhanced filtering."""
    if current_user.role not in ["admin", "hr"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    query = select(AttendanceRecord, Employee.name).join(
        Employee, AttendanceRecord.employee_id == Employee.id
    )
    
    if employee_id:
        query = query.where(AttendanceRecord.employee_id == employee_id)
    if start_date:
        query = query.where(AttendanceRecord.attendance_date >= start_date)
    if end_date:
        query = query.where(AttendanceRecord.attendance_date <= end_date)
    if work_type:
        query = query.where(AttendanceRecord.work_type == work_type)
    if work_location:
        query = query.where(AttendanceRecord.work_location == work_location)
    if att_status:
        query = query.where(AttendanceRecord.status == att_status)
    if pending_corrections:
        query = query.where(
            and_(
                AttendanceRecord.is_manual_entry == True,
                AttendanceRecord.correction_approved == None
            )
        )
    if exceeds_limits:
        query = query.where(
            (AttendanceRecord.exceeds_daily_limit == True) | 
            (AttendanceRecord.exceeds_overtime_limit == True)
        )
    
    query = query.order_by(AttendanceRecord.attendance_date.desc())
    
    result = await session.execute(query)
    rows = result.all()
    
    return [build_response(r[0], r[1]) for r in rows]


@router.get("/dashboard", response_model=AttendanceDashboard)
async def get_dashboard(
    current_user: Employee = Depends(get_current_employee),
    session: AsyncSession = Depends(get_session)
):
    """Get attendance dashboard (admin/HR only) with location breakdown and compliance alerts."""
    # Check if attendance feature is enabled
    if not await check_feature_enabled(session, "feature_attendance"):
        raise HTTPException(status_code=403, detail="Attendance feature is disabled")
    
    if current_user.role not in ["admin", "hr"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    today = date.today()
    
    # Total active employees
    total_emp = await session.execute(
        select(func.count(Employee.id)).where(Employee.is_active == True)
    )
    total_employees = total_emp.scalar() or 0
    
    # Today's records
    today_records = await session.execute(
        select(AttendanceRecord).where(AttendanceRecord.attendance_date == today)
    )
    records = today_records.scalars().all()
    
    clocked_in = sum(1 for r in records if r.clock_in)
    wfh = sum(1 for r in records if r.work_location == "Work From Home")
    late = sum(1 for r in records if r.is_late)
    on_leave = sum(1 for r in records if r.status == "on-leave")
    
    # Location breakdown (using new WORK_LOCATIONS values)
    at_head_office = sum(1 for r in records if r.work_location == "Head Office")
    at_kezad = sum(1 for r in records if r.work_location == "KEZAD")
    at_safario = sum(1 for r in records if r.work_location == "Safario")
    at_sites = sum(1 for r in records if r.work_location == "Sites")
    at_meeting = sum(1 for r in records if r.work_location == "Meeting")
    at_event = sum(1 for r in records if r.work_location == "Event")
    at_wfh = sum(1 for r in records if r.work_location == "Work From Home")
    
    # UAE compliance alerts
    exceeding_daily_limits = sum(1 for r in records if r.exceeds_daily_limit)
    exceeding_overtime_limits = sum(1 for r in records if r.exceeds_overtime_limit)
    
    # Pending approvals
    pending_wfh = await session.execute(
        select(func.count(AttendanceRecord.id)).where(
            and_(
                AttendanceRecord.work_type == "wfh",
                AttendanceRecord.wfh_approved == None
            )
        )
    )
    pending_overtime = await session.execute(
        select(func.count(AttendanceRecord.id)).where(
            and_(
                AttendanceRecord.overtime_hours > 0,
                AttendanceRecord.overtime_approved == None
            )
        )
    )
    pending_corrections = await session.execute(
        select(func.count(AttendanceRecord.id)).where(
            and_(
                AttendanceRecord.is_manual_entry == True,
                AttendanceRecord.correction_approved == None
            )
        )
    )
    
    return AttendanceDashboard(
        total_employees=total_employees,
        clocked_in_today=clocked_in,
        wfh_today=wfh,
        absent_today=total_employees - clocked_in - on_leave,
        late_today=late,
        pending_wfh_approvals=pending_wfh.scalar() or 0,
        pending_overtime_approvals=pending_overtime.scalar() or 0,
        pending_corrections=pending_corrections.scalar() or 0,
        on_leave_today=on_leave,
        at_head_office=at_head_office,
        at_kezad=at_kezad,
        at_safario=at_safario,
        at_sites=at_sites,
        at_meeting=at_meeting,
        at_event=at_event,
        at_wfh=at_wfh,
        exceeding_daily_limits=exceeding_daily_limits,
        exceeding_overtime_limits=exceeding_overtime_limits
    )


@router.post("/{record_id}/approve-wfh", response_model=AttendanceResponse)
async def approve_wfh(
    record_id: int,
    request: WFHApprovalRequest,
    current_user: Employee = Depends(get_current_employee),
    session: AsyncSession = Depends(get_session)
):
    """Approve or reject WFH request (admin/HR/manager only)."""
    # Check if attendance and WFH features are enabled
    if not await check_feature_enabled(session, "feature_attendance"):
        raise HTTPException(status_code=403, detail="Attendance feature is disabled")
    if not await check_feature_enabled(session, "feature_attendance_wfh"):
        raise HTTPException(status_code=403, detail="WFH feature is disabled")
    
    if current_user.role not in ["admin", "hr"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    result = await session.execute(
        select(AttendanceRecord, Employee.name).join(
            Employee, AttendanceRecord.employee_id == Employee.id
        ).where(AttendanceRecord.id == record_id)
    )
    row = result.first()
    
    if not row:
        raise HTTPException(status_code=404, detail="Record not found")
    
    record, emp_name = row
    
    if record.work_type != "wfh":
        raise HTTPException(status_code=400, detail="Not a WFH record")
    
    record.wfh_approved = request.approved
    record.wfh_approved_by = current_user.id
    record.wfh_approved_at = datetime.now(timezone.utc)
    
    if request.notes:
        record.notes = (record.notes or "") + f"\nWFH {'Approved' if request.approved else 'Rejected'}: {request.notes}"
    
    await session.commit()
    await session.refresh(record)
    
    return build_response(record, emp_name)


@router.post("/{record_id}/approve-overtime", response_model=AttendanceResponse)
async def approve_overtime(
    record_id: int,
    request: OvertimeApprovalRequest,
    current_user: Employee = Depends(get_current_employee),
    session: AsyncSession = Depends(get_session)
):
    """Approve or reject overtime (admin/HR only).
    
    For employees with Offset overtime policy, approved overtime is tracked as offset hours.
    For employees with Paid overtime policy, approved overtime is tracked for payroll.
    """
    # Check if attendance and overtime features are enabled
    if not await check_feature_enabled(session, "feature_attendance"):
        raise HTTPException(status_code=403, detail="Attendance feature is disabled")
    if not await check_feature_enabled(session, "feature_attendance_overtime"):
        raise HTTPException(status_code=403, detail="Overtime feature is disabled")
    
    if current_user.role not in ["admin", "hr"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    result = await session.execute(
        select(AttendanceRecord, Employee.name, Employee.overtime_type).join(
            Employee, AttendanceRecord.employee_id == Employee.id
        ).where(AttendanceRecord.id == record_id)
    )
    row = result.first()
    
    if not row:
        raise HTTPException(status_code=404, detail="Record not found")
    
    record, emp_name, emp_overtime_type = row
    
    if not record.overtime_hours or record.overtime_hours <= 0:
        raise HTTPException(status_code=400, detail="No overtime to approve")
    
    record.overtime_approved = request.approved
    record.overtime_approved_by = current_user.id
    record.overtime_approved_at = datetime.now(timezone.utc)
    
    if request.hours and request.approved:
        record.overtime_hours = request.hours
        
        # Update offset hours if employee uses Offset policy
        if emp_overtime_type and emp_overtime_type.upper() == "OFFSET":
            record.offset_hours_earned = request.hours
    
    if request.notes:
        record.notes = (record.notes or "") + f"\nOvertime {'Approved' if request.approved else 'Rejected'}: {request.notes}"
    
    await session.commit()
    await session.refresh(record)
    
    return build_response(record, emp_name)


@router.post("/{record_id}/exceptional-overtime", response_model=AttendanceResponse)
async def set_exceptional_overtime(
    record_id: int,
    request: ExceptionalOvertimeRequest,
    current_user: Employee = Depends(get_current_employee),
    session: AsyncSession = Depends(get_session)
):
    """Mark a specific day as paid overtime for an employee who is normally not eligible.
    
    Use this for exceptional cases where an employee with N/A or Offset overtime policy
    should receive paid overtime for a specific day (e.g., urgent project, emergency work).
    
    This allows HR to override the employee's default overtime policy on a per-day basis.
    """
    if current_user.role not in ["admin", "hr"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    result = await session.execute(
        select(AttendanceRecord, Employee.name, Employee.basic_salary).join(
            Employee, AttendanceRecord.employee_id == Employee.id
        ).where(AttendanceRecord.id == record_id)
    )
    row = result.first()
    
    if not row:
        raise HTTPException(status_code=404, detail="Record not found")
    
    record, emp_name, basic_salary = row
    
    if not record.overtime_hours or record.overtime_hours <= 0:
        raise HTTPException(status_code=400, detail="No overtime hours to mark as exceptional")
    
    now = datetime.now(timezone.utc)
    
    # Mark as exceptional overtime
    record.exceptional_overtime = request.exceptional_overtime
    record.exceptional_overtime_reason = request.reason
    record.exceptional_overtime_approved_by = current_user.id
    record.is_night_overtime = request.is_night_overtime
    record.is_holiday_overtime = request.is_holiday_overtime
    
    # Calculate overtime rate based on type
    if request.is_night_overtime or request.is_holiday_overtime:
        record.overtime_rate = OVERTIME_RATE_HOLIDAY  # 1.50 (150%)
    else:
        record.overtime_rate = OVERTIME_RATE_REGULAR  # 1.25 (125%)
    
    # Calculate overtime amount if basic salary is available
    if basic_salary and record.overtime_hours:
        # Hourly rate = (Basic Salary / 30 days) / 8 hours
        hourly_rate = (basic_salary / Decimal("30")) / Decimal("8")
        record.overtime_amount = record.overtime_hours * hourly_rate * record.overtime_rate
    
    record.notes = (record.notes or "") + f"\n[Exceptional Overtime: {request.reason}]"
    
    await session.commit()
    await session.refresh(record)
    
    return build_response(record, emp_name)


@router.get("/offset-balance/{employee_id}", response_model=OffsetBalanceSummary)
async def get_offset_balance(
    employee_id: int,
    current_user: Employee = Depends(get_current_employee),
    session: AsyncSession = Depends(get_session)
):
    """Get the offset hours balance for an employee.
    
    For employees with overtime_type = "Offset", this returns:
    - Total offset hours earned from overtime
    - Total offset hours used as time-off
    - Available balance (earned - used)
    - Balance converted to days (balance / 8 hours)
    """
    # Check if admin/HR or the employee themselves
    if current_user.role not in ["admin", "hr"] and current_user.id != employee_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get employee
    emp_result = await session.execute(
        select(Employee).where(Employee.id == employee_id)
    )
    employee = emp_result.scalar_one_or_none()
    
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Get all attendance records with offset hours
    records_result = await session.execute(
        select(AttendanceRecord).where(
            and_(
                AttendanceRecord.employee_id == employee_id,
                AttendanceRecord.offset_hours_earned > 0
            )
        ).order_by(AttendanceRecord.attendance_date.desc())
    )
    records = records_result.scalars().all()
    
    total_earned = Decimal("0")
    total_used = Decimal("0")
    offset_records = []
    
    for record in records:
        earned = record.offset_hours_earned or Decimal("0")
        total_earned += earned
        
        # Check if offset was used (referenced in offset_day_reference)
        used = Decimal("0")
        status = "available"
        if record.offset_day_reference and "Used" in record.offset_day_reference:
            used = earned
            total_used += used
            status = "used"
        
        offset_records.append(OffsetDayRecord(
            attendance_date=record.attendance_date,
            hours_earned=earned,
            hours_used=used,
            reference=record.offset_day_reference,
            status=status
        ))
    
    balance = total_earned - total_used
    days_balance = balance / Decimal("8")  # Convert to days
    
    return OffsetBalanceSummary(
        employee_id=employee_id,
        employee_name=employee.name,
        total_offset_hours_earned=total_earned,
        total_offset_hours_used=total_used,
        offset_hours_balance=balance,
        offset_days_balance=days_balance.quantize(Decimal("0.01")),
        records=offset_records
    )


@router.get("/paid-overtime-summary/{employee_id}", response_model=PaidOvertimeSummary)
async def get_paid_overtime_summary(
    employee_id: int,
    start_date: date = Query(..., description="Period start date"),
    end_date: date = Query(..., description="Period end date"),
    current_user: Employee = Depends(get_current_employee),
    session: AsyncSession = Depends(get_session)
):
    """Get paid overtime summary for an employee for payroll purposes.
    
    For employees with overtime_type = "Paid" or with exceptional overtime days,
    this returns:
    - Total overtime hours broken down by rate (125% vs 150%)
    - Calculated overtime amounts
    - Individual records for review
    """
    # Check if admin/HR or the employee themselves
    if current_user.role not in ["admin", "hr"] and current_user.id != employee_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get employee with basic salary
    emp_result = await session.execute(
        select(Employee).where(Employee.id == employee_id)
    )
    employee = emp_result.scalar_one_or_none()
    
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Get attendance records with overtime in the period
    # Include records where: employee has Paid policy OR exceptional_overtime is True
    records_result = await session.execute(
        select(AttendanceRecord).where(
            and_(
                AttendanceRecord.employee_id == employee_id,
                AttendanceRecord.attendance_date >= start_date,
                AttendanceRecord.attendance_date <= end_date,
                AttendanceRecord.overtime_hours > 0,
                AttendanceRecord.overtime_approved == True
            )
        ).order_by(AttendanceRecord.attendance_date)
    )
    records = records_result.scalars().all()
    
    # Calculate hourly rate from basic salary
    hourly_rate = None
    if employee.basic_salary:
        hourly_rate = (employee.basic_salary / Decimal("30")) / Decimal("8")
    
    # Check employee's overtime policy once outside the loop
    overtime_policy = (employee.overtime_type or "N/A").upper()
    is_paid_policy = overtime_policy == "PAID"
    
    total_overtime_hours = Decimal("0")
    regular_overtime_hours = Decimal("0")
    night_overtime_hours = Decimal("0")
    holiday_overtime_hours = Decimal("0")
    total_amount = Decimal("0")
    overtime_records = []
    
    for record in records:
        # Only include if employee has Paid policy or this is exceptional overtime
        if not is_paid_policy and not record.exceptional_overtime:
            continue
        
        hours = record.overtime_hours or Decimal("0")
        total_overtime_hours += hours
        
        # Determine rate
        if record.is_night_overtime or record.is_holiday_overtime:
            rate = OVERTIME_RATE_HOLIDAY  # 1.50
            if record.is_night_overtime:
                night_overtime_hours += hours
            else:
                holiday_overtime_hours += hours
        else:
            rate = OVERTIME_RATE_REGULAR  # 1.25
            regular_overtime_hours += hours
        
        # Calculate amount
        amount = Decimal("0")
        if hourly_rate:
            amount = hours * hourly_rate * rate
            total_amount += amount
        
        overtime_records.append(PaidOvertimeRecord(
            attendance_date=record.attendance_date,
            overtime_hours=hours,
            rate=rate,
            amount=amount,
            is_exceptional=record.exceptional_overtime,
            notes=record.exceptional_overtime_reason if record.exceptional_overtime else None
        ))
    
    return PaidOvertimeSummary(
        employee_id=employee_id,
        employee_name=employee.name,
        period_start=start_date,
        period_end=end_date,
        total_overtime_hours=total_overtime_hours,
        regular_overtime_hours=regular_overtime_hours,
        night_overtime_hours=night_overtime_hours,
        holiday_overtime_hours=holiday_overtime_hours,
        total_overtime_amount=total_amount,
        hourly_rate=hourly_rate,
        records=overtime_records
    )


@router.get("/manager-daily-summary/{manager_id}", response_model=ManagerDailySummary)
async def get_manager_daily_summary(
    manager_id: int,
    summary_date: Optional[date] = Query(None, description="Date for summary (defaults to today)"),
    current_user: Employee = Depends(get_current_employee),
    session: AsyncSession = Depends(get_session)
):
    """Get daily attendance summary for a manager's team.
    
    This is used to generate the 10:00 AM daily email to managers.
    
    Returns a summary table with:
    | Employee | Status         | Work Location  | Last Update | Remarks      |
    | Ali      | Present        | Head Office    | 08:42       | —            |
    | Sara     | Present        | Sites          | 09:10       | ADNOC        |
    | Omar     | Present        | Work From Home | 08:30       | Approved     |
    | Lina     | On Leave       | —              | —           | Annual Leave |
    | Khaled   | Not Checked In | —              | —           | —            |
    """
    # Check permissions - manager can view their own team, admin/HR can view any team
    if current_user.role not in ["admin", "hr"] and current_user.id != manager_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get manager details
    manager_result = await session.execute(
        select(Employee).where(Employee.id == manager_id)
    )
    manager = manager_result.scalar_one_or_none()
    
    if not manager:
        raise HTTPException(status_code=404, detail="Manager not found")
    
    # Default to today
    today = summary_date or date.today()
    
    # Get all employees who report to this manager
    team_result = await session.execute(
        select(Employee).where(
            and_(
                Employee.line_manager_id == manager_id,
                Employee.is_active == True
            )
        )
    )
    team_members = team_result.scalars().all()
    
    if not team_members:
        return ManagerDailySummary(
            manager_id=manager_id,
            manager_name=manager.name,
            summary_date=today,
            team_size=0,
            present_count=0,
            on_leave_count=0,
            not_checked_in_count=0,
            wfh_count=0,
            employees=[]
        )
    
    summary_rows = []
    present_count = 0
    on_leave_count = 0
    not_checked_in_count = 0
    wfh_count = 0
    
    for employee in team_members:
        # Get today's attendance record for this employee
        record_result = await session.execute(
            select(AttendanceRecord).where(
                and_(
                    AttendanceRecord.employee_id == employee.id,
                    AttendanceRecord.attendance_date == today
                )
            )
        )
        record = record_result.scalar_one_or_none()
        
        if not record or not record.clock_in:
            # Check if on leave (would need Leave model integration)
            status = "Not Checked In"
            work_location = None
            last_update = None
            remarks = None
            not_checked_in_count += 1
        elif record.status == "on-leave":
            status = "On Leave"
            work_location = None
            last_update = None
            remarks = record.notes or "Leave"
            on_leave_count += 1
        else:
            status = "Present"
            work_location = record.work_location
            last_update = record.clock_in.strftime("%H:%M") if record.clock_in else None
            remarks = record.location_remarks
            present_count += 1
            
            # WFH with approval status
            if work_location == "Work From Home":
                wfh_count += 1
                if record.wfh_approval_confirmed:
                    remarks = "Approved" if not remarks else f"Approved - {remarks}"
                else:
                    remarks = "Not Approved" if not remarks else f"Not Approved - {remarks}"
        
        summary_rows.append(ManagerDailySummaryRow(
            employee_name=employee.name,
            status=status,
            work_location=work_location,
            last_update=last_update,
            remarks=remarks or "—"
        ))
    
    return ManagerDailySummary(
        manager_id=manager_id,
        manager_name=manager.name,
        summary_date=today,
        team_size=len(team_members),
        present_count=present_count,
        on_leave_count=on_leave_count,
        not_checked_in_count=not_checked_in_count,
        wfh_count=wfh_count,
        employees=summary_rows
    )
