# Feature Extraction Guide - For Azure-Deployment-HR-Portal

**Purpose**: Identify and extract specific features from Secure-Renewals-2 to implement in your existing Azure-Deployment-HR-Portal  
**Approach**: Cherry-pick features, not full deployment  
**Target**: Existing deployed Azure app

---

## 🎯 Understanding the Approach

**What You Have**: Azure-Deployment-HR-Portal (already deployed)  
**What This Repo Offers**: Secure-Renewals-2 (feature-rich HR portal)  
**Goal**: Extract and integrate specific features you need

---

## 📦 Feature Extraction Matrix

### Priority 1: UAE Compliance Tracking ⭐⭐⭐⭐⭐

**Why Extract This**: Critical for UAE operations, automated alerts, proven system

#### Files to Copy

**Backend**:
```
✅ Copy These Files:
├── backend/app/models/employee_compliance.py
├── backend/app/routers/employee_compliance.py
├── backend/app/services/compliance_service.py (if exists)
└── backend/alembic/versions/[compliance_migration].py

📝 Modifications Needed:
- Update table names to match your schema
- Adjust foreign keys to your employee table
- Update API paths to fit your routing
```

**Frontend**:
```
✅ Copy These Components:
├── frontend/src/components/Compliance/
│   ├── ComplianceAlerts.tsx
│   ├── ComplianceList.tsx
│   └── ComplianceDashboard.tsx

📝 Modifications Needed:
- Update API endpoints to your backend
- Match your color scheme/theme
- Integrate with your existing layout
```

**Database Migration**:
```sql
-- Extract from employee_compliance table
CREATE TABLE employee_compliance (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(id),
    document_type VARCHAR(50) NOT NULL,  -- 'visa', 'eid', 'medical', etc.
    issue_date DATE,
    expiry_date DATE NOT NULL,
    document_number VARCHAR(100),
    issuing_authority VARCHAR(200),
    status VARCHAR(20) DEFAULT 'valid',  -- 'valid', 'expiring', 'expired'
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_compliance_expiry ON employee_compliance(expiry_date);
CREATE INDEX idx_compliance_employee ON employee_compliance(employee_id);
```

**Alert Logic** (copy this logic):
```python
# Compliance alert thresholds
ALERT_THRESHOLDS = {
    'critical': 0,      # Expired or expires today
    'urgent': 7,        # Expires within 7 days
    'warning': 30,      # Expires within 30 days
    'notice': 60        # Expires within 60 days
}

def get_urgency_level(days_until_expiry):
    if days_until_expiry <= 0:
        return 'critical'
    elif days_until_expiry <= 7:
        return 'urgent'
    elif days_until_expiry <= 30:
        return 'warning'
    elif days_until_expiry <= 60:
        return 'notice'
    return 'ok'
```

**Integration Steps**:
1. Create `employee_compliance` table in your database
2. Copy compliance model to your models folder
3. Copy compliance router to your routers folder
4. Add compliance endpoints to your main.py
5. Copy frontend components to your React app
6. Update API calls to match your backend URL
7. Add compliance tab to your admin dashboard

**Estimated Time**: 4-6 hours

---

### Priority 2: Document Management with OCR ⭐⭐⭐⭐⭐

**Why Extract This**: Automates document tracking, OCR extraction, Azure Blob integration

#### Files to Copy

**Backend**:
```
✅ Copy These Files:
├── backend/app/models/employee_document.py
├── backend/app/routers/employee_documents.py
└── backend/app/services/document_service.py (if exists)

📝 Key Features:
- Document upload to Azure Blob Storage
- OCR extraction (Emirates ID, Passport)
- Document expiry tracking
- Version control
```

**Document Model** (extract this structure):
```python
class EmployeeDocument(Base):
    __tablename__ = "employee_documents"
    
    id = Column(Integer, primary_key=True)
    employee_id = Column(Integer, ForeignKey("employees.id"))
    document_type = Column(String(50))  # passport, visa, eid, contract
    file_path = Column(String(500))     # Azure Blob URL
    file_name = Column(String(255))
    file_size = Column(Integer)
    mime_type = Column(String(100))
    
    # OCR extracted data
    ocr_data = Column(JSON)  # Store extracted fields
    
    # Metadata
    upload_date = Column(DateTime, default=datetime.utcnow)
    expiry_date = Column(Date)
    verification_status = Column(String(20))  # pending, verified, rejected
    verified_by = Column(Integer, ForeignKey("employees.id"))
    verified_at = Column(DateTime)
```

