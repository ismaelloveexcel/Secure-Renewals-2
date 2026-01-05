import csv
import hashlib
import secrets
from datetime import date, datetime, timedelta, timezone
from io import StringIO
from typing import List, Optional

from fastapi import HTTPException, UploadFile, status
from jose import jwt
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.employee import Employee
from app.repositories.employees import EmployeeRepository
from app.schemas.employee import (
    EmployeeCreate,
    EmployeeCSVRow,
    EmployeeResponse,
    EmployeeUpdate,
    LoginRequest,
    LoginResponse,
    PasswordChangeRequest,
)


def hash_password(password: str) -> str:
    """
    Hash password using PBKDF2-HMAC-SHA256 with salt.
    For production, consider using bcrypt or argon2.
    """
    salt = secrets.token_hex(16)
    iterations = 100000
    key = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), iterations)
    return f"{salt}:{key.hex()}"


def verify_password(password: str, hashed: str) -> bool:
    """Verify password against hash."""
    try:
        salt, stored_key = hashed.split(':')
        iterations = 100000
        key = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), iterations)
        return key.hex() == stored_key
    except ValueError:
        import logging
        logger = logging.getLogger(__name__)
        if hashlib.sha256(password.encode()).hexdigest() == hashed:
            logger.warning(
                "Legacy unsalted password detected. User should change password."
            )
            return True
        return False


def dob_to_password(dob: date) -> str:
    """Convert DOB to initial password format DDMMYYYY."""
    return dob.strftime("%d%m%Y")


def parse_dob(raw_dob: str) -> date:
    """Parse a date of birth from DDMMYYYY or ISO formats."""
    raw_dob = raw_dob.strip()
    if not raw_dob:
        raise ValueError("Date of birth is required")

    if len(raw_dob) == 8 and raw_dob.isdigit():
        return date(
            year=int(raw_dob[4:8]),
            month=int(raw_dob[2:4]),
            day=int(raw_dob[0:2]),
        )

    return date.fromisoformat(raw_dob)


def create_access_token(employee: Employee) -> str:
    """Create JWT access token for employee."""
    settings = get_settings()
    expire = datetime.now(timezone.utc) + timedelta(hours=settings.session_timeout_hours)
    payload = {
        "sub": employee.employee_id,
        "name": employee.name,
        "role": employee.role,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }
    secret = settings.auth_secret_key
    if secret == "dev-secret-key-change-in-production":
        import logging
        logging.getLogger(__name__).warning(
            "SECURITY WARNING: Using default auth secret key. "
            "Set AUTH_SECRET_KEY environment variable in production!"
        )
    return jwt.encode(payload, secret, algorithm="HS256")


