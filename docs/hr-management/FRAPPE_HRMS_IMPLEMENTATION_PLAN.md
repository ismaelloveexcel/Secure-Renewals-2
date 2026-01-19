# Frappe HRMS Integration Plan

**For:** Secure Renewals HR Portal  
**Decision:** Integrate Frappe HRMS for Employee Management  
**Created:** January 2026  
**Status:** Implementation Ready

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Integration Approach Options](#integration-approach-options)
3. [Recommended Approach: API Bridge](#recommended-approach-api-bridge)
4. [Phase 1: Setup & Deployment](#phase-1-setup--deployment)
5. [Phase 2: Data Migration](#phase-2-data-migration)
6. [Phase 3: Integration Development](#phase-3-integration-development)
7. [Phase 4: Employee Self-Service](#phase-4-employee-self-service)
8. [Phase 5: UAE Compliance Setup](#phase-5-uae-compliance-setup)
9. [Phase 6: Testing & Go-Live](#phase-6-testing--go-live)
10. [Technical Architecture](#technical-architecture)
11. [API Integration Examples](#api-integration-examples)
12. [Timeline & Milestones](#timeline--milestones)

---

## Executive Summary

**Frappe HRMS** will serve as the **Employee Management System** while your existing **Secure Renewals Portal** continues to handle contract renewals and onboarding workflows. The two systems will be connected via API integration.

### Why Frappe HRMS?

| Feature | Benefit for Your Migration |
|---------|---------------------------|
| **Employee Self-Service Portal** | Employees can upload missing documents and fill personal info |
| **Immutable Employee ID** | Non-editable after creation - matches your requirement |
| **Document Management** | Upload, track expiry, attach to employee records |
| **UAE Compliance Fields** | Customizable for Visa, EID, ILOE, Medical Fitness |
| **Layered Data Model** | Separate DocTypes for Employee, Salary, Attendance |
| **REST API** | Full API access for integration with your FastAPI backend |
| **Open Source** | Free, self-hosted, no licensing costs |

---

## Integration Approach Options

### Option A: Full Replacement ❌
Replace Secure Renewals Portal entirely with Frappe HRMS

**Pros:** Single system, no integration complexity  
**Cons:** Lose existing renewal workflows, significant rework  
**Recommendation:** Not recommended - your portal has working features

### Option B: API Bridge ✅ (RECOMMENDED)
Frappe HRMS handles employee data, your portal handles renewals

**Pros:** Best of both worlds, minimal disruption  
**Cons:** Some integration development needed  
**Recommendation:** Best approach for your situation

### Option C: Database Sync
Share database between both systems

**Pros:** Real-time data  
**Cons:** Tight coupling, risky  
**Recommendation:** Not recommended

---

## Recommended Approach: API Bridge

```
┌─────────────────────────────────────────────────────────────────────┐
│                    YOUR HR ECOSYSTEM                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌─────────────────────┐         ┌─────────────────────┐          │
│   │   FRAPPE HRMS       │◄───────►│  SECURE RENEWALS    │          │
│   │   (Employee Data)   │   API   │  (Contract/Renewal) │          │
│   └─────────────────────┘         └─────────────────────┘          │
│           │                                │                        │
│           │                                │                        │
│   ┌───────▼───────┐               ┌───────▼───────┐                │
│   │ Employee      │               │ Renewal       │                │
│   │ Self-Service  │               │ Dashboard     │                │
│   │ Portal        │               │               │                │
│   └───────────────┘               └───────────────┘                │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────┐      │
│   │              SHARED POSTGRESQL DATABASE                  │      │
│   │  (Frappe schema + Secure Renewals schema)               │      │
│   └─────────────────────────────────────────────────────────┘      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Setup & Deployment

### Week 1: Frappe HRMS Installation

#### Step 1.1: Install Frappe HRMS (Docker - Recommended)

```bash
# Clone Frappe Docker
git clone https://github.com/frappe/frappe_docker.git
cd frappe_docker

# Create environment file
cp example.env .env

# Edit .env with your settings
cat > .env << 'EOF'
FRAPPE_VERSION=v15
ERPNEXT_VERSION=v15
FRAPPE_SITE_NAME=hrms.yourdomain.com
POSTGRES_HOST=your-postgres-host
POSTGRES_PORT=5432
DB_PASSWORD=your-secure-db-password-here  # CHANGE THIS - use a strong password
ADMIN_PASSWORD=your-secure-admin-password-here  # CHANGE THIS - use a strong password
EOF

# Start containers
docker-compose -f compose.yaml up -d

# Create HRMS site (replace with your actual secure password)
docker-compose exec backend bench new-site hrms.yourdomain.com \
  --admin-password "YOUR_SECURE_ADMIN_PASSWORD" \
  --db-name frappe_hrms

# Install HRMS app
docker-compose exec backend bench get-app hrms
docker-compose exec backend bench --site hrms.yourdomain.com install-app hrms
```

#### Step 1.2: Configure Frappe for Your Organization

```bash
# Access Frappe shell
docker-compose exec backend bench --site hrms.yourdomain.com console

# In the console, set up company
frappe.get_doc({
    "doctype": "Company",
    "company_name": "Baynunah",
    "abbr": "BAYN",
    "default_currency": "AED",
    "country": "United Arab Emirates"
}).insert()
```

#### Step 1.3: Create Custom Fields for UAE Compliance

In Frappe, go to **Customize Form** > **Employee** and add:

| Field Name | Field Type | Label |
|------------|------------|-------|
| `visa_number` | Data | Visa Number |
| `visa_issue_date` | Date | Visa Issue Date |
| `visa_expiry_date` | Date | Visa Expiry Date |
| `emirates_id` | Data | Emirates ID Number |
| `emirates_id_expiry` | Date | Emirates ID Expiry |
| `medical_fitness_date` | Date | Medical Fitness Date |
| `medical_fitness_expiry` | Date | Medical Fitness Expiry |
| `iloe_status` | Select | ILOE Status |
| `iloe_expiry` | Date | ILOE Expiry |
| `security_clearance` | Select | Security Clearance |

---

## Phase 2: Data Migration

### Week 2: Migrate Employee Data

#### Step 2.1: Export Your Current Data

```python
# Python script to export from your current CSV
import pandas as pd

# Read your employee database
df = pd.read_csv('Employees-Employee Database- Github.csv')

# Map to Frappe fields (Layer 1 - Core)
frappe_mapping = {
    'Employee No': 'employee',  # This becomes the immutable ID
    'Employee Name': 'employee_name',
    'Job Title': 'designation',
    'Department': 'department',
    'Line Manager': 'reports_to',
    'Joining Date': 'date_of_joining',
    'Location': 'branch',
    'Employment Status': 'status',
    'Gender': 'gender',
    'DOB': 'date_of_birth',
    'Nationality': 'nationality',
    'Company Email Address': 'company_email',
}

# Create Frappe-compatible export
frappe_df = df.rename(columns=frappe_mapping)
frappe_df.to_csv('frappe_import.csv', index=False)
```

#### Step 2.2: Import via Frappe Data Import

1. Go to **Frappe HRMS** > **Data Import**
2. Select DocType: **Employee**
3. Upload `frappe_import.csv`
4. Map columns to fields
5. Run import in **Test Mode** first
6. Review errors and fix data
7. Run final import

#### Step 2.3: Validate Import

```python
# Frappe console validation
import frappe

# Count imported employees
employees = frappe.get_all('Employee', filters={'status': 'Active'})
print(f"Imported {len(employees)} active employees")

# Check for duplicates
all_emp = frappe.get_all('Employee', fields=['name', 'employee_name'])
names = [e.name for e in all_emp]
if len(names) != len(set(names)):
    print("WARNING: Duplicate employee IDs found!")
else:
    print("✓ No duplicates found")
```

---

## Phase 3: Integration Development

### Week 3: Build API Bridge

#### Step 3.1: Create Integration Service in Your FastAPI App

Create a new file: `backend/app/services/frappe_integration.py`

```python
"""Frappe HRMS Integration Service"""
import os
from typing import Optional, List, Dict, Any
from datetime import date
import httpx
from fastapi import HTTPException

# Securely load from environment
FRAPPE_URL = os.getenv('FRAPPE_HRMS_URL', 'https://hrms.yourdomain.com')
FRAPPE_API_KEY = os.getenv('FRAPPE_API_KEY')
FRAPPE_API_SECRET = os.getenv('FRAPPE_API_SECRET')

if not FRAPPE_API_KEY or not FRAPPE_API_SECRET:
    raise ValueError("FRAPPE_API_KEY and FRAPPE_API_SECRET must be set")


class FrappeHRMSClient:
    """Client for Frappe HRMS API integration"""
    
    def __init__(self):
        self.base_url = FRAPPE_URL
        self.headers = {
            'Authorization': f'token {FRAPPE_API_KEY}:{FRAPPE_API_SECRET}',
            'Content-Type': 'application/json'
        }
    
    async def _request(self, method: str, endpoint: str, **kwargs) -> Dict[Any, Any]:
        """Make authenticated request to Frappe API"""
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.request(
                method,
                f'{self.base_url}{endpoint}',
                headers=self.headers,
                **kwargs
            )
            
            if response.status_code == 401:
                raise HTTPException(401, "Frappe authentication failed")
            elif response.status_code == 404:
                raise HTTPException(404, "Resource not found in Frappe")
            elif response.status_code >= 400:
                raise HTTPException(response.status_code, f"Frappe API error: {response.text}")
            
            return response.json()
    
    # ============== EMPLOYEE OPERATIONS ==============
    
    async def get_employee(self, employee_id: str) -> Dict[Any, Any]:
        """Get employee by ID from Frappe HRMS"""
        return await self._request(
            'GET',
            f'/api/resource/Employee/{employee_id}'
        )
    
    async def get_all_employees(self, filters: Dict = None, fields: List[str] = None) -> List[Dict]:
        """Get all employees with optional filters"""
        params = {
            'limit_page_length': 0  # Get all
        }
        
        if filters:
            params['filters'] = str(filters)
        
        if fields:
            params['fields'] = str(fields)
        
        result = await self._request('GET', '/api/resource/Employee', params=params)
        return result.get('data', [])
    
    async def create_employee(self, employee_data: Dict) -> Dict:
        """Create new employee in Frappe HRMS"""
        return await self._request(
            'POST',
            '/api/resource/Employee',
            json={'data': employee_data}
        )
    
    async def update_employee(self, employee_id: str, data: Dict) -> Dict:
        """Update employee in Frappe HRMS"""
        return await self._request(
            'PUT',
            f'/api/resource/Employee/{employee_id}',
            json={'data': data}
        )
    
    # ============== DOCUMENT OPERATIONS ==============
    
    async def get_employee_documents(self, employee_id: str) -> List[Dict]:
        """Get all documents attached to an employee"""
        # Validate employee_id to prevent filter injection
        if not employee_id or not employee_id.isalnum() and '-' not in employee_id:
            raise ValueError("Invalid employee ID format")
        
        # Use safe filter construction
        filters = [
            ["attached_to_doctype", "=", "Employee"],
            ["attached_to_name", "=", employee_id]
        ]
        
        result = await self._request(
            'GET',
            '/api/resource/File',
            params={
                'filters': str(filters).replace("'", '"')
            }
        )
        return result.get('data', [])
    
    async def upload_document(self, employee_id: str, file_content: bytes, filename: str) -> Dict:
        """Upload document for employee"""
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f'{self.base_url}/api/method/upload_file',
                headers={'Authorization': self.headers['Authorization']},
                files={'file': (filename, file_content)},
                data={
                    'doctype': 'Employee',
                    'docname': employee_id,
                    'is_private': 1
                }
            )
            return response.json()
    
    # ============== UAE COMPLIANCE ==============
    
    async def get_expiring_documents(self, days: int = 30) -> List[Dict]:
        """Get employees with documents expiring within specified days
        
        Args:
            days: Number of days to look ahead (1-365, default 30)
        """
        from datetime import datetime, timedelta
        
        # Validate days parameter to prevent abuse
        if days < 1 or days > 365:
            raise ValueError("Days must be between 1 and 365")
        
        expiry_date = (datetime.now() + timedelta(days=days)).strftime('%Y-%m-%d')
        today = datetime.now().strftime('%Y-%m-%d')
        
        # Build filters using structured approach (dates are controlled internally)
        visa_filters = [
            ["visa_expiry_date", ">=", today],
            ["visa_expiry_date", "<=", expiry_date]
        ]
        eid_filters = [
            ["emirates_id_expiry", ">=", today],
            ["emirates_id_expiry", "<=", expiry_date]
        ]
        
        # Check visa expiry
        visa_expiring = await self._request(
            'GET',
            '/api/resource/Employee',
            params={
                'filters': str(visa_filters).replace("'", '"'),
                'fields': '["name","employee_name","visa_expiry_date"]'
            }
        )
        
        # Check EID expiry
        eid_expiring = await self._request(
            'GET',
            '/api/resource/Employee',
            params={
                'filters': str(eid_filters).replace("'", '"'),
                'fields': '["name","employee_name","emirates_id_expiry"]'
            }
        )
        
        return {
            'visa_expiring': visa_expiring.get('data', []),
            'eid_expiring': eid_expiring.get('data', [])
        }
    
    # ============== SYNC OPERATIONS ==============
    
    async def sync_employee_to_local(self, employee_id: str, local_service) -> Dict:
        """Sync employee from Frappe to local database"""
        frappe_emp = await self.get_employee(employee_id)
        data = frappe_emp.get('data', {})
        
        # Map Frappe fields to your local model
        local_data = {
            'employee_id': data.get('name'),
            'name': data.get('employee_name'),
            'email': data.get('company_email'),
            'department': data.get('department'),
            'job_title': data.get('designation'),
            'joining_date': data.get('date_of_joining'),
            'employment_status': data.get('status'),
            'nationality': data.get('nationality'),
            'gender': data.get('gender'),
            # UAE compliance fields
            'visa_status': data.get('visa_status'),
            'visa_expiry': data.get('visa_expiry_date'),
            'emirates_id': data.get('emirates_id'),
            'emirates_id_expiry': data.get('emirates_id_expiry'),
        }
        
        # Update local database
        return await local_service.upsert_employee(local_data)


# Singleton instance
frappe_client = FrappeHRMSClient()
```

#### Step 3.2: Create API Router for Frappe Integration

Create: `backend/app/routers/frappe_sync.py`

```python
"""API routes for Frappe HRMS integration"""
from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict

from app.auth.dependencies import get_current_user, require_hr_role
from app.services.frappe_integration import frappe_client
from app.services.employee_service import employee_service

router = APIRouter(prefix="/api/frappe", tags=["Frappe HRMS"])


@router.get("/employees")
async def list_frappe_employees(current_user = Depends(require_hr_role)):
    """Get all employees from Frappe HRMS"""
    return await frappe_client.get_all_employees()


@router.get("/employees/{employee_id}")
async def get_frappe_employee(
    employee_id: str,
    current_user = Depends(get_current_user)
):
    """Get specific employee from Frappe HRMS
    
    Authorization: Employees can only access their own data.
    HR users can access any employee data.
    """
    # Authorization check - employees can only view their own data
    if current_user.role not in ['admin', 'hr'] and current_user.employee_id != employee_id:
        raise HTTPException(403, "You can only access your own employee data")
    
    return await frappe_client.get_employee(employee_id)


@router.post("/sync/employee/{employee_id}")
async def sync_employee(
    employee_id: str,
    current_user = Depends(require_hr_role)
):
    """Sync single employee from Frappe to local database"""
    result = await frappe_client.sync_employee_to_local(employee_id, employee_service)
    return {"status": "synced", "employee": result}


@router.post("/sync/all")
async def sync_all_employees(current_user = Depends(require_hr_role)):
    """Sync all employees from Frappe to local database"""
    import logging
    logger = logging.getLogger(__name__)
    
    employees = await frappe_client.get_all_employees()
    
    synced = 0
    errors = []
    
    for emp in employees:
        try:
            await frappe_client.sync_employee_to_local(emp['name'], employee_service)
            synced += 1
        except Exception as e:
            # Log detailed error server-side, return sanitized message to client
            logger.error(f"Sync failed for {emp['name']}: {str(e)}")
            errors.append({'employee': emp['name'], 'error': 'Sync failed - see server logs'})
    
    return {
        "status": "completed",
        "synced": synced,
        "errors": errors
    }


@router.get("/compliance/expiring")
async def get_expiring_compliance(
    days: int = 30,
    current_user = Depends(require_hr_role)
):
    """Get employees with expiring documents
    
    Args:
        days: Number of days to look ahead (1-365, default 30)
    """
    # Validate days parameter
    if days < 1 or days > 365:
        raise HTTPException(400, "Days must be between 1 and 365")
    
    return await frappe_client.get_expiring_documents(days)


@router.get("/employees/{employee_id}/documents")
async def get_employee_documents(
    employee_id: str,
    current_user = Depends(get_current_user)
):
    """Get documents for an employee
    
    Authorization: Employees can only access their own documents.
    HR users can access any employee's documents.
    """
    # Authorization check
    if current_user.role not in ['admin', 'hr'] and current_user.employee_id != employee_id:
        raise HTTPException(403, "You can only access your own documents")
    
    return await frappe_client.get_employee_documents(employee_id)
```

#### Step 3.3: Register Router in Main App

Edit `backend/app/main.py`:

```python
# Add import
from app.routers import frappe_sync

# Register router
app.include_router(frappe_sync.router)
```

---

## Phase 4: Employee Self-Service

### Week 4: Enable Employee Portal

#### Step 4.1: Enable Website User for Employees

In Frappe, employees can access their own data via the portal:

```python
# Frappe console - enable portal access for all employees
import frappe

employees = frappe.get_all('Employee', 
    filters={'status': 'Active'},
    fields=['name', 'company_email', 'employee_name']
)

for emp in employees:
    if emp.company_email:
        # Create user account
        if not frappe.db.exists('User', emp.company_email):
            user = frappe.get_doc({
                'doctype': 'User',
                'email': emp.company_email,
                'first_name': emp.employee_name.split()[0],
                'last_name': ' '.join(emp.employee_name.split()[1:]),
                'enabled': 1,
                'user_type': 'Website User',
                'roles': [{'role': 'Employee Self Service'}]
            })
            user.insert(ignore_permissions=True)
            
            # Link to employee
            frappe.db.set_value('Employee', emp.name, 'user_id', emp.company_email)

frappe.db.commit()
print(f"Created portal access for {len(employees)} employees")
```

#### Step 4.2: Configure Portal Settings

1. Go to **Website Settings** > **Portal**
2. Enable:
   - Employee Self Service
   - Leave Application
   - Expense Claims
   - Attendance Request

#### Step 4.3: Create Self-Service Workflows

Employees can now:
- ✅ View their profile
- ✅ Update personal information (with HR approval)
- ✅ Upload missing documents
- ✅ View compliance status
- ✅ Submit leave requests
- ✅ View payslips

---

## Phase 5: UAE Compliance Setup

### Week 5: Configure Compliance Alerts

#### Step 5.1: Create Notification Schedules

In Frappe, go to **Notification** and create:

**Notification 1: Visa Expiry Alert (60 days)**
```
DocType: Employee
Condition: doc.visa_expiry_date and (doc.visa_expiry_date - frappe.utils.today()).days == 60
Recipients: HR Manager Email
Subject: 🚨 Visa Expiry Alert - {employee_name}
Message: Visa for {employee_name} ({name}) expires on {visa_expiry_date}. Please initiate renewal.
```

**Notification 2: Emirates ID Expiry (30 days)**
```
DocType: Employee
Condition: doc.emirates_id_expiry and (doc.emirates_id_expiry - frappe.utils.today()).days == 30
Recipients: HR Manager Email
Subject: ⚠️ Emirates ID Expiry - {employee_name}
Message: Emirates ID for {employee_name} expires in 30 days on {emirates_id_expiry}.
```

#### Step 5.2: Create Compliance Dashboard

Add a custom page in Frappe:

```python
# Create compliance dashboard
@frappe.whitelist()
def get_compliance_dashboard():
    """Get UAE compliance status for all employees"""
    from datetime import datetime, timedelta
    
    today = datetime.now().date()
    alerts = {
        'expired': [],
        '7_days': [],
        '30_days': [],
        '60_days': []
    }
    
    employees = frappe.get_all('Employee',
        filters={'status': 'Active'},
        fields=['name', 'employee_name', 'visa_expiry_date', 
                'emirates_id_expiry', 'medical_fitness_expiry', 'iloe_expiry']
    )
    
    compliance_fields = [
        ('visa_expiry_date', 'Visa'),
        ('emirates_id_expiry', 'Emirates ID'),
        ('medical_fitness_expiry', 'Medical Fitness'),
        ('iloe_expiry', 'ILOE')
    ]
    
    for emp in employees:
        for field, label in compliance_fields:
            if emp.get(field):
                expiry = emp[field]
                days_until = (expiry - today).days
                
                alert_data = {
                    'employee_id': emp.name,
                    'employee_name': emp.employee_name,
                    'document_type': label,
                    'expiry_date': expiry,
                    'days_remaining': days_until
                }
                
                if days_until < 0:
                    alert_data['days_overdue'] = abs(days_until)
                    alerts['expired'].append(alert_data)
                elif days_until <= 7:
                    alerts['7_days'].append(alert_data)
                elif days_until <= 30:
                    alerts['30_days'].append(alert_data)
                elif days_until <= 60:
                    alerts['60_days'].append(alert_data)
    
    return alerts
```

---

## Phase 6: Testing & Go-Live

### Week 6: UAT and Launch

#### Step 6.1: Testing Checklist

| Test | Status |
|------|--------|
| Employee import validates with no duplicates | ☐ |
| API bridge syncs data correctly | ☐ |
| Employee self-service portal accessible | ☐ |
| Employees can update their own profile | ☐ |
| Employees can upload documents | ☐ |
| HR can view all employee data | ☐ |
| Compliance alerts trigger correctly | ☐ |
| Secure Renewals Portal shows Frappe data | ☐ |
| WPS bank details are validated | ☐ |

#### Step 6.2: Go-Live Steps

1. **Backup everything** - Your current database and Frappe database
2. **Final data sync** - Run full import from CSV
3. **Enable employee access** - Send login credentials
4. **Monitor** - Watch for errors in first 48 hours
5. **Support** - Be available for employee questions

---

## Technical Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────────────┐
│                         INFRASTRUCTURE                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    DOCKER COMPOSE                            │   │
│  │                                                              │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │   │
│  │  │ Frappe      │  │ Your        │  │ PostgreSQL  │         │   │
│  │  │ Backend     │  │ FastAPI     │  │ Database    │         │   │
│  │  │ (Python)    │  │ Backend     │  │             │         │   │
│  │  │ Port 8000   │  │ Port 8001   │  │ Port 5432   │         │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘         │   │
│  │         │                │                │                 │   │
│  │         └────────────────┼────────────────┘                 │   │
│  │                          │                                   │   │
│  │  ┌─────────────┐  ┌─────────────┐                          │   │
│  │  │ Frappe      │  │ React       │                          │   │
│  │  │ Portal      │  │ Frontend    │                          │   │
│  │  │ Port 80     │  │ Port 5173   │                          │   │
│  │  └─────────────┘  └─────────────┘                          │   │
│  │                                                              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
Employee fills form in Frappe Portal
            │
            ▼
    Frappe HRMS Database
            │
            ▼
   API Sync (scheduled/manual)
            │
            ▼
    Your FastAPI Backend
            │
            ▼
   Secure Renewals Portal
            │
            ▼
    Contract Renewal Workflow
```

---

## API Integration Examples

### Example 1: Fetch Employee for Renewal

```python
# In your existing renewal service
from app.services.frappe_integration import frappe_client

async def get_employee_for_renewal(employee_id: str):
    """Get employee data from Frappe for renewal workflow"""
    
    # Get from Frappe
    emp_data = await frappe_client.get_employee(employee_id)
    
    # Check compliance status
    compliance = await frappe_client.get_expiring_documents(days=90)
    
    # Return combined data
    return {
        'employee': emp_data,
        'compliance_alerts': [
            alert for alert in compliance['visa_expiring'] + compliance['eid_expiring']
            if alert['name'] == employee_id
        ]
    }
```

### Example 2: Check Employee Readiness for Contract Renewal

```python
async def check_renewal_readiness(employee_id: str) -> dict:
    """Check if employee is ready for contract renewal"""
    
    emp = await frappe_client.get_employee(employee_id)
    data = emp.get('data', {})
    
    issues = []
    
    # Check visa status
    if data.get('visa_expiry_date'):
        days_left = (data['visa_expiry_date'] - date.today()).days
        if days_left < 90:
            issues.append(f"Visa expires in {days_left} days")
    
    # Check Emirates ID
    if data.get('emirates_id_expiry'):
        days_left = (data['emirates_id_expiry'] - date.today()).days
        if days_left < 60:
            issues.append(f"Emirates ID expires in {days_left} days")
    
    # Check medical fitness
    if data.get('medical_fitness_expiry'):
        days_left = (data['medical_fitness_expiry'] - date.today()).days
        if days_left < 30:
            issues.append(f"Medical fitness expires in {days_left} days")
    
    # Check bank details
    if not data.get('bank_name') or not data.get('bank_ac_no'):
        issues.append("Bank details incomplete")
    
    return {
        'ready': len(issues) == 0,
        'issues': issues,
        'employee': data
    }
```

---

## Timeline & Milestones

| Week | Phase | Key Deliverables |
|------|-------|-----------------|
| **1** | Setup | Frappe HRMS installed, UAE fields configured |
| **2** | Migration | All 75+ employees imported, validated |
| **3** | Integration | API bridge working, sync endpoints live |
| **4** | Self-Service | Employee portal enabled, users created |
| **5** | Compliance | Alerts configured, dashboard ready |
| **6** | Go-Live | Testing complete, production launch |

### Success Criteria

✅ All employees from CSV imported into Frappe HRMS  
✅ Employee self-service portal accessible  
✅ UAE compliance fields tracked with alerts  
✅ API integration with Secure Renewals Portal working  
✅ Documents can be uploaded and tracked  
✅ Profile completion visible to HR  

---

## Environment Variables

Add to your `.env` file:

```env
# ⚠️ IMPORTANT: Replace ALL placeholder values below before deployment!
# Never commit actual credentials to version control.

# Frappe HRMS Integration
FRAPPE_HRMS_URL=https://hrms.yourdomain.com  # Replace with your actual Frappe URL
FRAPPE_API_KEY=REPLACE_WITH_ACTUAL_API_KEY  # Generate from Frappe > User > API Access
FRAPPE_API_SECRET=REPLACE_WITH_ACTUAL_API_SECRET  # Generate from Frappe > User > API Access
FRAPPE_SITE_NAME=hrms.yourdomain.com  # Replace with your actual site name

# Sync settings
FRAPPE_SYNC_INTERVAL_MINUTES=15
FRAPPE_ENABLE_AUTO_SYNC=true
```

**Security Notes:**
- Generate API keys in Frappe: User > API Access > Generate Keys
- Store secrets in a secure vault (e.g., Azure Key Vault, AWS Secrets Manager)
- Never commit `.env` files with real credentials to version control
- Rotate API keys periodically (recommended: every 90 days)

---

## Next Steps

1. **Review this plan** with your IT team
2. **Set up staging environment** for Frappe HRMS
3. **Test data import** with a subset of employees
4. **Configure UAE compliance fields**
5. **Build API integration**
6. **Enable employee portal**
7. **Go live!**

---

**Questions?** Contact your development team or refer to:
- [Frappe HRMS Documentation](https://frappehr.com/docs)
- [Frappe API Reference](https://frappeframework.com/docs/v15/user/en/api)
- [Employee Migration Apps Guide](EMPLOYEE_MIGRATION_APPS_GUIDE.md)

---

**Last Updated:** January 2026  
**Document Owner:** HR Technology Team