**Azure Blob Integration** (extract this):
```python
from azure.storage.blob import BlobServiceClient

async def upload_to_azure_blob(file, container_name, filename):
    """Upload file to Azure Blob Storage"""
    connection_string = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
    blob_service = BlobServiceClient.from_connection_string(connection_string)
    
    blob_client = blob_service.get_blob_client(
        container=container_name, 
        blob=filename
    )
    
    blob_client.upload_blob(file, overwrite=True)
    return blob_client.url
```

**OCR Patterns** (extract these):
```python
import re

OCR_PATTERNS = {
    'emirates_id': r'784-\d{4}-\d{7}-\d{1}',
    'passport': r'[A-Z]{2}\d{7}',
    'visa_number': r'\d{10,12}'
}

def extract_document_data(ocr_text, document_type):
    """Extract structured data from OCR text"""
    if document_type == 'emirates_id':
        eid_match = re.search(OCR_PATTERNS['emirates_id'], ocr_text)
        return {'eid_number': eid_match.group(0) if eid_match else None}
    # Add more patterns...
```

**Integration Steps**:
1. Add document table to your schema
2. Configure Azure Blob Storage container
3. Copy document upload endpoint
4. Implement OCR extraction (use Azure Form Recognizer)
5. Add document list view to frontend
6. Create upload modal/form

**Estimated Time**: 6-8 hours

---

### Priority 3: Attendance Tracking ⭐⭐⭐⭐

**Why Extract This**: Clock in/out, work location, monthly timesheets

#### Files to Copy

**Backend**:
```
✅ Copy These Files:
├── backend/app/models/attendance.py
└── backend/app/routers/attendance.py

📝 Core Features:
- Clock in/out with timestamp
- Work location (Office, WFH, Client site)
- GPS coordinates (optional)
- Monthly timesheet view
- Overtime calculation
```

**Attendance Model** (extract this):
```python
class Attendance(Base):
    __tablename__ = "attendance"
    
    id = Column(Integer, primary_key=True)
    employee_id = Column(Integer, ForeignKey("employees.id"))
    date = Column(Date, nullable=False)
    
    clock_in = Column(DateTime)
    clock_out = Column(DateTime)
    
    work_location = Column(String(50))  # Office, WFH, Client, Travel
    location_coordinates = Column(String(100))  # GPS if needed
    
    total_hours = Column(Numeric(5, 2))
    overtime_hours = Column(Numeric(5, 2))
    
    notes = Column(Text)
    status = Column(String(20))  # present, absent, half_day, leave
```

**API Endpoints** (extract these patterns):
```python
@router.post("/clock-in")
async def clock_in(employee_id: int, location: str):
    """Clock in for the day"""
    attendance = Attendance(
        employee_id=employee_id,
        date=date.today(),
        clock_in=datetime.now(),
        work_location=location
    )
    # Save to database
    return {"status": "clocked_in", "time": attendance.clock_in}

@router.post("/clock-out")
async def clock_out(employee_id: int):
    """Clock out and calculate hours"""
    # Find today's attendance record
    # Set clock_out time
    # Calculate total_hours
    return {"status": "clocked_out", "hours": total_hours}
```

**Frontend Component** (extract pattern):
```typescript
// Attendance Clock Widget
const AttendanceClock = () => {
  const [isClockedIn, setIsClockedIn] = useState(false);
  
  const handleClockIn = async (location: string) => {
    await api.post('/attendance/clock-in', { location });
    setIsClockedIn(true);
  };
  
  const handleClockOut = async () => {
    await api.post('/attendance/clock-out');
    setIsClockedIn(false);
  };
  
  return (
    <div>
      {!isClockedIn ? (
        <button onClick={() => handleClockIn('Office')}>Clock In</button>
      ) : (
        <button onClick={handleClockOut}>Clock Out</button>
      )}
    </div>
  );
};
```

**Integration Steps**:
1. Add attendance table
2. Copy attendance model and router
3. Create clock in/out endpoints
4. Add attendance widget to employee dashboard
5. Create monthly timesheet view

**Estimated Time**: 4-5 hours

---

### Priority 4: Bank Details with Approval Workflow ⭐⭐⭐⭐

**Why Extract This**: WPS compliance, approval workflow, change tracking

#### Files to Copy

```
✅ Backend Files:
├── backend/app/models/employee_bank.py
└── backend/app/routers/employee_bank.py

📝 Key Feature: Approval workflow for bank changes
```

