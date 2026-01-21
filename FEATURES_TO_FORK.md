# Features to Fork - Quick Reference

**For**: Azure-Deployment-HR-Portal (your existing app)  
**From**: Secure-Renewals-2 (this repository)  
**Approach**: Cherry-pick features, not full deployment

---

## 🎯 What You Should Fork

### ⭐⭐⭐⭐⭐ Must-Fork Features (High Value, Low Effort)

| Feature | Benefit | Files | Effort | Priority |
|---------|---------|-------|--------|----------|
| **UAE Compliance Tracking** | Automated visa/EID alerts | 3 files | 4-6h | #1 |
| **Document OCR Patterns** | Auto-extract ID numbers | 1 file | 30min | #2 |
| **Bank Approval Workflow** | WPS compliance + audit | 2 files | 3-4h | #3 |
| **Compliance Alert Logic** | Color-coded urgency | Code snippet | 1h | #4 |

### ⭐⭐⭐⭐ Should-Fork Features (High Value, Medium Effort)

| Feature | Benefit | Files | Effort | Priority |
|---------|---------|-------|--------|----------|
| **Document Management** | Azure Blob + versioning | 4 files | 6-8h | #5 |
| **Attendance Tracking** | Clock in/out, timesheets | 3 files | 4-5h | #6 |
| **Onboarding Tokens** | Secure invite system | 2 files | 2-3h | #7 |

### ⭐⭐⭐ Nice-to-Fork Features (Medium Value, High Effort)

| Feature | Benefit | Files | Effort | Priority |
|---------|---------|-------|--------|----------|
| **Recruitment (ATS)** | Full applicant tracking | 8 files | 8-10h | #8 |
| **Pass Generation** | Access passes + QR codes | 4 files | 4-5h | #9 |
| **Admin Dashboard Layout** | 4-tab navigation | 5 files | 6-8h | #10 |

---

## 📂 File Extraction Map

### Feature 1: UAE Compliance Tracking

**Copy exactly these files**:
```
backend/app/models/employee_compliance.py        → Your models/
backend/app/routers/employee_compliance.py       → Your routers/
frontend/src/components/Compliance/              → Your components/
```

**Modify**:
- Update `employee_id` foreign key to match your schema
- Change API base URL in frontend
- Adjust color scheme to match your theme

**Add to your database**:
```sql
CREATE TABLE employee_compliance (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(id),
    document_type VARCHAR(50),  -- 'visa', 'eid', 'medical'
    expiry_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'valid'
);
```

**Result**: Automated compliance alerts for visa, EID, medical fitness

---

### Feature 2: Document Management with OCR

**Copy exactly these files**:
```
backend/app/models/employee_document.py          → Your models/
backend/app/routers/employee_documents.py        → Your routers/
frontend/src/components/Documents/               → Your components/
```

**Extract these code snippets**:
```python
# OCR Patterns (copy to your utils)
OCR_PATTERNS = {
    'emirates_id': r'784-\d{4}-\d{7}-\d{1}',
    'passport': r'[A-Z]{2}\d{7}',
}

# Azure Blob Upload (copy to your services)
async def upload_to_azure_blob(file, filename):
    connection_string = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
    blob_service = BlobServiceClient.from_connection_string(connection_string)
    blob_client = blob_service.get_blob_client(container="documents", blob=filename)
    blob_client.upload_blob(file, overwrite=True)
    return blob_client.url
```

**Result**: Document upload with automatic OCR extraction

---

### Feature 3: Attendance Tracking

**Copy exactly these files**:
```
backend/app/models/attendance.py                 → Your models/
backend/app/routers/attendance.py                → Your routers/
frontend/src/components/Attendance/              → Your components/
```

**Extract these endpoints**:
```python
POST /api/attendance/clock-in     # Start work day
POST /api/attendance/clock-out    # End work day
GET  /api/attendance/my-timesheet # View monthly attendance
```

**Result**: Employee clock in/out with monthly timesheets

---

### Feature 4: Bank Details Approval Workflow

**Copy exactly these files**:
```
backend/app/models/employee_bank.py              → Your models/
backend/app/routers/employee_bank.py             → Your routers/
```

**Extract this approval pattern**:
```python
# Employee requests change
pending_changes = {
    'bank_name': new_value,
    'iban': new_iban,
    'status': 'pending'
}

# HR approves
if approved:
    employee.bank_name = pending_changes['bank_name']
    employee.iban = pending_changes['iban']
    pending_changes = None
```

