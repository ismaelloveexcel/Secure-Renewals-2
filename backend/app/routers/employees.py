from typing import List

from fastapi import APIRouter, Depends, File, UploadFile, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import require_role
from app.database import get_session
from app.schemas.employee import (
    EmployeeCreate,
    EmployeeResponse,
    EmployeeDetailResponse,
    EmployeeUpdate,
    PasswordResetRequest,
    ComplianceAlertsResponse,
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
    
    **Supports two formats:**
    
    **1. Baynunah Employee Database format** (auto-detected):
    Columns: Employee No, Employee Name, Job Title, Department, DOB, etc.
    This format includes all employee fields like salary, line manager, probation dates.
    
    **2. Simple format** (with headers):
    ```
    employee_id,name,email,department,date_of_birth,role
    EMP001,John Smith,john@company.com,IT,15061990,viewer
    EMP002,Jane Doe,jane@company.com,HR,22031985,hr
    ```
    
    - `date_of_birth`: DDMMYYYY format or "March 11, 1979" format
    - `role`: admin, hr, or viewer (default: viewer)
    - Existing employees are skipped
    - Returns: created, skipped, errors counts
    """
    return await employee_service.import_from_csv(session, file)


@router.get(
    "/compliance/alerts",
    summary="Get compliance expiry alerts",
)
async def get_compliance_alerts(
    days: int = Query(default=60, ge=1, le=365, description="Days to look ahead"),
    role: str = Depends(require_role(["admin", "hr"])),
    session: AsyncSession = Depends(get_session),
):
    """
    Get employees with expiring compliance documents.
    
    Returns alerts grouped by urgency:
    - **expired**: Already expired documents
    - **days_7**: Expiring within 7 days
    - **days_30**: Expiring within 30 days  
    - **days_60**: Expiring within specified days (default 60)
    
    Checks: Visa, Emirates ID, Medical Fitness, ILOE, Contract
    """
    return await employee_service.get_compliance_alerts(session, days)


@router.get(
    "/{employee_id}",
    response_model=EmployeeDetailResponse,
    summary="Get employee by ID",
)
async def get_employee(
    employee_id: str,
    role: str = Depends(require_role(["admin", "hr", "viewer"])),
    session: AsyncSession = Depends(get_session),
):
    """
    Get a specific employee by their employee ID.
    
    Returns full employee details including UAE compliance fields.
    """
    return await employee_service.get_employee(session, employee_id)


@router.put(
    "/{employee_id}",
    response_model=EmployeeDetailResponse,
    summary="Update employee",
)
async def update_employee(
    employee_id: str,
    data: EmployeeUpdate,
    role: str = Depends(require_role(["admin", "hr"])),
    session: AsyncSession = Depends(get_session),
):
    """
    Update an employee's information.
    
    Only HR and Admin can update employee data.
    All fields are optional - only provided fields will be updated.
    
    **UAE Compliance fields:**
    - visa_number, visa_issue_date, visa_expiry_date
    - emirates_id_number, emirates_id_expiry
    - medical_fitness_date, medical_fitness_expiry
    - iloe_status, iloe_expiry
    - contract_type, contract_start_date, contract_end_date
    """
    return await employee_service.update_employee(session, employee_id, data)


@router.post(
    "/bulk-update",
    summary="Bulk update employees from CSV",
)
async def bulk_update_employees_csv(
    file: UploadFile = File(..., description="CSV file with employee data"),
    update_layer: str = Query(
        default="employee",
        description="Which layer to update: employee, compliance, bank, or all"
    ),
    role: str = Depends(require_role(["admin", "hr"])),
    session: AsyncSession = Depends(get_session),
):
    """
    Bulk update existing employees from a CSV file.
    
    **Matches by Employee ID and updates existing records.**
    
    **Layer options:**
    - `employee`: Updates core employee fields (name, job_title, department, etc.)
    - `compliance`: Updates UAE compliance fields (visa, emirates_id, medical, etc.)
    - `bank`: Updates bank account details
    - `all`: Updates all layers based on CSV columns
    
    **CSV format:**
    - First column must be `employee_id` or `Employee No`
    - Include any fields you want to update
    - Empty cells are skipped (won't overwrite existing data)
    
    **Example compliance columns:**
    visa_number, visa_issue_date, visa_expiry_date, emirates_id_number, emirates_id_expiry,
    medical_fitness_date, medical_fitness_expiry, iloe_status, iloe_expiry
    
    **Example bank columns:**
    bank_name, account_name, account_number, iban, swift_code, routing_number
    """
    return await employee_service.bulk_update_from_csv(session, file, update_layer)


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