**Bank Model** (extract this approval pattern):
```python
class EmployeeBank(Base):
    __tablename__ = "employee_bank"
    
    id = Column(Integer, primary_key=True)
    employee_id = Column(Integer, ForeignKey("employees.id"))
    
    # Current/approved details
    bank_name = Column(String(100))
    account_number = Column(String(50))
    iban = Column(String(34))
    swift_code = Column(String(11))
    
    # Pending changes (JSON for new values)
    pending_changes = Column(JSON)
    
    # Approval workflow
    approval_status = Column(String(20))  # pending, approved, rejected
    requested_at = Column(DateTime)
    approved_by = Column(Integer, ForeignKey("employees.id"))
    approved_at = Column(DateTime)
    rejection_reason = Column(Text)
```

**Approval Workflow** (extract this logic):
```python
@router.post("/bank-details/request-change")
async def request_bank_change(
    employee_id: int, 
    new_bank_name: str,
    new_iban: str
):
    """Employee requests bank details change"""
    bank_record = get_employee_bank(employee_id)
    
    bank_record.pending_changes = {
        'bank_name': new_bank_name,
        'iban': new_iban,
        'requested_at': datetime.now().isoformat()
    }
    bank_record.approval_status = 'pending'
    
    # Notify HR for approval
    return {"status": "pending_approval"}

@router.post("/bank-details/approve")
async def approve_bank_change(
    employee_id: int, 
    approver_id: int
):
    """HR approves bank details change"""
    bank_record = get_employee_bank(employee_id)
    
    # Apply pending changes
    bank_record.bank_name = bank_record.pending_changes['bank_name']
    bank_record.iban = bank_record.pending_changes['iban']
    bank_record.approval_status = 'approved'
    bank_record.approved_by = approver_id
    bank_record.approved_at = datetime.now()
    bank_record.pending_changes = None
    
    return {"status": "approved"}
```

**Integration Steps**:
1. Add employee_bank table
2. Copy bank model with approval fields
3. Implement request/approve endpoints
4. Add bank details form to employee profile
5. Add approval queue to HR dashboard

**Estimated Time**: 3-4 hours

---

### Priority 5: Recruitment (ATS) System ⭐⭐⭐

**Why Extract This**: Full applicant tracking, multi-entity support

#### Files to Copy

```
✅ Backend Files:
├── backend/app/models/recruitment.py  (RecruitmentRequest, Candidate)
└── backend/app/routers/recruitment.py

✅ Frontend Files:
├── frontend/src/components/Recruitment/
│   ├── JobRequisitionList.tsx
│   ├── CandidateProfile.tsx
│   └── CandidatePipeline.tsx
```

**Recruitment Models** (extract these):
```python
class RecruitmentRequest(Base):
    """Job opening/requisition"""
    __tablename__ = "recruitment_requests"
    
    id = Column(Integer, primary_key=True)
    request_number = Column(String(50), unique=True)  # REQ-YYYYMMDD-XXXX
    position_title = Column(String(200))
    department = Column(String(100))
    employment_type = Column(String(50))  # Full-time, Contract
    salary_range_min = Column(Numeric(10, 2))
    salary_range_max = Column(Numeric(10, 2))
    status = Column(String(50))  # pending, approved, filled
    
class Candidate(Base):
    """Candidate profile"""
    __tablename__ = "candidates"
    
    id = Column(Integer, primary_key=True)
    candidate_number = Column(String(50), unique=True)  # CAN-YYYYMMDD-XXXX
    recruitment_request_id = Column(Integer, ForeignKey("recruitment_requests.id"))
    
    full_name = Column(String(200))
    email = Column(String(255))
    phone = Column(String(50))
    
    # Resume
    resume_path = Column(String(500))  # Azure Blob URL
    linkedin_url = Column(String(500))
    
    # Stage tracking
    stage = Column(String(50))  # applied, screening, interview, offer, hired
    status = Column(String(50))  # active, rejected, hired
    
    # Evaluation
    skills_evaluation = Column(JSON)  # Ratings 1-5
    notes = Column(Text)
```

**Integration Steps**:
1. Add recruitment tables
2. Copy recruitment models and endpoints
3. Create job requisition form
4. Create candidate profile page
5. Add pipeline view (Kanban board)
6. Integrate CV storage with Azure Blob

**Estimated Time**: 8-10 hours

---

### Priority 6: Pass Generation ⭐⭐⭐

**Why Extract This**: Access passes, QR codes, expiry management

#### Files to Copy

```
✅ Backend Files:
├── backend/app/models/passes.py
└── backend/app/routers/passes.py

✅ Frontend Files:
└── frontend/src/components/BasePass/
```

