from typing import List

from fastapi import APIRouter, Depends, File, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import require_role
from app.database import get_session
from app.schemas.employee import (
    EmployeeCreate,
    EmployeeResponse,
    PasswordResetRequest,
)
from app.services.employees import employee_service

router = APIRouter(prefix="/employees", tags=["employees"])


@router.get(
    "",
    response_model=List[EmployeeResponse],
    summary="List all employees",
)
async def list_employees(
    active_only: bool = True,
    role: str = Depends(require_role(["admin", "hr"])),
    session: AsyncSession = Depends(get_session),
):
    """List all employees. Only admin and HR can access."""
    return await employee_service.list_employees(session, active_only)


@router.post(
    "",
    response_model=EmployeeResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new employee",
)
async def create_employee(
    data: EmployeeCreate,
    role: str = Depends(require_role(["admin", "hr"])),
    session: AsyncSession = Depends(get_session),
):
    """
    Create a new employee.
    
    The employee's initial password will be their DOB in DDMMYYYY format.
    They must change it on first login.
    """
    return await employee_service.create_employee(session, data)


@router.post(
    "/import",
    summary="Import employees from CSV",
)
async def import_employees_csv(
    file: UploadFile = File(..., description="CSV file with employee data"),
    role: str = Depends(require_role(["admin", "hr"])),
    session: AsyncSession = Depends(get_session),
):
    """
    Import employees from a CSV file.
    
    CSV format (with headers):
    ```
    employee_id,name,email,department,date_of_birth,role
    EMP001,John Smith,john@company.com,IT,15061990,viewer
    EMP002,Jane Doe,jane@company.com,HR,22031985,hr
    ```
    
    - `date_of_birth`: DDMMYYYY format
    - `role`: admin, hr, or viewer (default: viewer)
    - Existing employees are skipped
    """
    return await employee_service.import_from_csv(session, file)


@router.post(
    "/reset-password",
    status_code=status.HTTP_200_OK,
    summary="Reset employee password to DOB",
)
async def reset_password(
    request: PasswordResetRequest,
    role: str = Depends(require_role(["admin"])),
    session: AsyncSession = Depends(get_session),
):
    """
    Reset an employee's password back to their DOB.
    
    Only admins can perform this action.
    The employee will need to set a new password on next login.
    """
    success = await employee_service.reset_password(session, request.employee_id)
    return {"success": success, "message": "Password reset to DOB"}


@router.delete(
    "/{employee_id}",
    status_code=status.HTTP_200_OK,
    summary="Deactivate an employee",
)
async def deactivate_employee(
    employee_id: str,
    role: str = Depends(require_role(["admin"])),
    session: AsyncSession = Depends(get_session),
):
    """
    Deactivate an employee account.
    
    The employee will no longer be able to log in.
    Only admins can perform this action.
    """
    success = await employee_service.deactivate_employee(session, employee_id)
    return {"success": success, "message": "Employee deactivated"}
