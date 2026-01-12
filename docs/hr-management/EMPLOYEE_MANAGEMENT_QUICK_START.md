# Employee Management Quick Start Guide

**For:** Secure Renewals HR Portal  
**Purpose:** Complete the employee management features in your existing app  
**Focus:** Layer 1-5 migration strategy using your current database and models  
**Created:** January 2026

---

## 📋 What You Already Have

Your app already has the foundation for employee management:

### ✅ Employee Model (`backend/app/models/employee.py`)
- **Layer 1 (Core):** `employee_id`, `name`, `job_title`, `department`, `line_manager_*`, `employment_status`, `joining_date`, `location`
- **Layer 2 (Personal):** `date_of_birth`, `gender`, `nationality`
- **Layer 3 (Compliance):** `visa_status`, `security_clearance`, `medical_insurance_*`
- **Layer 4 (Payroll):** `basic_salary`, `housing_allowance`, `transportation_allowance`, etc.

### ✅ EmployeeProfile Model (`backend/app/models/employee_profile.py`)
- Emergency contacts
- Personal phone/email
- Bank details (IBAN, account number)
- UAE ID, Passport details
- Education, uniform sizes

### ✅ Employees Router (`backend/app/routers/employees.py`)
- List employees
- Create employee
- Import from CSV
- Reset password
- Deactivate employee

---

## 🚀 What's Needed to Complete Employee Management

Based on your 5-layer migration strategy, here's what needs to be added:

### Layer 3: Missing UAE Compliance Fields

Add these fields to your Employee model:

```python
# Add to backend/app/models/employee.py

# Visa tracking (detailed)
visa_number: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
visa_issue_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
visa_expiry_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

# Emirates ID
emirates_id_number: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
emirates_id_expiry: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

# Medical Fitness
medical_fitness_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
medical_fitness_expiry: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

# ILOE (Insurance)
iloe_status: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
iloe_expiry: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

# Contract
contract_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
contract_start_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
contract_end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
```

### New Endpoints Needed

```python
# Add to backend/app/routers/employees.py

@router.get("/{employee_id}")
async def get_employee(employee_id: str, ...):
    """Get single employee by ID"""

@router.put("/{employee_id}")
async def update_employee(employee_id: str, data: EmployeeUpdate, ...):
    """Update employee - HR only"""

@router.get("/{employee_id}/profile")
async def get_employee_profile(employee_id: str, ...):
    """Get employee self-service profile"""

@router.put("/{employee_id}/profile")
async def update_employee_profile(employee_id: str, data: ProfileUpdate, ...):
    """Employee updates their own profile"""

@router.get("/compliance/alerts")
async def get_compliance_alerts(days: int = 60, ...):
    """Get expiring documents (Visa, EID, ILOE, Contract)"""
```

---

## 📝 Step-by-Step Implementation

### Step 1: Add Missing Compliance Fields

Create a new Alembic migration:

```bash
cd backend
uv run alembic revision -m "add_uae_compliance_fields"
```

Migration file content:
```python
"""add_uae_compliance_fields

Revision ID: xxxx
"""
from alembic import op
import sqlalchemy as sa

def upgrade():
    # Visa tracking
    op.add_column('employees', sa.Column('visa_number', sa.String(50), nullable=True))
    op.add_column('employees', sa.Column('visa_issue_date', sa.Date(), nullable=True))
    op.add_column('employees', sa.Column('visa_expiry_date', sa.Date(), nullable=True))
    
    # Emirates ID
    op.add_column('employees', sa.Column('emirates_id_number', sa.String(20), nullable=True))
    op.add_column('employees', sa.Column('emirates_id_expiry', sa.Date(), nullable=True))
    
    # Medical Fitness
    op.add_column('employees', sa.Column('medical_fitness_date', sa.Date(), nullable=True))
    op.add_column('employees', sa.Column('medical_fitness_expiry', sa.Date(), nullable=True))
    
    # ILOE
    op.add_column('employees', sa.Column('iloe_status', sa.String(50), nullable=True))
    op.add_column('employees', sa.Column('iloe_expiry', sa.Date(), nullable=True))
    
    # Contract
    op.add_column('employees', sa.Column('contract_type', sa.String(50), nullable=True))
    op.add_column('employees', sa.Column('contract_start_date', sa.Date(), nullable=True))
    op.add_column('employees', sa.Column('contract_end_date', sa.Date(), nullable=True))

def downgrade():
    op.drop_column('employees', 'contract_end_date')
    op.drop_column('employees', 'contract_start_date')
    op.drop_column('employees', 'contract_type')
    op.drop_column('employees', 'iloe_expiry')
    op.drop_column('employees', 'iloe_status')
    op.drop_column('employees', 'medical_fitness_expiry')
    op.drop_column('employees', 'medical_fitness_date')
    op.drop_column('employees', 'emirates_id_expiry')
    op.drop_column('employees', 'emirates_id_number')
    op.drop_column('employees', 'visa_expiry_date')
    op.drop_column('employees', 'visa_issue_date')
    op.drop_column('employees', 'visa_number')
```