**Pass Model** (extract this):
```python
class Pass(Base):
    __tablename__ = "passes"
    
    id = Column(Integer, primary_key=True)
    pass_number = Column(String(50), unique=True)
    pass_type = Column(String(50))  # employee, candidate, visitor
    
    # Holder info
    holder_name = Column(String(200))
    holder_email = Column(String(255))
    holder_photo = Column(String(500))
    
    # Validity
    valid_from = Column(Date)
    valid_until = Column(Date)
    status = Column(String(20))  # active, expired, revoked
    
    # QR code
    qr_code_data = Column(Text)
```

**Integration Steps**:
1. Add passes table
2. Copy pass generation logic
3. Integrate QR code library
4. Create pass display component

**Estimated Time**: 4-5 hours

---

## 🔧 Integration Patterns

### Pattern 1: Add New Table to Existing Schema

```bash
# 1. Create Alembic migration
cd backend
alembic revision -m "Add compliance tracking"

# 2. Edit migration file
# backend/alembic/versions/xxxx_add_compliance_tracking.py
def upgrade():
    op.create_table(
        'employee_compliance',
        # ... columns from model
    )

# 3. Run migration
alembic upgrade head
```

### Pattern 2: Add New Router to Existing API

```python
# backend/app/main.py
from app.routers import compliance

app = FastAPI()

# Add new router
app.include_router(compliance.router, prefix="/api/compliance", tags=["compliance"])
```

### Pattern 3: Integrate Frontend Component

```typescript
// In your existing React app
import ComplianceAlerts from './components/Compliance/ComplianceAlerts';

// Add to your admin dashboard
<AdminDashboard>
  <ComplianceAlerts />
</AdminDashboard>
```

---

## 📋 Feature Extraction Checklist

### Before Extracting Any Feature:

- [ ] Review feature code in this repo
- [ ] Understand database dependencies
- [ ] Check API dependencies
- [ ] Identify frontend components
- [ ] Plan integration points in your app

### Extraction Process:

- [ ] Copy model file to your models folder
- [ ] Create database migration
- [ ] Run migration on dev database
- [ ] Copy router/service files
- [ ] Update imports and paths
- [ ] Add router to main.py
- [ ] Test API endpoints
- [ ] Copy frontend components
- [ ] Update API URLs
- [ ] Test in browser
- [ ] Deploy to staging
- [ ] Test end-to-end
- [ ] Deploy to production

---

## 🎯 Recommended Extraction Order

**Week 1**: UAE Compliance + Document Management  
**Week 2**: Attendance Tracking  
**Week 3**: Bank Details Approval  
**Week 4**: Recruitment System (if needed)  
**Week 5**: Pass Generation (if needed)

---

## 🚨 Common Pitfalls

### Pitfall 1: Foreign Key Mismatches
**Problem**: This repo uses `employee_id` (string), yours might use `id` (integer)  
**Solution**: Update all foreign key references during extraction

### Pitfall 2: API Path Conflicts
**Problem**: Your app already has `/api/documents`, this repo also has it  
**Solution**: Rename routes to avoid conflicts (e.g., `/api/employee-documents`)

### Pitfall 3: Database Column Name Differences
**Problem**: Column names don't match (e.g., `full_name` vs `name`)  
**Solution**: Use Alembic to align schemas or update model mappings

### Pitfall 4: Authentication Differences
**Problem**: This repo uses JWT, yours might use Azure AD  
**Solution**: Keep your auth system, just add authorization checks to new endpoints

---

## 💡 Quick Wins (Extract These First)

### 1. Compliance Alert Logic (1 hour)
Just copy the alert threshold logic and SQL query - no schema changes needed

### 2. Document OCR Patterns (30 minutes)
Copy regex patterns for Emirates ID, passport extraction

### 3. Attendance Calculation (1 hour)
Copy the hours calculation logic for overtime

### 4. Bank Approval Workflow (2 hours)
Copy the approval state machine logic

---

## 📞 Next Steps

1. **Start with**: Review AZURE_NAVIGATION.md to understand this repo
2. **Pick one feature**: Choose from Priority 1-6 above
3. **Extract files**: Follow the "Files to Copy" section
4. **Test locally**: Ensure feature works in isolation
5. **Integrate**: Add to your Azure-Deployment-HR-Portal
6. **Deploy**: Test in staging, then production

---

**Remember**: You're cherry-picking features, not migrating the entire app. Take what you need, leave what you don't.

---

*Last Updated: January 21, 2026*
