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
        # Legacy format - simple sha256 (for migration)
        return hashlib.sha256(password.encode()).hexdigest() == hashed


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
        import warnings
        warnings.warn("Using default auth secret key. Set AUTH_SECRET_KEY in production!")
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
        
        # Update last login
        await self._repo.update_last_login(session, employee.employee_id)
        await session.commit()
        
        # Create token
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
        # Check if employee already exists
        if await self._repo.exists(session, data.employee_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Employee ID {data.employee_id} already exists",
            )
        
        # Create password from DOB
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
        """Import employees from CSV file."""
        content = await file.read()
        text = content.decode("utf-8")
        reader = csv.DictReader(StringIO(text))

        created = 0
        skipped = 0
        errors = []
        allowed_roles = {"admin", "hr", "viewer"}

        for row_num, row in enumerate(reader, start=2):
            try:
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
        }

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


# Singleton instance
employee_service = EmployeeService(EmployeeRepository())