**Result**: WPS-compliant bank details with HR approval

---

### Feature 5: Recruitment (ATS)

**Copy exactly these files**:
```
backend/app/models/recruitment.py                → Your models/
backend/app/routers/recruitment.py               → Your routers/
frontend/src/components/Recruitment/             → Your components/
```

**Database tables needed**:
```sql
CREATE TABLE recruitment_requests (
    id SERIAL PRIMARY KEY,
    request_number VARCHAR(50) UNIQUE,
    position_title VARCHAR(200),
    status VARCHAR(50)  -- pending, approved, filled
);

CREATE TABLE candidates (
    id SERIAL PRIMARY KEY,
    candidate_number VARCHAR(50) UNIQUE,
    recruitment_request_id INTEGER REFERENCES recruitment_requests(id),
    full_name VARCHAR(200),
    stage VARCHAR(50)  -- applied, screening, interview, offer, hired
);
```

**Result**: Full applicant tracking system

---

## 🔧 Integration Steps (Generic)

### Step 1: Identify Feature
- [ ] Choose feature from priority list above
- [ ] Review files needed
- [ ] Check dependencies

### Step 2: Copy Files
```bash
# Example: Copy compliance model
cp Secure-Renewals-2/backend/app/models/employee_compliance.py \
   Azure-Deployment-HR-Portal/backend/app/models/

# Copy compliance router
cp Secure-Renewals-2/backend/app/routers/employee_compliance.py \
   Azure-Deployment-HR-Portal/backend/app/routers/
```

### Step 3: Update Imports
```python
# In your copied files, update:
from app.models.employee_compliance import EmployeeCompliance  # Update path
from app.database import get_db  # Update to your database helper
```

### Step 4: Create Database Migration
```bash
cd Azure-Deployment-HR-Portal/backend
alembic revision -m "Add compliance tracking"

# Edit migration file, then run:
alembic upgrade head
```

### Step 5: Register Router
```python
# In Azure-Deployment-HR-Portal/backend/app/main.py
from app.routers import employee_compliance

app.include_router(
    employee_compliance.router, 
    prefix="/api/compliance",
    tags=["compliance"]
)
```

### Step 6: Copy Frontend Components
```bash
# Copy React component
cp -r Secure-Renewals-2/frontend/src/components/Compliance \
      Azure-Deployment-HR-Portal/frontend/src/components/
```

### Step 7: Update API URLs
```typescript
// In your frontend component
const API_BASE_URL = 'https://your-app.azurewebsites.net/api';

// Update API calls
await fetch(`${API_BASE_URL}/compliance/alerts`);
```

### Step 8: Test
```bash
# Test backend
curl http://localhost:8000/api/compliance/alerts

# Test frontend
npm run dev
```

---

## 💡 Quick Extraction Examples

### Example 1: Just Copy the Alert Logic (No Schema Change)

**Want**: Compliance alert color coding  
**Time**: 15 minutes  
**No database changes needed**

```python
# Copy this function to your existing code
def get_alert_urgency(expiry_date):
    """Returns: critical, urgent, warning, notice, or ok"""
    days = (expiry_date - date.today()).days
    
    if days <= 0:
        return 'critical'  # Red - Expired
    elif days <= 7:
        return 'urgent'    # Orange - 7 days
    elif days <= 30:
        return 'warning'   # Yellow - 30 days
    elif days <= 60:
        return 'notice'    # Amber - 60 days
    return 'ok'
```

---

### Example 2: Just Copy OCR Patterns (No Schema Change)

**Want**: Auto-extract Emirates ID numbers  
**Time**: 10 minutes  
**No database changes needed**

```python
import re

# Copy these patterns
def extract_emirates_id(text):
    """Extract Emirates ID from OCR text"""
    pattern = r'784-\d{4}-\d{7}-\d{1}'
    match = re.search(pattern, text)
    return match.group(0) if match else None

def extract_passport_number(text):
    """Extract passport number from OCR text"""
    pattern = r'[A-Z]{2}\d{7}'
    match = re.search(pattern, text)
    return match.group(0) if match else None
```

---

### Example 3: Just Copy Attendance Calculation (No Schema Change)

**Want**: Calculate work hours  
**Time**: 20 minutes  
**Can use with existing attendance data**

