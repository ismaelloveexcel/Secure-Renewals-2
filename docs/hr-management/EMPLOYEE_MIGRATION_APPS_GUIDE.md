# Employee Migration GitHub Apps Guide

**For:** Secure Renewals HR Portal - Employee Migration Project  
**Purpose:** Comprehensive guide to GitHub apps for employee management with focus on layered migration strategy  
**Last Updated:** January 2026  
**Audience:** HR Leadership, System Administrators, Developers

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Your Migration Requirements Analysis](#your-migration-requirements-analysis)
3. [Top Recommended GitHub Apps](#top-recommended-github-apps)
4. [Integration Strategy per Migration Layer](#integration-strategy-per-migration-layer)
5. [Employee Self-Service Portal Solutions](#employee-self-service-portal-solutions)
6. [Document & Compliance Management](#document--compliance-management)
7. [UAE-Specific Compliance Features](#uae-specific-compliance-features)
8. [Implementation Roadmap](#implementation-roadmap)
9. [Quick Start Guide](#quick-start-guide)

---

## Executive Summary

Based on your migration document requirements, we've identified **top GitHub apps** that support:

✅ **Employee Master Record** as the central spine  
✅ **Layered migration approach** (5 layers)  
✅ **Employee self-service** for missing data upload  
✅ **Document management** with metadata tracking  
✅ **UAE compliance** (Visa, Emirates ID, ILOE, WPS)  
✅ **Employee Number as immutable identifier**

### 🏆 Top 3 Recommendations for Your Use Case

| Rank | App | Why It Fits | GitHub Stars |
|------|-----|-------------|--------------|
| **#1** | **Frappe HRMS** | Complete HR suite with employee self-service, layered data model, document management | 7,000+ |
| **#2** | **Horilla HRMS** | Free Django-based HR with attendance, leave, payroll & employee portal | 965+ |
| **#3** | **Ever Gauzy** | Modern TypeScript ERP/CRM/HRM with employee management & document handling | 3,370+ |

---

## Your Migration Requirements Analysis

Based on your migration document, here's what you need:

### Core Requirements ✅

| Requirement | Description | Priority |
|-------------|-------------|----------|
| **Immutable Employee Number** | Unique, never changes, never reused | Critical |
| **Layered Data Model** | Separate tables linked to Employee Master | Critical |
| **Employee Self-Service** | Employees upload missing documents & fill information | High |
| **Document Metadata First** | Track expiry, issue dates before file attachment | High |
| **HR-Only Fields** | Compliance & salary data restricted to HR | High |
| **Profile Completion Tracking** | Show % complete for each employee | Medium |
| **UAE Compliance Fields** | Visa, EID, ILOE, Medical, Contract tracking | Critical |
| **Line Manager Linking** | Self-referential relationship | Medium |

### Your 5-Layer Migration Strategy

```
LAYER 1: Employee Master (Core)
    ├── Employee Number (immutable)
    ├── Full Name
    ├── Job Title
    ├── Department
    ├── Line Manager
    ├── Employment Status
    ├── Date of Joining
    ├── Work Location
    └── Employee Type

LAYER 2: Personal Details
    ├── Date of Birth
    ├── Gender
    ├── Nationality
    ├── Personal Email/Mobile
    └── Emergency Contacts

LAYER 3: Compliance & Legal (HR-Only)
    ├── Visa tracking
    ├── Emirates ID
    ├── Medical Fitness
    ├── ILOE/Insurance
    └── Contract dates

LAYER 4: Bank & Payroll Reference
    ├── Bank Name
    ├── IBAN
    └── Account details

LAYER 5: Documents
    ├── Document Metadata
    └── File attachments
```

---

## Top Recommended GitHub Apps

### 🥇 #1: Frappe HRMS (Best Overall Fit)

**Repository:** [`frappe/hrms`](https://github.com/frappe/hrms)  
**Stars:** 7,000+ | **Language:** Python/JavaScript  
**License:** GPL-3.0 (Open Source)

#### Why It's Perfect for Your Migration

| Your Requirement | Frappe HRMS Feature |
|-----------------|---------------------|
| Immutable Employee Number | ✅ Employee ID with auto-generation, non-editable |
| Layered Data Model | ✅ Separate DocTypes for Employee, Salary, Attendance |
| Employee Self-Service | ✅ Built-in Employee Self-Service Portal |
| Document Management | ✅ Document attachments with expiry tracking |
| UAE Compliance | ✅ Customizable for visa, EID, ILOE fields |
| Line Manager | ✅ Reports-to hierarchy built in |

#### Key Features

- **Employee Master Database** with full employee lifecycle
- **Self-Service Portal** where employees can:
  - Update personal information
  - Submit document uploads
  - Request leaves
  - View payslips
- **Document Attachments** with metadata (type, expiry, status)
- **Multi-level Approval Workflows**
- **Attendance Tracking** (geofencing, biometric integration)
- **Leave Management** with entitlement rules
- **Payroll Module** with UAE WPS compatibility
- **HR Analytics & Reports**

#### Integration with Your FastAPI App

```python
# Backend: Sync employees from Frappe HRMS
import httpx
import os
from fastapi import APIRouter, Depends
from app.auth.dependencies import get_current_user

router = APIRouter()

# Securely retrieve API credentials from environment
FRAPPE_URL = os.getenv('FRAPPE_HRMS_URL', 'https://your-hrms.erpnext.com')
FRAPPE_API_KEY = os.getenv('FRAPPE_API_KEY')
FRAPPE_API_SECRET = os.getenv('FRAPPE_API_SECRET')

@router.get("/employees/sync-from-hrms")
async def sync_employees_from_frappe(current_user = Depends(get_current_user)):
    """Sync employee data from Frappe HRMS"""
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(
            f'{FRAPPE_URL}/api/resource/Employee',
            headers={
                'Authorization': f'token {FRAPPE_API_KEY}:{FRAPPE_API_SECRET}'
            },
            params={
                'fields': '["name","employee_name","department","designation","status"]',
                'limit_page_length': 0  # Get all records
            }
        )
        
        employees = response.json()['data']
        
    # Sync to your local database (Layer 1 - Core)
    for emp in employees:
        await employee_service.upsert_employee({
            'employee_id': emp['name'],  # Immutable Employee Number
            'name': emp['employee_name'],
            'department': emp['department'],
            'job_title': emp['designation'],
            'employment_status': emp['status']
        })
    
    return {"synced": len(employees)}
```

#### Deployment

```bash
# Docker deployment (recommended)
git clone https://github.com/frappe/hrms
cd hrms

# Use Frappe Docker setup
docker compose up -d
```

**Integration Effort:** Medium (2-3 weeks)  
**Monthly Cost:** $0 (self-hosted)

---

### 🥈 #2: Horilla HRMS (Great for Django Teams)

**Repository:** [`horilla-opensource/horilla`](https://github.com/horilla-opensource/horilla)  
**Stars:** 965+ | **Language:** Python (Django) / HTMX / JavaScript  
**License:** LGPL-3.0 (Open Source)

#### Why It Works for Your Migration

| Your Requirement | Horilla Feature |
|-----------------|-----------------|
| Immutable Employee Number | ✅ Badge ID (unique, non-editable) |
| Layered Data Model | ✅ Modular app structure (base, attendance, leave, payroll) |
| Employee Self-Service | ✅ Employee portal with profile editing |
| Document Management | ✅ Document upload with categories |
| UAE Compliance | ⚡ Requires custom fields (easy to add in Django) |
| Tech Stack Match | ✅ Python-based, matches your FastAPI backend |

#### Key Features

- **Employee Database** with complete profile management
- **Attendance Tracking** with biometric integration
- **Leave Management** with multiple leave types
- **Payroll Processing** with customizable components
- **Recruitment Module** with applicant tracking
- **Employee Self-Service Portal**
- **HTMX-powered UI** (fast, modern feel)

#### Integration with Your FastAPI App

```python
# Since Horilla is Django, you can share the database
# or use REST API integration

# Option 1: Database-level integration (shared PostgreSQL)
from sqlalchemy import text

async def get_horilla_employees():
    """Read employees directly from Horilla's database"""
    query = text("""
        SELECT badge_id, employee_name, department_id, job_position_id
        FROM base_employee
        WHERE is_active = true
    """)
    
    async with horilla_engine.connect() as conn:
        result = await conn.execute(query)
        return result.fetchall()

# Option 2: Build a simple API bridge in Horilla
# Add a Django REST endpoint that your FastAPI app calls
```

#### Deployment

```bash
# Clone and setup
git clone https://github.com/horilla-opensource/horilla.git
cd horilla
pip install -r requirements.txt

# Configure database (use same PostgreSQL as your app)
cp .env.example .env
# Edit .env with your database settings

python manage.py migrate
python manage.py runserver 0.0.0.0:8001
```

**Integration Effort:** Low-Medium (1-2 weeks)  
**Monthly Cost:** $0 (self-hosted)

---

### 🥉 #3: Ever Gauzy (Modern TypeScript Solution)

**Repository:** [`ever-co/ever-gauzy`](https://github.com/ever-co/ever-gauzy)  
**Stars:** 3,370+ | **Language:** TypeScript (NestJS + Angular)  
**License:** AGPL-3.0 (Open Source)

#### Why It Works for Your Migration

| Your Requirement | Ever Gauzy Feature |
|-----------------|---------------------|
| Immutable Employee Number | ✅ Built-in employee ID system |
| Employee Self-Service | ✅ Employee mobile/web portal |
| Document Management | ✅ Document storage with metadata |
| Time & Attendance | ✅ Time tracking with screenshots |
| Modern Stack | ✅ TypeScript matches your React frontend |

#### Key Features

- **Human Resource Management**
- **Time Tracking & Activity Monitoring**
- **Invoicing & Payments**
- **Project Management**
- **Expense Tracking**
- **Employee Portal**
- **REST API** for integration

#### Integration Approach

```typescript
// Frontend: Fetch from Ever Gauzy via backend proxy
// (Never expose API keys in frontend)

// Backend proxy endpoint (Python/FastAPI)
@router.get("/employees/from-gauzy")
async def get_gauzy_employees(current_user = Depends(get_current_user)):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f'{GAUZY_API_URL}/api/employee',
            headers={'Authorization': f'Bearer {GAUZY_TOKEN}'}
        )
        return response.json()
```

**Integration Effort:** Medium (2-3 weeks)  
**Monthly Cost:** $0 (self-hosted)

---

## Integration Strategy per Migration Layer

### Layer 1: Employee Master (Core)

**Best GitHub App:** Frappe HRMS or Horilla

```python
# Migration script for Layer 1
import pandas as pd
from datetime import datetime

async def migrate_layer_1(csv_path: str):
    """Import Employee Master from CSV - Core fields only"""
    
    df = pd.read_csv(csv_path)
    
    # Map columns to Layer 1 fields
    layer1_mapping = {
        'Employee No': 'employee_id',      # Immutable anchor
        'Employee Name': 'name',
        'Job Title': 'job_title',
        'Department': 'department',
        'Line Manager': 'line_manager_name',
        'Employment Status': 'employment_status',
        'Joining Date': 'joining_date',
        'Location': 'location',
        'Function': 'function'  # Employee/Manager type
    }
    
    # Validate Employee Numbers (duplicates = STOP)
    if df['Employee No'].duplicated().any():
        raise ValueError("Duplicate Employee Numbers found! Migration stopped.")
    
    success_count = 0
    for _, row in df.iterrows():
        employee_data = {
            v: row.get(k) for k, v in layer1_mapping.items() 
            if row.get(k) and pd.notna(row.get(k))  # Filter out NaN and empty values
        }
        
        # Create in database
        await employee_service.create_employee(employee_data)
        success_count += 1
    
    return {"created": success_count, "layer": 1}
```

### Layer 2: Personal Details

**Best GitHub App:** DocuSeal (for document collection) + Custom Form

```python
# Employee self-service form for Layer 2
@router.post("/profile/personal-details")
async def update_personal_details(
    employee_id: str,
    date_of_birth: date,
    gender: str,
    nationality: str,
    personal_email: str = None,
    personal_mobile: str = None,
    emergency_contact_name: str = None,
    emergency_contact_phone: str = None,
    emergency_contact_relationship: str = None,
    current_user = Depends(get_current_employee)
):
    """Employee self-service: Update personal details (Layer 2)"""
    
    # Only allow employees to update their own profile
    if current_user.employee_id != employee_id:
        raise HTTPException(403, "Can only update your own profile")
    
    # Update profile
    await profile_service.update_personal_details(employee_id, {
        'date_of_birth': date_of_birth,
        'gender': gender,
        'nationality': nationality,
        'personal_email': personal_email,
        'personal_mobile': personal_mobile,
        'emergency_contact_name': emergency_contact_name,
        'emergency_contact_phone': emergency_contact_phone,
        'emergency_contact_relationship': emergency_contact_relationship
    })
    
    # Update profile completion percentage
    await profile_service.recalculate_completion(employee_id)
    
    return {"status": "updated", "layer": 2}
```

### Layer 3: Compliance & Legal (HR-Only)

**Best GitHub App:** Paperless-ngx (document tracking) + Custom UAE compliance module

```python
# HR-only compliance tracking
from fastapi import Depends, HTTPException
from datetime import date, timedelta

@router.post("/compliance/update")
async def update_compliance_data(
    employee_id: str,
    visa_number: str = None,
    visa_expiry: date = None,
    emirates_id: str = None,
    emirates_id_expiry: date = None,
    medical_fitness_expiry: date = None,
    iloe_status: str = None,
    iloe_expiry: date = None,
    contract_type: str = None,
    contract_start: date = None,
    contract_end: date = None,
    current_user = Depends(require_hr_role)  # HR-only access
):
    """Update compliance data - HR only access (Layer 3)"""
    
    await compliance_service.update(employee_id, {
        'visa_number': visa_number,
        'visa_expiry': visa_expiry,
        'emirates_id': emirates_id,
        'emirates_id_expiry': emirates_id_expiry,
        'medical_fitness_expiry': medical_fitness_expiry,
        'iloe_status': iloe_status,
        'iloe_expiry': iloe_expiry,
        'contract_type': contract_type,
        'contract_start': contract_start,
        'contract_end': contract_end
    })
    
    # Check for expiring documents and create alerts
    await compliance_service.check_expiry_alerts(employee_id)
    
    return {"status": "updated", "layer": 3}

@router.get("/compliance/alerts")
async def get_compliance_alerts(current_user = Depends(require_hr_role)):
    """Get compliance alerts for 60/30/7 day expiries"""
    
    return await compliance_service.get_expiry_alerts([60, 30, 7])
```

### Layer 4: Bank & Payroll Reference

**Best GitHub App:** Custom + Frappe HRMS payroll module

```python
import re
from datetime import datetime

# UAE IBAN validation helper
def is_valid_uae_iban(iban: str) -> bool:
    """Validate UAE IBAN format: AE + 2 check digits + 19 alphanumeric characters"""
    if not iban:
        return False
    # Remove spaces and convert to uppercase
    iban = iban.replace(' ', '').upper()
    # UAE IBAN pattern: AE followed by 21 characters (2 check digits + 19 alphanumeric)
    pattern = r'^AE\d{2}[A-Z0-9]{19}$'
    return bool(re.match(pattern, iban))

# Bank details with employee submit + HR validation
@router.post("/bank-details/submit")
async def submit_bank_details(
    bank_name: str,
    iban: str,
    account_holder_name: str,
    current_user = Depends(get_current_employee)
):
    """Employee submits bank details - HR validates (Layer 4)"""
    
    # Validate IBAN format (UAE format: AE + 2 check digits + 19 alphanumeric)
    if not is_valid_uae_iban(iban):
        raise HTTPException(400, "Invalid UAE IBAN format")
    
    # Submit for HR approval
    await bank_service.submit_for_approval(current_user.employee_id, {
        'bank_name': bank_name,
        'iban': iban,
        'account_holder_name': account_holder_name,
        'status': 'pending_validation',
        'submitted_at': datetime.utcnow()
    })
    
    # Notify HR
    await notification_service.notify_hr_bank_submission(current_user.employee_id)
    
    return {"status": "submitted_for_validation", "layer": 4}

@router.post("/bank-details/{employee_id}/validate")
async def validate_bank_details(
    employee_id: str,
    approved: bool,
    rejection_reason: str = None,
    current_user = Depends(require_hr_role)
):
    """HR validates bank details"""
    
    if approved:
        await bank_service.approve(employee_id, current_user.employee_id)
    else:
        await bank_service.reject(employee_id, rejection_reason, current_user.employee_id)
    
    return {"status": "validated" if approved else "rejected"}
```

### Layer 5: Documents

**Best GitHub App:** Paperless-ngx or DocuSeal

```python
from datetime import date
from typing import Optional

# Document status calculation helper
def calculate_status(expiry_date: Optional[date]) -> str:
    """Calculate document status based on expiry date"""
    if not expiry_date:
        return 'No Expiry'
    
    today = date.today()
    days_until = (expiry_date - today).days
    
    if days_until < 0:
        return 'Expired'
    elif days_until <= 30:
        return 'Expiring Soon'
    else:
        return 'Valid'

# Document upload with metadata-first approach
@router.post("/documents/register")
async def register_document(
    employee_id: str,
    document_type: str,  # passport, visa, eid, contract, etc.
    issue_date: date = None,
    expiry_date: date = None,
    current_user = Depends(get_current_employee)
):
    """Step 1: Register document metadata BEFORE upload (Layer 5)"""
    
    # Create document record with metadata
    doc = await document_service.register({
        'employee_id': employee_id,
        'document_type': document_type,
        'issue_date': issue_date,
        'expiry_date': expiry_date,
        'status': calculate_status(expiry_date),  # Valid/Expiring/Expired
        'file_attached': False
    })
    
    return {"document_id": doc.id, "upload_url": f"/documents/{doc.id}/upload"}

@router.post("/documents/{document_id}/upload")
async def upload_document_file(
    document_id: str,
    file: UploadFile,
    current_user = Depends(get_current_employee)
):
    """Step 2: Attach file to existing document record"""
    
    doc = await document_service.get(document_id)
    
    # Validate ownership
    if doc.employee_id != current_user.employee_id:
        raise HTTPException(403, "Cannot upload to another employee's document")
    
    # Store file securely
    file_path = await file_storage.save(file, f"documents/{doc.employee_id}/{document_id}")
    
    # Update document record
    await document_service.update(document_id, {
        'file_path': file_path,
        'file_attached': True,
        'uploaded_at': datetime.utcnow()
    })
    
    # Update profile completion
    await profile_service.recalculate_completion(doc.employee_id)
    
    return {"status": "uploaded", "layer": 5}
```

---

## Employee Self-Service Portal Solutions

### Formbricks (Forms & Surveys)

**Repository:** [`formbricks/formbricks`](https://github.com/formbricks/formbricks)

Use for: Employee data collection forms, onboarding surveys, profile completion

```python
# Create employee profile completion form
async def create_profile_form(employee_id: str):
    """Generate a Formbricks survey for employee to complete profile"""
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f'{FORMBRICKS_URL}/api/surveys',
            json={
                'name': f'Profile Completion - {employee_id}',
                'type': 'link',
                'questions': [
                    {'type': 'text', 'id': 'personal_email', 'headline': 'Personal Email'},
                    {'type': 'text', 'id': 'personal_mobile', 'headline': 'Personal Mobile'},
                    {'type': 'text', 'id': 'emergency_contact', 'headline': 'Emergency Contact Name'},
                    # ... more questions for Layer 2 data
                ],
                'thankYouCard': {
                    'enabled': True,
                    'headline': 'Thank you! Your profile has been updated.'
                }
            },
            headers={'x-api-key': FORMBRICKS_API_KEY}
        )
        
    return response.json()['surveyUrl']
```

### DocuSeal (Document Collection)

**Repository:** [`docusealco/docuseal`](https://github.com/docusealco/docuseal)

Use for: Collecting signed documents, onboarding paperwork

```python
# Send document collection request to employee
async def request_documents(employee_id: str, document_types: list):
    """Send DocuSeal request for employee to upload documents"""
    
    employee = await employee_service.get(employee_id)
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f'{DOCUSEAL_URL}/api/submissions',
            json={
                'template_id': 'employee_documents',
                'send_email': True,
                'submitters': [{
                    'email': employee.email,
                    'name': employee.name,
                    'role': 'Employee',
                    'fields': [
                        {'name': 'document_types', 'value': ', '.join(document_types)}
                    ]
                }]
            },
            headers={'X-Auth-Token': DOCUSEAL_API_KEY}
        )
    
    return response.json()
```

---

## Document & Compliance Management

### Paperless-ngx (Document Management)

**Repository:** [`paperless-ngx/paperless-ngx`](https://github.com/paperless-ngx/paperless-ngx)  
**Stars:** 17,000+ | **Language:** Python

Perfect for Layer 5 document management with:
- OCR for scanned documents
- Automatic document classification
- Metadata tagging (expiry dates, document types)
- Full-text search
- REST API for integration

```python
# Sync documents from Paperless-ngx
async def get_employee_documents(employee_id: str):
    """Fetch documents tagged with employee ID from Paperless"""
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f'{PAPERLESS_URL}/api/documents/',
            params={
                'tags__name__icontains': employee_id
            },
            headers={'Authorization': f'Token {PAPERLESS_TOKEN}'}
        )
    
    return response.json()['results']
```

---

## UAE-Specific Compliance Features

### Compliance Alert System

```python
# UAE compliance alerts for 60/30/7 day expiries
from datetime import date, timedelta
from typing import List

UAE_COMPLIANCE_ITEMS = [
    'visa_expiry',
    'emirates_id_expiry', 
    'medical_fitness_expiry',
    'iloe_expiry',
    'contract_end'
]

async def get_compliance_dashboard():
    """HR dashboard showing UAE compliance status"""
    
    today = date.today()
    alerts = {
        'expired': [],
        '7_days': [],
        '30_days': [],
        '60_days': []
    }
    
    employees = await employee_service.get_all_active()
    
    for emp in employees:
        for field in UAE_COMPLIANCE_ITEMS:
            expiry = getattr(emp.compliance, field, None)
            if not expiry:
                continue
                
            days_until = (expiry - today).days
            
            # Create alert entry
            alert_entry = {
                'employee_id': emp.employee_id,
                'name': emp.name,
                'item': field,
                'expiry': expiry,
                'days_remaining': days_until
            }
            
            if days_until < 0:
                alert_entry['days_overdue'] = abs(days_until)
                alerts['expired'].append(alert_entry)
            elif days_until <= 7:
                alerts['7_days'].append(alert_entry)
            elif days_until <= 30:
                alerts['30_days'].append(alert_entry)
            elif days_until <= 60:
                alerts['60_days'].append(alert_entry)
    
    return alerts

# WPS readiness check
async def check_wps_readiness(employee_id: str):
    """Check if employee is WPS-ready (valid IBAN, active contract)"""
    
    emp = await employee_service.get(employee_id)
    bank = await bank_service.get_validated(employee_id)
    
    issues = []
    
    if not bank:
        issues.append("No validated bank account")
    elif not bank.iban:
        issues.append("Missing IBAN")
    elif not is_valid_uae_iban(bank.iban):
        issues.append("Invalid IBAN format")
    
    if not emp.compliance.contract_end:
        issues.append("No contract end date")
    elif emp.compliance.contract_end < date.today():
        issues.append("Contract expired")
    
    return {
        'wps_ready': len(issues) == 0,
        'issues': issues
    }
```

---

## Implementation Roadmap

### Week 1: Foundation & Layer 1

| Task | Description | Effort |
|------|-------------|--------|
| Deploy Frappe HRMS or Horilla | Set up chosen HRMS | 2 days |
| Configure Employee Master | Set up immutable employee ID | 1 day |
| Migrate Layer 1 data | Import from CSV | 1 day |
| Validate migration | Check for duplicates, link managers | 1 day |

### Week 2: Layers 2-3 & Self-Service

| Task | Description | Effort |
|------|-------------|--------|
| Enable employee self-service | Configure portal access | 1 day |
| Build Layer 2 forms | Personal details collection | 2 days |
| Build Layer 3 (compliance) | UAE compliance module | 2 days |

### Week 3: Layers 4-5 & Documents

| Task | Description | Effort |
|------|-------------|--------|
| Bank details workflow | Submit + HR validate | 1 day |
| Document metadata system | Register before upload | 2 days |
| Integrate Paperless-ngx | Document storage | 2 days |

### Week 4: Compliance & Testing

| Task | Description | Effort |
|------|-------------|--------|
| UAE compliance dashboard | 60/30/7 day alerts | 2 days |
| Profile completion tracking | Percentage per employee | 1 day |
| Testing & bug fixes | End-to-end testing | 2 days |

---

## Quick Start Guide

### Option A: Use Frappe HRMS (Full-Featured)

```bash
# 1. Clone and deploy Frappe HRMS
docker run -d --name frappe-hrms \
  -p 8080:8080 \
  -e DB_HOST=your-postgres \
  frappe/hrms:latest

# 2. Configure Employee ID as immutable
# In Frappe, Employee ID is already non-editable after creation

# 3. Import your CSV
# Use Data Import tool or API:
curl -X POST https://your-hrms/api/method/frappe.client.insert_many \
  -H "Authorization: token api_key:api_secret" \
  -d @employees.json
```

### Option B: Use Horilla (Python/Django)

```bash
# 1. Clone repository
git clone https://github.com/horilla-opensource/horilla.git
cd horilla

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure to use your PostgreSQL
echo "DATABASE_URL=postgresql://user:pass@localhost:5432/hrms" >> .env

# 4. Run migrations
python manage.py migrate
python manage.py runserver 0.0.0.0:8001

# 5. Import employees via Django shell
python manage.py shell
>>> from base.models import Employee
>>> Employee.objects.create(badge_id='BAYN00002', ...)
```

### Option C: Extend Your Existing App

Your current FastAPI app already has:
- ✅ Employee model with `employee_id` as unique anchor
- ✅ EmployeeProfile model for self-service data
- ✅ Separation of HR-only vs employee-editable fields

**To complete the migration:**

1. Add compliance tracking fields (visa, EID, ILOE)
2. Add document metadata table
3. Add profile completion calculation
4. Add UAE compliance alert service
5. Enable employee self-service endpoints

See [HR_IMPLEMENTATION_PLAN.md](HR_IMPLEMENTATION_PLAN.md) for detailed instructions.

---

## Comparison Summary

| Feature | Frappe HRMS | Horilla | Ever Gauzy | Extend Your App |
|---------|-------------|---------|------------|-----------------|
| **Setup Complexity** | Medium | Low | Medium | Low |
| **Employee Self-Service** | ✅ Built-in | ✅ Built-in | ✅ Built-in | Build it |
| **UAE Compliance** | Customizable | Customizable | Customizable | Build it |
| **Document Management** | ✅ Included | ✅ Included | ✅ Included | Integrate Paperless |
| **Payroll/WPS** | ✅ Full module | ✅ Full module | ✅ Basic | External |
| **Tech Stack Match** | Python ✅ | Django ✅ | TypeScript | FastAPI ✅ |
| **Stars** | 7,000+ | 965+ | 3,370+ | N/A |
| **Best For** | Full replacement | Quick start | Modern UI | Minimal change |

---

## Recommendation

Based on your requirements:

### If you want a complete solution:
→ **Use Frappe HRMS** - Most comprehensive, UAE-ready with customization

### If you want Python ecosystem alignment:
→ **Use Horilla** - Django-based, easy to extend, shares PostgreSQL

### If you want to minimize changes:
→ **Extend your existing app** - Add compliance module, document tracking, and self-service forms

The existing Secure Renewals HR Portal already has a solid employee model foundation. The quickest path is to:

1. **Add a `Compliance` table** for Layer 3 UAE-specific fields
2. **Add a `Document` table** for Layer 5 with metadata-first approach
3. **Enable employee self-service** on the existing `EmployeeProfile` model
4. **Integrate Formbricks** for collecting missing information
5. **Integrate Paperless-ngx** for document storage

---

**Last Updated:** January 2026  
**Related Documents:**  
- [HR Apps Integration Guide](HR_APPS_INTEGRATION_GUIDE.md)
- [HR GitHub Apps Reference](HR_GITHUB_APPS_REFERENCE.md)
- [HR Implementation Plan](HR_IMPLEMENTATION_PLAN.md)