Run migration:
```bash
uv run alembic upgrade head
```

### Step 2: Update Employee Model

Add the new fields to `backend/app/models/employee.py`:

```python
# After visa_status field, add:

# Visa tracking (detailed)
visa_number: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
visa_issue_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
visa_expiry_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

# Emirates ID
emirates_id_number: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
emirates_id_expiry: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

# Medical Fitness
medical_fitness_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
medical_fitness_expiry: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

# ILOE (Insurance)
iloe_status: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
iloe_expiry: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

# Contract
contract_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
contract_start_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
contract_end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
```

### Step 3: Add Update Employee Endpoint

Add to `backend/app/routers/employees.py`:

```python
# Add this import at the top of the file
from app.schemas.employee import EmployeeUpdate  # Note: Define EmployeeUpdate schema first (Step 6)

@router.get(
    "/{employee_id}",
    response_model=EmployeeResponse,
    summary="Get employee by ID",
)
async def get_employee(
    employee_id: str,
    role: str = Depends(require_role(["admin", "hr", "viewer"])),
    session: AsyncSession = Depends(get_session),
):
    """Get a specific employee by their employee ID."""
    return await employee_service.get_employee(session, employee_id)


@router.put(
    "/{employee_id}",
    response_model=EmployeeResponse,
    summary="Update employee",
)
async def update_employee(
    employee_id: str,
    data: EmployeeUpdate,
    role: str = Depends(require_role(["admin", "hr"])),
    session: AsyncSession = Depends(get_session),
):
    """Update an employee's information. HR and Admin only."""
    return await employee_service.update_employee(session, employee_id, data)
```

### Step 4: Add Compliance Alerts Endpoint

```python
@router.get(
    "/compliance/alerts",
    summary="Get compliance expiry alerts",
)
async def get_compliance_alerts(
    days: int = 60,
    role: str = Depends(require_role(["admin", "hr"])),
    session: AsyncSession = Depends(get_session),
):
    """
    Get employees with expiring documents.
    
    Returns alerts for:
    - Visa expiry
    - Emirates ID expiry
    - Medical Fitness expiry
    - ILOE expiry
    - Contract end date
    
    Grouped by: expired, 7_days, 30_days, 60_days
    """
    return await employee_service.get_compliance_alerts(session, days)
```

### Step 5: Add Service Methods

Add to `backend/app/services/employees.py`:

```python
# Required imports (add at top of file if not already present)
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException
from app.models.employee import Employee
from app.schemas.employee import EmployeeUpdate

# Add these methods to your EmployeeService class:

async def get_employee(self, session: AsyncSession, employee_id: str) -> Employee:
    """Get single employee by employee_id"""
    result = await session.execute(
        select(Employee).where(Employee.employee_id == employee_id)
    )
    employee = result.scalar_one_or_none()
    if not employee:
        raise HTTPException(404, f"Employee {employee_id} not found")
    return employee


async def update_employee(
    self, session: AsyncSession, employee_id: str, data: EmployeeUpdate
) -> Employee:
    """Update employee data"""
    employee = await self.get_employee(session, employee_id)
    
    # Update only provided fields
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(employee, field, value)
    
    await session.commit()
    await session.refresh(employee)
    return employee


async def get_compliance_alerts(
    self, session: AsyncSession, days: int = 60
) -> dict:
    """Get employees with expiring compliance documents"""
    from datetime import date, timedelta
    
    today = date.today()
    
    # Date thresholds
    day_7 = today + timedelta(days=7)
    day_30 = today + timedelta(days=30)
    day_60 = today + timedelta(days=days)
    
    result = await session.execute(
        select(Employee).where(Employee.is_active == True)
    )
    employees = result.scalars().all()
    
    alerts = {
        'expired': [],
        '7_days': [],
        '30_days': [],
        '60_days': []
    }
    
    compliance_fields = [
        ('visa_expiry_date', 'Visa'),
        ('emirates_id_expiry', 'Emirates ID'),
        ('medical_fitness_expiry', 'Medical Fitness'),
        ('iloe_expiry', 'ILOE'),
        ('contract_end_date', 'Contract')
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
                    alerts['7_days'].append(alert)
                elif days_until <= 30:
                    alerts['30_days'].append(alert)
                elif days_until <= days:
                    alerts['60_days'].append(alert)
    
    return alerts
```

### Step 6: Update Employee Schema

Add to `backend/app/schemas/employee.py`:

```python
class EmployeeUpdate(BaseModel):
    """Schema for updating employee - all fields optional"""
    
    # Core fields (Layer 1)
    name: Optional[str] = None
    email: Optional[str] = None
    department: Optional[str] = None
    job_title: Optional[str] = None
    function: Optional[str] = None
    location: Optional[str] = None
    work_schedule: Optional[str] = None
    line_manager_name: Optional[str] = None
    line_manager_email: Optional[str] = None
    employment_status: Optional[str] = None
    
    # Personal (Layer 2)
    gender: Optional[str] = None
    nationality: Optional[str] = None
    company_phone: Optional[str] = None
    
    # Compliance - UAE (Layer 3)
    visa_status: Optional[str] = None
    visa_number: Optional[str] = None
    visa_issue_date: Optional[date] = None
    visa_expiry_date: Optional[date] = None
    emirates_id_number: Optional[str] = None
    emirates_id_expiry: Optional[date] = None
    medical_fitness_date: Optional[date] = None
    medical_fitness_expiry: Optional[date] = None
    iloe_status: Optional[str] = None
    iloe_expiry: Optional[date] = None
    security_clearance: Optional[str] = None
    contract_type: Optional[str] = None
    contract_start_date: Optional[date] = None
    contract_end_date: Optional[date] = None
    
    # Medical Insurance
    medical_insurance_provider: Optional[str] = None
    medical_insurance_category: Optional[str] = None
    
    # Probation
    probation_status: Optional[str] = None
    probation_end_date: Optional[date] = None
    
    # Leave
    annual_leave_entitlement: Optional[int] = None
    overtime_type: Optional[str] = None
```

---

## 🔄 Migrating Your Existing CSV Data

Your CSV already has most of the data. Update the import function to handle all fields:

```python
# Enhanced CSV column mapping
CSV_COLUMN_MAP = {
    'Employee No': 'employee_id',
    'Employee Name': 'name',
    'Job Title': 'job_title',
    'Function': 'function',
    'Department': 'department',
    'Location': 'location',
    'Work Schedule': 'work_schedule',
    'Line Manager': 'line_manager_name',
    "Line Manager's Email": 'line_manager_email',
    'Joining Date': 'joining_date',
    'Employment Status': 'employment_status',
    'DOB': 'date_of_birth',
    'Gender': 'gender',
    'Nationality': 'nationality',
    'Company Email Address': 'email',
    'Company Phone Number': 'company_phone',
    'Probation Status': 'probation_status',
    'Visa Status': 'visa_status',
    'Security Clearance': 'security_clearance',
    'Medical Insurance Provider': 'medical_insurance_provider',
    'Medical Insurance Category': 'medical_insurance_category',
    'Annual Leave Entitlement': 'annual_leave_entitlement',
    'Overtime Type': 'overtime_type',
    'Basic Salary': 'basic_salary',
    'Housing': 'housing_allowance',
    'Transportation': 'transportation_allowance',
    'Air Ticket Entitlement': 'air_ticket_entitlement',
    'Other Allowance': 'other_allowance',
    'Net Salary': 'net_salary',
}
```

---

## 📊 Profile Completion Tracking

Add a helper to calculate profile completion:

```python
# Add to backend/app/services/employees.py or a new utils file
from app.models.employee import Employee

def calculate_profile_completion(employee: Employee) -> dict:
    """Calculate profile completion percentage"""
    
    required_fields = {
        'layer_1': ['employee_id', 'name', 'department', 'job_title', 'joining_date', 'employment_status'],
        'layer_2': ['date_of_birth', 'gender', 'nationality'],
        'layer_3': ['visa_status', 'visa_expiry_date', 'emirates_id_number', 'emirates_id_expiry'],
        'layer_4': ['bank_iban'],  # From profile
    }
    
    completion = {}
    
    for layer, fields in required_fields.items():
        filled = sum(1 for f in fields if getattr(employee, f, None) or 
                     (employee.profile and getattr(employee.profile, f, None)))
        completion[layer] = {
            'filled': filled,
            'total': len(fields),
            'percentage': round(filled / len(fields) * 100)
        }
    
    overall = sum(c['filled'] for c in completion.values())
    total = sum(c['total'] for c in completion.values())
    completion['overall'] = {
        'filled': overall,
        'total': total,
        'percentage': round(overall / total * 100)
    }
    
    return completion
```

---

## 🎯 Summary: What to Do Now

1. **Run the migration** to add UAE compliance fields
2. **Update the Employee model** with new fields
3. **Add the update endpoint** so HR can edit employees
4. **Add compliance alerts endpoint** for 60/30/7 day warnings
5. **Import your CSV** using the existing import endpoint

That's it! You don't need Frappe HRMS or any external system. Your app already has the foundation - just add the missing pieces.

---

## Related Documents

- [HR Implementation Plan](HR_IMPLEMENTATION_PLAN.md) - Overall HR operations structure
- [Employee Migration Apps Guide](EMPLOYEE_MIGRATION_APPS_GUIDE.md) - If you want to integrate external systems later

---

**Last Updated:** January 2026