class EmployeeService:
    """Service for employee management and authentication."""

    def __init__(self, repository: EmployeeRepository) -> None:
        self._repo = repository

    async def login(
        self, session: AsyncSession, request: LoginRequest
    ) -> LoginResponse:
        """Authenticate employee and return token."""
        employee = await self._repo.get_by_employee_id(session, request.employee_id)
        
        if not employee:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid employee ID or password",
            )
        
        if not employee.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account is deactivated",
            )
        
        if not verify_password(request.password, employee.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid employee ID or password",
            )
        
        await self._repo.update_last_login(session, employee.employee_id)
        await session.commit()
        
        token = create_access_token(employee)
        
        return LoginResponse(
            access_token=token,
            token_type="bearer",
            requires_password_change=not employee.password_changed,
            employee_id=employee.employee_id,
            name=employee.name,
            role=employee.role,
        )

    async def change_password(
        self, session: AsyncSession, employee_id: str, request: PasswordChangeRequest
    ) -> bool:
        """Change employee password."""
        employee = await self._repo.get_by_employee_id(session, employee_id)
        
        if not employee:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Employee not found",
            )
        
        if not verify_password(request.current_password, employee.password_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect",
            )
        
        new_hash = hash_password(request.new_password)
        result = await self._repo.update_password(session, employee_id, new_hash)
        await session.commit()
        return result

    async def reset_password(
        self, session: AsyncSession, employee_id: str
    ) -> bool:
        """Reset password to DOB (admin function)."""
        employee = await self._repo.get_by_employee_id(session, employee_id)
        
        if not employee:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Employee not found",
            )
        
        dob_password = dob_to_password(employee.date_of_birth)
        dob_hash = hash_password(dob_password)
        result = await self._repo.reset_password_to_dob(session, employee_id, dob_hash)
        await session.commit()
        return result

    async def create_employee(
        self, session: AsyncSession, data: EmployeeCreate
    ) -> EmployeeResponse:
        """Create a new employee."""
        if await self._repo.exists(session, data.employee_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Employee ID {data.employee_id} already exists",
            )
        
        initial_password = dob_to_password(data.date_of_birth)
        password_hash = hash_password(initial_password)
        
        employee = await self._repo.create(
            session,
            employee_id=data.employee_id,
            name=data.name,
            date_of_birth=data.date_of_birth,
            password_hash=password_hash,
            email=data.email,
            department=data.department,
            role=data.role,
        )
        await session.commit()
        
        return EmployeeResponse.model_validate(employee)

    async def list_employees(
        self, session: AsyncSession, active_only: bool = True
    ) -> List[EmployeeResponse]:
        """List all employees."""
        employees = await self._repo.list_all(session, active_only)
        return [EmployeeResponse.model_validate(e) for e in employees]

    async def import_from_csv(
        self, session: AsyncSession, file: UploadFile
    ) -> dict:
        """
        Import employees from CSV file.
        
        Supports two formats:
        1. Baynunah Employee Database format (Employee No, Employee Name, etc.)
        2. Simple format (employee_id, name, email, department, date_of_birth, role)
        """
        content = await file.read()
        # Try UTF-8 with BOM first (Excel exports), then plain UTF-8
        try:
            text = content.decode("utf-8-sig")
        except UnicodeDecodeError:
            text = content.decode("utf-8")
        
        reader = csv.DictReader(StringIO(text))
        headers = reader.fieldnames or []
        
        # Detect format based on headers
        is_baynunah_format = "Employee No" in headers or "Employee Name" in headers
        
        created = 0
        skipped = 0
        errors = []
        allowed_roles = {"admin", "hr", "viewer"}

        for row_num, row in enumerate(reader, start=2):
            try:
                if is_baynunah_format:
                    # Baynunah Employee Database format
                    employee_id = row.get("Employee No", "").strip()
                    name = row.get("Employee Name", "").strip()
                    
                    if not employee_id or not name:
                        skipped += 1
                        continue
                    
                    # Parse DOB
                    dob_str = row.get("DOB", "").strip()
                    dob = self._parse_date_flexible(dob_str)
                    if not dob:
                        dob = date(1990, 1, 1)  # Default DOB if not provided
                    
                    # Determine role based on department/function
                    department = row.get("Department", "").strip()
                    function = row.get("Function", "").strip()
                    role = "viewer"
                    if "HR" in department:
                        role = "hr"
                    if function.lower() in ["executive", "director"]:
                        role = "hr"
                    
                    # Check if already exists
                    if await self._repo.exists(session, employee_id):
                        skipped += 1
                        continue
                    
                    # Create employee with all Baynunah fields
                    password_hash = hash_password(dob.strftime("%d%m%Y"))
                    
                    employee = Employee(
                        employee_id=employee_id,
                        name=name,
                        email=row.get("Company Email Address", "").strip() or None,
                        department=department or None,
                        date_of_birth=dob,
                        password_hash=password_hash,
                        password_changed=False,
                        role=role,
                        is_active=self._map_employment_status(row.get("Employment Status")) == "Active",
                        
                        # Job info
                        job_title=row.get("Job Title", "").strip() or None,
                        function=function or None,
                        location=row.get("Location", "").strip() or None,
                        work_schedule=row.get("Work Schedule", "").strip() or None,
                        
                        # Personal info
                        gender=row.get("Gender", "").strip() or None,
                        nationality=row.get("Nationality", "").strip() or None,
                        company_phone=row.get("Company Phone Number", "").strip() or None,
                        
                        # Line manager
                        line_manager_name=row.get("Line Manager", "").strip() or None,
                        line_manager_email=row.get("Line Manager's Email (from Line Manager)", "").strip() or None,
                        
                        # Employment dates
                        joining_date=self._parse_date_flexible(row.get("Joining Date", "")),
                        last_promotion_date=self._parse_date_flexible(row.get("Last Promotion Date", "")),
                        last_increment_date=self._parse_date_flexible(row.get("Last Increment Date", "")),
                        
                        # Probation
                        probation_start_date=self._parse_date_flexible(row.get("Joining Date", "")),
                        one_month_eval_date=self._parse_date_flexible(row.get("1 Month Eval Date", "")),
                        three_month_eval_date=self._parse_date_flexible(row.get("3 Month Eval Date", "")),
                        six_month_eval_date=self._parse_date_flexible(row.get("6 Month Eval Date", "")),
                        probation_status=self._map_probation_status(row.get("Probation Status", "")),
                        
                        # Employment status
                        employment_status=self._map_employment_status(row.get("Employment Status")),
                        years_of_service=self._parse_int(row.get("Years of Service", "")),
                        
                        # Leave and overtime
                        annual_leave_entitlement=self._parse_int(row.get("Annual Leave Entitlement", "")),
                        overtime_type=row.get("Overtime Type", "").strip() or None,
                        
                        # Compliance
                        security_clearance=row.get("Security Clearance", "").strip() or None,
                        visa_status=row.get("Visa Status", "").strip() or None,
                        
                        # Medical insurance
                        medical_insurance_provider=row.get("Medical Insurance Provider", "").strip() or None,
                        medical_insurance_category=row.get("Medical Insurance Category", "").strip() or None,
                        
                        # Compensation
                        basic_salary=self._parse_decimal(row.get("Basic Salary", "")),
                        housing_allowance=self._parse_decimal(row.get("Housing", "")),
                        transportation_allowance=self._parse_decimal(row.get("Transportation", "")),
                        air_ticket_entitlement=self._parse_decimal(row.get("Air Ticket Entitlement", "")),
                        other_allowance=self._parse_decimal(row.get("Other Allowance", "")),
                        consultancy_fees=self._parse_decimal(row.get("Consultancy Fees", "")),
                        air_fare_allowance=self._parse_decimal(row.get("Air Fare Allowance", "")),
                        family_air_ticket_allowance=self._parse_decimal(row.get("Family Air Ticket Allowance", "")),
                        net_salary=self._parse_decimal(row.get("Net Salary", "")),
                        
                        # Profile status
                        profile_status="incomplete",
                    )
                    
                    session.add(employee)
                    created += 1
                    
                else:
                    # Simple format: employee_id, name, email, department, date_of_birth, role
                    employee_id = row.get("employee_id", "").strip()
                    name = row.get("name", "").strip()

                    if not employee_id or not name:
                        raise ValueError("Employee ID and name are required")

                    dob = parse_dob(row.get("date_of_birth", ""))
                    role = (row.get("role", "viewer") or "viewer").strip().lower()

                    if role not in allowed_roles:
                        raise ValueError(
                            "Invalid role. Allowed values: admin, hr, viewer"
                        )

                    employee_data = EmployeeCreate(
                        employee_id=employee_id,
                        name=name,
                        email=row.get("email", "").strip() or None,
                        department=row.get("department", "").strip() or None,
                        date_of_birth=dob,
                        role=role,
                        job_title=row.get("job_title", "").strip() or None,
                        function=row.get("function", "").strip() or None,
                        location=row.get("location", "").strip() or None,
                        joining_date=self._parse_date_flexible(row.get("joining_date", "")),
                    )

                    if await self._repo.exists(session, employee_data.employee_id):
                        skipped += 1
                        continue

                    await self.create_employee(session, employee_data)
                    created += 1

            except Exception as e:
                errors.append(f"Row {row_num}: {str(e)}")

        await session.commit()

        return {
            "created": created,
            "skipped": skipped,
            "errors": errors,
            "format_detected": "baynunah" if is_baynunah_format else "simple",
        }
    
    def _parse_date_flexible(self, date_str: Optional[str]) -> Optional[date]:
        """Parse various date formats from CSV."""
        if not date_str or not isinstance(date_str, str) or date_str.strip() == "":
            return None
        
        date_str = date_str.strip()
        
        # Try various formats
        formats = [
            "%B %d, %Y",      # "March 11, 1979"
            "%d/%m/%Y",       # "11/03/1979"
            "%Y-%m-%d",       # "1979-03-11"
            "%m/%d/%Y",       # "03/11/1979"
            "%d-%m-%Y",       # "11-03-1979"
        ]
        
        for fmt in formats:
            try:
                return datetime.strptime(date_str, fmt).date()
            except ValueError:
                continue
        
        return None
    
    def _parse_decimal(self, value_str: Optional[str]):
        """Parse decimal value from CSV."""
        from decimal import Decimal, InvalidOperation
        
        if not value_str or not isinstance(value_str, str) or value_str.strip() == "":
            return None
        
        try:
            clean = value_str.strip().replace(",", "")
            return Decimal(clean)
        except (InvalidOperation, ValueError):
            return None
    
    def _parse_int(self, value_str: Optional[str]) -> Optional[int]:
        """Parse integer value from CSV."""
        if not value_str or not isinstance(value_str, str) or value_str.strip() == "":
            return None
        
        try:
            clean = value_str.strip()
            if clean.lower() == "nan":
                return None
            return int(float(clean))
        except (ValueError, TypeError):
            return None
    
    def _map_employment_status(self, status: Optional[str]) -> str:
        """Map employment status to standard values."""
        if not status:
            return "Active"
        
        status_lower = status.lower().strip()
        mapping = {
            "active": "Active",
            "terminated": "Terminated",
            "resigned": "Resigned",
            "consultant": "Consultant",
            "pending": "Pending",
            "backed out": "Backed Out",
            "outsourced": "Outsourced",
            "freelancer": "Freelancer",
        }
        return mapping.get(status_lower, status)
    
    def _map_probation_status(self, status: Optional[str]) -> Optional[str]:
        """Map probation status to standard values."""
        if not status:
            return None
        
        status_lower = status.lower().strip()
        mapping = {
            "confirmed": "Confirmed",
            "under probation": "Under Probation",
            "not yet joined": "Not Yet Joined",
            "n/a": None,
        }
        return mapping.get(status_lower, status)

    async def deactivate_employee(
        self, session: AsyncSession, employee_id: str
    ) -> bool:
        """Deactivate an employee."""
        if not await self._repo.exists(session, employee_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Employee not found",
            )
        result = await self._repo.deactivate(session, employee_id)
        await session.commit()
        return result

    async def get_employee(
        self, session: AsyncSession, employee_id: str
    ) -> Employee:
        """Get a single employee by their employee ID."""
        employee = await self._repo.get_by_employee_id(session, employee_id)
        if not employee:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Employee {employee_id} not found",
            )
        return employee

    async def update_employee(
        self, session: AsyncSession, employee_id: str, data: EmployeeUpdate
    ) -> Employee:
        """Update an employee's information."""
        if not await self._repo.exists(session, employee_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Employee not found",
            )
        
        # Get update data, excluding unset fields
        update_data = data.model_dump(exclude_unset=True)
        
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update",
            )
        
        employee = await self._repo.update(session, employee_id, update_data)
        if not employee:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Employee not found after update",
            )
        await session.commit()
        await session.refresh(employee)
        return employee

    async def get_compliance_alerts(
        self, session: AsyncSession, days: int = 60
    ) -> dict:
        """
        Get employees with expiring compliance documents.
        
        Returns alerts grouped by urgency:
        - expired: Already expired
        - days_7: Expiring within 7 days
        - days_30: Expiring within 30 days
        - days_custom: Expiring within specified days (default 60)
        """
        # Validate days parameter
        if days < 1 or days > 365:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Days must be between 1 and 365",
            )
        
        today = date.today()
        employees = await self._repo.get_all_active_for_compliance(session)
        
        alerts = {
            'expired': [],
            'days_7': [],
            'days_30': [],
            'days_custom': []
        }
        
        # Fields to check for expiry
        compliance_fields = [
            ('visa_expiry_date', 'Visa'),
            ('emirates_id_expiry', 'Emirates ID'),
            ('medical_fitness_expiry', 'Medical Fitness'),
            ('iloe_expiry', 'ILOE'),
            ('contract_end_date', 'Contract'),
        ]
        
        for emp in employees:
            for field_name, label in compliance_fields:
                expiry = getattr(emp, field_name, None)
                if expiry:
                    days_until = (expiry - today).days
                    
                    alert = {
                        'employee_id': emp.employee_id,
                        'name': emp.name,
                        'document_type': label,
                        'expiry_date': expiry.isoformat(),
                        'days_remaining': days_until
                    }
                    
                    if days_until < 0:
                        alert['days_overdue'] = abs(days_until)
                        alerts['expired'].append(alert)
                    elif days_until <= 7:
                        alerts['days_7'].append(alert)
                    elif days_until <= 30:
                        alerts['days_30'].append(alert)
                    elif days_until <= days:
                        alerts['days_custom'].append(alert)
        
        return alerts

    async def bulk_update_from_csv(
        self, session: AsyncSession, file: UploadFile, update_layer: str
    ) -> dict:
        """
        Bulk update existing employees from CSV file.
        
        Matches by Employee ID and updates records in the specified layer.
        """
        from app.models.employee_compliance import EmployeeCompliance
        from app.models.employee_bank import EmployeeBank
        from sqlalchemy import select
        
        content = await file.read()
        try:
            text = content.decode("utf-8-sig")
        except UnicodeDecodeError:
            text = content.decode("utf-8")
        
        reader = csv.DictReader(StringIO(text))
        headers = reader.fieldnames or []
        
        updated = 0
        not_found = 0
        skipped = 0
        errors = []
        
        # Field mappings for each layer
        employee_fields = {
            'name', 'email', 'department', 'job_title', 'function', 'location',
            'work_schedule', 'gender', 'nationality', 'company_phone',
            'line_manager_name', 'line_manager_email', 'joining_date',
            'employment_status', 'security_clearance', 'visa_status',
            'medical_insurance_provider', 'medical_insurance_category',
            'basic_salary', 'housing_allowance', 'transportation_allowance',
            'air_ticket_entitlement', 'other_allowance', 'net_salary'
        }
        
        compliance_fields = {
            'visa_number', 'visa_uid', 'visa_type', 'visa_issue_date', 'visa_expiry_date',
            'emirates_id_number', 'emirates_id_issue_date', 'emirates_id_expiry',
            'medical_fitness_date', 'medical_fitness_expiry', 'medical_certificate_number',
            'work_permit_number', 'work_permit_issue_date', 'work_permit_expiry_date',
            'iloe_status', 'iloe_issue_date', 'iloe_expiry', 'iloe_certificate_number',
            'labour_card_number', 'labour_card_issue_date', 'labour_card_expiry_date',
            'contract_type', 'contract_start_date', 'contract_end_date'
        }
        
        bank_fields = {
            'bank_name', 'bank_branch', 'account_name', 'account_number',
            'iban', 'swift_code', 'routing_number', 'currency'
        }
        
        for row_num, row in enumerate(reader, start=2):
            # Get employee ID first (no DB operations)
            employee_id = (
                row.get("employee_id", "").strip() or
                row.get("Employee No", "").strip() or
                row.get("Employee ID", "").strip()
            )
            
            if not employee_id:
                skipped += 1
                continue
            
            # Use savepoint to isolate each row's changes
            try:
                async with session.begin_nested():
                    # Check employee exists
                    employee = await self._repo.get_by_employee_id(session, employee_id)
                    if not employee:
                        not_found += 1
                        errors.append(f"Row {row_num}: Employee {employee_id} not found")
                        continue
                    
                    any_updated = False
                    
                    # Update employee layer
                    if update_layer in ("employee", "all"):
                        employee_data = {}
                        for field in employee_fields:
                            csv_key = field
                            value = row.get(csv_key, "").strip() if row.get(csv_key) else None
                            if value:
                                if 'date' in field or field.endswith('_date'):
                                    parsed = self._parse_date_flexible(value)
                                    if parsed:
                                        employee_data[field] = parsed
                                elif field in ('basic_salary', 'housing_allowance', 'transportation_allowance',
                                              'air_ticket_entitlement', 'other_allowance', 'net_salary'):
                                    parsed = self._parse_decimal(value)
                                    if parsed:
                                        employee_data[field] = parsed
                                else:
                                    employee_data[field] = value
                        
                        if employee_data:
                            for field, value in employee_data.items():
                                setattr(employee, field, value)
                            any_updated = True
                    
                    # Update compliance layer
                    if update_layer in ("compliance", "all"):
                        compliance_data = {}
                        for field in compliance_fields:
                            value = row.get(field, "").strip() if row.get(field) else None
                            if value:
                                if 'date' in field or field.endswith('_date') or 'expiry' in field:
                                    parsed = self._parse_date_flexible(value)
                                    if parsed:
                                        compliance_data[field] = parsed
                                else:
                                    compliance_data[field] = value
                        
                        if compliance_data:
                            result = await session.execute(
                                select(EmployeeCompliance).where(
                                    EmployeeCompliance.employee_id == employee.id
                                )
                            )
                            compliance = result.scalar_one_or_none()
                            
                            if not compliance:
                                compliance = EmployeeCompliance(employee_id=employee.id)
                                session.add(compliance)
                            
                            for field, value in compliance_data.items():
                                setattr(compliance, field, value)
                            any_updated = True
                    
                    # Update bank layer
                    if update_layer in ("bank", "all"):
                        bank_data = {}
                        for field in bank_fields:
                            value = row.get(field, "").strip() if row.get(field) else None
                            if value:
                                bank_data[field] = value
                        
                        if bank_data:
                            result = await session.execute(
                                select(EmployeeBank).where(
                                    EmployeeBank.employee_id == employee.id
                                )
                            )
                            bank = result.scalar_one_or_none()
                            
                            if not bank:
                                bank = EmployeeBank(employee_id=employee.id)
                                session.add(bank)
                            
                            for field, value in bank_data.items():
                                setattr(bank, field, value)
                            any_updated = True
                    
                    if any_updated:
                        updated += 1
                    else:
                        skipped += 1
                        
            except Exception as e:
                errors.append(f"Row {row_num}: {str(e)}")
        
        await session.commit()
        
        return {
            "updated": updated,
            "not_found": not_found,
            "skipped": skipped,
            "errors": errors[:20],  # Limit errors returned
            "layer": update_layer,
        }


employee_service = EmployeeService(EmployeeRepository())
