from datetime import date, datetime, timezone
from decimal import Decimal
from typing import List, Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from jose import JWTError, jwt
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.database import get_session
from app.models.employee import Employee
from app.models.attendance import AttendanceRecord, STANDARD_WORK_HOURS, GRACE_PERIOD_MINUTES
from app.models.system_settings import SystemSetting
from app.schemas.attendance import (
    ClockInRequest, ClockOutRequest, BreakRequest,
    AttendanceResponse, AttendanceDashboard,
    WFHApprovalRequest, OvertimeApprovalRequest, TodayAttendanceStatus
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
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )


def calculate_hours(clock_in: datetime, clock_out: datetime, break_minutes: int = 0) -> tuple:
    """Calculate total, regular, and overtime hours."""
    if not clock_in or not clock_out:
        return None, None, None
    
    total_seconds = (clock_out - clock_in).total_seconds()
    total_hours = Decimal(str(total_seconds / 3600)) - Decimal(str(break_minutes / 60))
    
    if total_hours < 0:
        total_hours = Decimal("0")
    
    regular_hours = min(total_hours, Decimal(str(STANDARD_WORK_HOURS)))
    overtime_hours = max(total_hours - Decimal(str(STANDARD_WORK_HOURS)), Decimal("0"))
    
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
        wfh_reason=record.wfh_reason,
        wfh_approved=record.wfh_approved,
        wfh_approved_by=record.wfh_approved_by,
        wfh_approved_at=record.wfh_approved_at,
        total_hours=record.total_hours,
        regular_hours=record.regular_hours,
        overtime_hours=record.overtime_hours,
        overtime_type=record.overtime_type,
        overtime_approved=record.overtime_approved,
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
        notes=record.notes,
        created_at=record.created_at,
        updated_at=record.updated_at
    )


@router.get("/today", response_model=TodayAttendanceStatus)
async def get_today_status(
    current_user: Employee = Depends(get_current_employee),
    session: AsyncSession = Depends(get_session)
):
    """Get today's attendance status for current user."""
    today = date.today()
    
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
    """Clock in for the day."""
    # Check if attendance feature is enabled
    if not await check_feature_enabled(session, "feature_attendance"):
        raise HTTPException(status_code=403, detail="Attendance feature is disabled")
    
    # Validate WFH request if feature is disabled
    if request.work_type == "wfh":
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
        work_type=request.work_type,
        wfh_reason=request.wfh_reason if request.work_type == "wfh" else None,
        wfh_approved=None if request.work_type == "wfh" else None,
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
    """Clock out for the day."""
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
    
    # End break if on break
    if record.break_start and not record.break_end:
        record.break_end = now
        record.break_duration_minutes = int((now - record.break_start).total_seconds() / 60)
    
    # Store GPS coordinates if GPS feature is enabled
    gps_enabled = await check_feature_enabled(session, "feature_attendance_gps")
    record.clock_out = now
    record.clock_out_latitude = request.latitude if gps_enabled else None
    record.clock_out_longitude = request.longitude if gps_enabled else None
    record.clock_out_address = request.address if gps_enabled else None
    if request.notes:
        record.notes = (record.notes or "") + "\n" + request.notes
    
    # Calculate hours
    break_mins = record.break_duration_minutes or 0
    total_hrs, regular_hrs, overtime_hrs = calculate_hours(record.clock_in, record.clock_out, break_mins)
    record.total_hours = total_hrs
    record.regular_hours = regular_hrs
    record.overtime_hours = overtime_hrs
    
    # Check if overtime feature is enabled
    overtime_enabled = await check_feature_enabled(session, "feature_attendance_overtime")
    if overtime_hrs and overtime_hrs > 0 and overtime_enabled:
        record.overtime_type = "auto-calculated"
        record.overtime_approved = None  # Requires approval
    elif overtime_hrs and overtime_hrs > 0:
        # Overtime disabled, don't track overtime
        record.overtime_hours = Decimal("0")
    
    # Check early departure (before 5 PM UAE time = 13:00 UTC)
    uae_hour = (now.hour + 4) % 24  # Convert UTC to UAE time
    if uae_hour < 17:
        record.is_early_departure = True
        # Calculate minutes before 5 PM UAE
        record.early_departure_minutes = (17 - uae_hour) * 60 - now.minute
    
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
    
    record.break_start = now
    record.break_end = None
    record.break_duration_minutes = None
    
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
    
    record.break_end = now
    record.break_duration_minutes = int((now - record.break_start).total_seconds() / 60)
    
    await session.commit()
    await session.refresh(record)
    
    return build_response(record, current_user.name)


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
    att_status: Optional[str] = Query(None, alias="status"),
    current_user: Employee = Depends(get_current_employee),
    session: AsyncSession = Depends(get_session)
):
    """Get all attendance records (admin/HR only)."""
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
    if att_status:
        query = query.where(AttendanceRecord.status == att_status)
    
    query = query.order_by(AttendanceRecord.attendance_date.desc())
    
    result = await session.execute(query)
    rows = result.all()
    
    return [build_response(r[0], r[1]) for r in rows]


@router.get("/dashboard", response_model=AttendanceDashboard)
async def get_dashboard(
    current_user: Employee = Depends(get_current_employee),
    session: AsyncSession = Depends(get_session)
):
    """Get attendance dashboard (admin/HR only)."""
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
    wfh = sum(1 for r in records if r.work_type == "wfh")
    late = sum(1 for r in records if r.is_late)
    on_leave = sum(1 for r in records if r.status == "on-leave")
    
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
    
    return AttendanceDashboard(
        total_employees=total_employees,
        clocked_in_today=clocked_in,
        wfh_today=wfh,
        absent_today=total_employees - clocked_in - on_leave,
        late_today=late,
        pending_wfh_approvals=pending_wfh.scalar() or 0,
        pending_overtime_approvals=pending_overtime.scalar() or 0,
        on_leave_today=on_leave
    )


@router.post("/{record_id}/approve-wfh", response_model=AttendanceResponse)
async def approve_wfh(
    record_id: int,
    request: WFHApprovalRequest,
    current_user: Employee = Depends(get_current_employee),
    session: AsyncSession = Depends(get_session)
):
    """Approve or reject WFH request (admin/HR/manager only)."""
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
    """Approve or reject overtime (admin/HR only)."""
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
    
    if not record.overtime_hours or record.overtime_hours <= 0:
        raise HTTPException(status_code=400, detail="No overtime to approve")
    
    record.overtime_approved = request.approved
    record.overtime_approved_by = current_user.id
    record.overtime_approved_at = datetime.now(timezone.utc)
    
    if request.hours and request.approved:
        record.overtime_hours = request.hours
    
    if request.notes:
        record.notes = (record.notes or "") + f"\nOvertime {'Approved' if request.approved else 'Rejected'}: {request.notes}"
    
    await session.commit()
    await session.refresh(record)
    
    return build_response(record, emp_name)