```python
from datetime import datetime, timedelta

def calculate_work_hours(clock_in: datetime, clock_out: datetime):
    """Calculate total work hours and overtime"""
    total_hours = (clock_out - clock_in).total_seconds() / 3600
    
    standard_hours = 8
    overtime = max(0, total_hours - standard_hours)
    
    return {
        'total_hours': round(total_hours, 2),
        'standard_hours': min(total_hours, standard_hours),
        'overtime_hours': round(overtime, 2)
    }
```

---

## 🚨 What NOT to Fork

### ❌ Don't Copy These (Already Have Better Solutions)

| Feature | Why Not | Your Solution |
|---------|---------|---------------|
| Authentication | You have Azure AD | Keep your Azure AD setup |
| User Management | Already built | Keep your existing system |
| Main Layout | Already designed | Keep your design system |
| Routing Structure | Different architecture | Keep your routing |

---

## 📊 Feature Value Matrix

### High Value + Low Effort (Do These First)

```
1. ✅ UAE Compliance Tracking     (Critical + 4-6h)
2. ✅ Document OCR Patterns       (High value + 30min)
3. ✅ Bank Approval Workflow      (WPS required + 3-4h)
4. ✅ Compliance Alert Logic      (Useful + 1h)
```

### High Value + Medium Effort (Do These Next)

```
5. ⭐ Document Management         (Important + 6-8h)
6. ⭐ Attendance Tracking          (Requested + 4-5h)
7. ⭐ Onboarding Tokens            (Secure + 2-3h)
```

### Medium Value + High Effort (Consider Later)

```
8. 💡 Recruitment (ATS)            (Nice-to-have + 8-10h)
9. 💡 Pass Generation              (Optional + 4-5h)
10. 💡 Admin Dashboard Layout      (Cosmetic + 6-8h)
```

---

## ⏱️ Time Estimates by Week

### Week 1 (8 hours)
- [ ] Fork UAE Compliance Tracking (6h)
- [ ] Fork Document OCR Patterns (1h)
- [ ] Fork Alert Logic (1h)

### Week 2 (8 hours)
- [ ] Fork Document Management (6h)
- [ ] Fork Bank Approval Workflow (2h)

### Week 3 (6 hours)
- [ ] Fork Attendance Tracking (4h)
- [ ] Fork Onboarding Tokens (2h)

### Week 4 (Optional - 10 hours)
- [ ] Fork Recruitment System (10h)

**Total Essential Features**: 22 hours (3 weeks)

---

## 📞 Support While Forking

### Questions to Ask:
1. "How does feature X integrate with feature Y?"
2. "What dependencies does this feature have?"
3. "Can I use this without the full database schema?"

### Common Issues:
1. **Import errors**: Update import paths to match your structure
2. **Database errors**: Run migrations before testing
3. **API 404**: Register router in main.py
4. **CORS errors**: Update ALLOWED_ORIGINS in backend

---

## ✅ Feature Fork Checklist

Before forking any feature:

- [ ] I've read the feature description
- [ ] I understand the database requirements
- [ ] I know which files to copy
- [ ] I have a test environment ready
- [ ] I can rollback if something breaks

After forking:

- [ ] Feature works in local dev
- [ ] Database migration successful
- [ ] API endpoints respond correctly
- [ ] Frontend integrated successfully
- [ ] Tested with real data
- [ ] Deployed to staging
- [ ] Verified in production

---

## 🎯 Recommended Approach

### Phase 1: Quick Wins (Week 1)
**Goal**: Add immediate value with minimal risk

1. Copy compliance alert logic (no schema change)
2. Copy OCR patterns (no schema change)
3. Add compliance tracking table
4. Deploy and test

**Outcome**: Automated visa/EID alerts working

### Phase 2: Core Features (Week 2-3)
**Goal**: Add essential HR features

1. Document management with Azure Blob
2. Bank details approval
3. Attendance tracking

**Outcome**: Complete employee data management

### Phase 3: Advanced Features (Week 4+)
**Goal**: Add nice-to-have features

1. Recruitment system (if needed)
2. Pass generation (if needed)

**Outcome**: Full-featured HR portal

---

**Start Here**: Pick one feature from Priority #1-4, follow the extraction steps, test thoroughly, then move to the next.

---

*Updated for feature forking: January 21, 2026*
