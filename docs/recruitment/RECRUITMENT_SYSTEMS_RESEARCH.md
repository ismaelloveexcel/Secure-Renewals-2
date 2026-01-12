# Recruitment Systems Research & Recommendation

**For:** Secure Renewals HR Portal  
**Prepared for:** Solo HR Operations  
**Date:** January 2026  
**Purpose:** Identify and recommend open-source recruitment system for internal integration

---

## Executive Summary

Based on your requirements for a **solo HR recruitment workflow** with pass-based candidate and hiring manager interfaces, this document evaluates open-source recruitment systems available on GitHub that can be integrated **internally** (not as external services).

### Key Requirements
✅ Admin creates recruitment requests  
✅ Source and track candidates  
✅ Generate recruitment passes for hiring managers  
✅ Generate candidate passes  
✅ Interview setup and availability matching  
✅ Screen/shortlist candidates  
✅ Interview evaluation capture  
✅ Candidate finalization  
✅ Linked fields between manager and candidate passes  
✅ Lightweight - suitable for solo HR  

### Recommended Solution
**🎯 Custom Lightweight ATS Built on Your Existing Stack**

After evaluating available GitHub projects, the best approach is to **build a lightweight custom recruitment module** using your existing FastAPI + React infrastructure rather than integrating a heavy external ATS. Here's why:

1. **You already have 80% of infrastructure needed** (passes, auth, database, UI)
2. **External systems are too complex** for solo HR (OpenCATS, Odoo require separate deployment/maintenance)
3. **Your pass system is unique** - external ATS don't support this workflow
4. **Faster to build** than integrate and customize existing systems

**However**, we'll leverage specific open-source components for key features.

---

## Open-Source Recruitment Systems Analysis

### 1. OpenCATS (Open Source Applicant Tracking System)
- **Repository:** `opencats/OpenCATS`
- **Stars:** 1.5k+ | **Language:** PHP
- **Last Update:** Active (2024)

#### Pros
✅ Complete ATS functionality  
✅ Resume parsing  
✅ Job postings  
✅ Candidate pipeline  
✅ Interview scheduling  
✅ Email integration  

#### Cons
❌ PHP-based (requires separate LAMP stack)  
❌ Heavy deployment (not lightweight)  
❌ Legacy UI (not modern)  
❌ No pass system support  
❌ Complex for solo HR  
❌ Would require dual-system maintenance  

#### Integration Effort
**High:** 4-6 weeks (separate deployment, database sync, UI bridging)

#### Recommendation for Your Use Case
**❌ Not Recommended** - Too heavy, different tech stack, doesn't support your pass workflow

---

### 2. Twenty CRM (adapted for recruitment)
- **Repository:** `twentyhq/twenty`
- **Stars:** 15k+ | **Language:** TypeScript/React/GraphQL
- **Last Update:** Very Active (Daily commits)

#### Pros
✅ Modern UI (React-based)  
✅ GraphQL API  
✅ Customizable objects  
✅ Can model candidates as contacts  
✅ Pipeline/Kanban views  
✅ Self-hosted  

#### Cons
❌ It's a CRM, not an ATS (requires heavy customization)  
❌ Separate deployment required  
❌ GraphQL learning curve  
❌ No recruitment-specific features  
❌ No pass system  
❌ Overkill for solo HR  

#### Integration Effort
**Medium-High:** 3-5 weeks (deployment, schema customization, API integration)

#### Recommendation for Your Use Case
**❌ Not Recommended** - General CRM that needs extensive customization, separate deployment burden

---

### 3. Jobberbase
- **Repository:** `jobberbase/jobberbase`
- **Stars:** 300+ | **Language:** PHP
- **Last Update:** 2020 (Inactive)

#### Pros
✅ Simple job board  
✅ Lightweight  

#### Cons
❌ Unmaintained (last update 2020)  
❌ No ATS features  
❌ Just a job board  
❌ PHP-based  

#### Recommendation for Your Use Case
**❌ Not Recommended** - Inactive project, too basic

---

### 4. Recruit CRM (Not fully open source)
- **Repository:** Proprietary with open components
- **Type:** Commercial SaaS

#### Recommendation for Your Use Case
**❌ Not Recommended** - Not free, not open source, external dependency

---

### 5. Odoo HR Recruitment Module
- **Repository:** `odoo/odoo`
- **Stars:** 35k+ | **Language:** Python
- **Module:** HR Recruitment

#### Pros
✅ Python-based (matches your stack)  
✅ Complete recruitment module  
✅ Job positions  
✅ Applications tracking  
✅ Interview scheduling  
✅ Evaluation forms  

#### Cons
❌ Entire Odoo framework required (massive)  
❌ Complex deployment  
❌ Heavy resource usage  
❌ Steep learning curve  
❌ No pass system  
❌ Overkill for solo HR  

#### Integration Effort
**Very High:** 8-12 weeks (full Odoo deployment, module configuration, SSO integration)

#### Recommendation for Your Use Case
**❌ Not Recommended** - Far too heavy for solo HR operations

---

### 6. Component-Based Approach (Recommended)
Instead of a monolithic ATS, use specialized open-source components:

| Component | GitHub Project | Purpose | Integration |
|-----------|---------------|---------|-------------|
| **Interview Scheduling** | `calcom/cal.com` | Match manager availability with candidate slots | REST API |
| **Resume Parsing** | `omniparser` or `pyresparser` | Extract data from resumes | Python library |
| **Document Generation** | `pdfme/pdfme` | Generate offer letters | JS library |
| **Kanban Board** | Build native in React | Candidate pipeline visualization | Native |
| **Evaluation Forms** | Build native | Interview evaluation capture | Native |

---

## Recommended Solution: Custom Lightweight ATS

### Why Build Instead of Integrate?

1. **You already have core infrastructure:**
   - ✅ Database (PostgreSQL)
   - ✅ API (FastAPI)
   - ✅ Frontend (React)
   - ✅ Authentication
   - ✅ Pass system (unique requirement)

2. **Your workflow is unique:**
   - Pass-based system (manager pass + candidate pass)
   - Linked fields between passes
   - Solo HR operations focus
   - No external ATS supports this

3. **Faster time to market:**
   - Build: 2-3 weeks
   - Integrate external ATS: 4-8 weeks + ongoing maintenance

4. **Lower complexity:**
   - Single codebase
   - Single deployment
   - Single database
   - Your team already understands the stack

### Architecture: Modular Recruitment System

```
backend/
├── app/
│   ├── models/
│   │   ├── recruitment_request.py      # NEW: Job requisitions
│   │   ├── candidate.py                # NEW: Candidate profiles
│   │   ├── interview.py                # NEW: Interview scheduling
│   │   ├── evaluation.py               # NEW: Interview evaluations
│   │   └── passes.py                   # EXISTING: Already supports recruitment passes
│   ├── routers/
│   │   └── recruitment.py              # NEW: Recruitment endpoints
│   ├── services/
│   │   └── recruitment.py              # NEW: Business logic
│   └── schemas/
│       └── recruitment.py              # NEW: Pydantic schemas

frontend/
├── src/
│   ├── pages/
│   │   ├── RecruitmentDashboard.tsx    # NEW: Admin recruitment view
│   │   ├── HiringManagerPass.tsx       # NEW: Manager pass interface
│   │   └── CandidatePass.tsx           # NEW: Candidate pass interface
│   └── components/
│       ├── CandidatePipeline.tsx       # NEW: Kanban board
│       └── InterviewScheduler.tsx      # NEW: Availability matching
```

---

## Implementation Plan: Phase-by-Phase

### Phase 1: Core Recruitment Models (Week 1)
**Goal:** Database schema and basic CRUD

**Tasks:**
1. Create database models:
   - `RecruitmentRequest` (job requisition)
   - `Candidate` (candidate profile)
   - `Interview` (interview scheduling)
   - `Evaluation` (interview feedback)

2. Create Alembic migration

3. Build basic API endpoints (CRUD)

**Deliverables:**
- Database tables created
- Basic API for recruitment entities
- Admin can create recruitment requests

**Time:** 3-5 days

---

### Phase 2: Candidate Pipeline & Sourcing (Week 1-2)
**Goal:** Track candidates through recruitment stages

**Tasks:**
1. Add candidate stages (Applied → Screening → Interview → Offer → Hired)
2. Drag-and-drop pipeline UI (Kanban board)
3. Candidate profile pages
4. Resume upload
5. Sourcing tracking (where candidate came from)

**Deliverables:**
- Visual pipeline board
- Candidate profiles
- Stage transitions
- Sourcing metrics

**Time:** 4-6 days

---

### Phase 3: Hiring Manager Pass (Week 2)
**Goal:** Manager pass showing recruitment status and approvals

**Tasks:**
1. Extend existing `Pass` model with recruitment context
2. Manager pass UI:
   - Position details
   - Approval status (requisition, budget, offer)
   - Pipeline snapshot
   - Candidate list
   - Interview scheduling
3. Link manager pass to recruitment request
4. Next actions block

**Deliverables:**
- Hiring manager pass page
- Approval workflow
- Pipeline visibility

**Time:** 3-4 days

---

### Phase 4: Candidate Pass (Week 2-3)
**Goal:** Candidate pass for tracking application status

**Tasks:**
1. Generate candidate pass on application
2. Candidate pass UI:
   - Application status
   - Stage progress
   - Interview details
   - Next actions (submit docs, confirm interview)
   - HR contact (WhatsApp/email)
3. Auto-update when stages change
4. QR code for candidate pass

**Deliverables:**
- Candidate pass page
- Status tracking
- Communication links

**Time:** 3-4 days

---

### Phase 5: Interview Scheduling & Availability Matching (Week 3)
**Goal:** Manager provides slots, candidate selects preferred time

**Tasks:**
1. Manager enters available time slots
2. Candidate sees available slots on their pass
3. Candidate confirms slot
4. Auto-notification to both parties
5. Calendar integration (optional: Cal.com API)

**Deliverables:**
- Availability entry form
- Slot selection interface
- Confirmation workflow
- Email notifications

**Time:** 4-5 days

**Optional Integration:** Cal.com API for advanced scheduling

---

### Phase 6: Interview Evaluation (Week 3-4)
**Goal:** Capture hiring manager feedback

**Tasks:**
1. Evaluation form builder
2. Manager submits evaluation via pass
3. Store evaluation scores/comments
4. Display evaluation summary on candidate profile
5. Decision workflow (shortlist, reject, offer)

**Deliverables:**
- Evaluation forms
- Feedback capture
- Decision tracking

**Time:** 3-4 days

---

### Phase 7: Candidate Finalization & Offer (Week 4)
**Goal:** Move from offer to onboarding

**Tasks:**
1. Offer generation
2. Offer approval workflow
3. Candidate acceptance/rejection
4. Automatic conversion: Recruitment Pass → Onboarding Pass
5. Link to employee master on hire

**Deliverables:**
- Offer workflow
- Pass transition
- Employee record creation

**Time:** 3-4 days

---

### Phase 8: Future Expansion Support (Documented, Not Built)
**Goal:** Prepare for future features

**Document architecture for:**
1. External recruiters portal (upload candidates directly)
2. Online candidate applications (public job board)
3. Assessment tests integration
4. Bulk candidate import

**Time:** 1 day (documentation only)

---

## Total Implementation Timeline

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| Phase 1: Core Models | 3-5 days | Database & API foundation |
| Phase 2: Pipeline | 4-6 days | Candidate tracking Kanban |
| Phase 3: Manager Pass | 3-4 days | Hiring manager interface |
| Phase 4: Candidate Pass | 3-4 days | Candidate interface |
| Phase 5: Interview Scheduling | 4-5 days | Availability matching |
| Phase 6: Evaluation | 3-4 days | Feedback capture |
| Phase 7: Finalization | 3-4 days | Offer & onboarding handoff |
| Phase 8: Documentation | 1 day | Future expansion guide |

**Total Time:** 24-33 days (3-5 weeks)

---

## Optional Component Integrations

### Interview Scheduling: Cal.com
- **Use Case:** Advanced scheduling with calendar sync
- **Integration:** REST API
- **Effort:** 2-3 days
- **Value:** Calendar integrations (Google/Outlook)

### Resume Parsing: pyresparser
- **Use Case:** Auto-extract data from PDF resumes
- **Integration:** Python library
- **Effort:** 1-2 days
- **Value:** Faster candidate data entry

### Document Generation: pdfme
- **Use Case:** Generate offer letters
- **Integration:** JavaScript library
- **Effort:** 1-2 days
- **Value:** Professional document templates

**Total Optional Integrations:** 4-7 days

---

## Technology Stack (Leveraging Existing)

| Layer | Technology | Status |
|-------|------------|--------|
| **Backend** | FastAPI + SQLAlchemy | ✅ Existing |
| **Database** | PostgreSQL | ✅ Existing |
| **Frontend** | React + TypeScript | ✅ Existing |
| **Styling** | TailwindCSS | ✅ Existing |
| **Auth** | JWT (existing system) | ✅ Existing |
| **Notifications** | Email (to be added) | 🆕 New |
| **File Storage** | Local/S3 (to be added) | 🆕 New |

**New Dependencies:**
```python
# backend/pyproject.toml additions
[project.dependencies]
python-multipart = ">=0.0.9"  # File uploads
pillow = ">=10.0.0"           # Image processing for resume parsing (optional)
```

```json
// frontend/package.json additions
{
  "dependencies": {
    "@dnd-kit/core": "^6.1.0",        // Drag-and-drop for Kanban
    "@dnd-kit/sortable": "^8.0.0",    // Sortable lists
    "react-big-calendar": "^1.11.0"    // Calendar view (optional)
  }
}
```

---

## Database Schema Design

### recruitment_requests Table
```sql
CREATE TABLE recruitment_requests (
    id SERIAL PRIMARY KEY,
    request_number VARCHAR(50) UNIQUE NOT NULL,
    position_title VARCHAR(200) NOT NULL,
    department VARCHAR(100) NOT NULL,
    hiring_manager_id VARCHAR(50) REFERENCES employees(employee_id),
    requested_by VARCHAR(50) NOT NULL,
    request_date DATE NOT NULL,
    target_hire_date DATE,
    headcount INTEGER DEFAULT 1,
    employment_type VARCHAR(50), -- Full-time, Contract, Intern
    job_description TEXT,
    requirements TEXT,
    salary_range_min DECIMAL(10,2),
    salary_range_max DECIMAL(10,2),
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected, filled, cancelled
    approval_status JSONB, -- {requisition: {status, approver, date}, budget: {...}, offer: {...}}
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### candidates Table
```sql
CREATE TABLE candidates (
    id SERIAL PRIMARY KEY,
    candidate_number VARCHAR(50) UNIQUE NOT NULL,
    recruitment_request_id INTEGER REFERENCES recruitment_requests(id),
    pass_number VARCHAR(50) REFERENCES passes(pass_number),
    full_name VARCHAR(200) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    current_position VARCHAR(200),
    current_company VARCHAR(200),
    years_experience INTEGER,
    expected_salary DECIMAL(10,2),
    notice_period_days INTEGER,
    source VARCHAR(100), -- LinkedIn, Referral, Agency, Direct Application
    source_details TEXT,
    resume_path VARCHAR(500),
    linkedin_url VARCHAR(500),
    status VARCHAR(50) DEFAULT 'applied', -- applied, screening, interview, offer, hired, rejected
    stage VARCHAR(50) DEFAULT 'applied', -- Pipeline stage
    stage_changed_at TIMESTAMP,
    rejection_reason TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### interviews Table
```sql
CREATE TABLE interviews (
    id SERIAL PRIMARY KEY,
    interview_number VARCHAR(50) UNIQUE NOT NULL,
    candidate_id INTEGER REFERENCES candidates(id),
    recruitment_request_id INTEGER REFERENCES recruitment_requests(id),
    interview_type VARCHAR(50), -- phone_screen, technical, hr, manager, panel
    interview_round INTEGER DEFAULT 1,
    
    -- Availability slots from hiring manager
    available_slots JSONB, -- [{start: "2024-01-15T10:00:00", end: "2024-01-15T11:00:00"}, ...]
    
    -- Selected slot by candidate
    scheduled_date TIMESTAMP,
    duration_minutes INTEGER DEFAULT 60,
    
    -- Interview details
    interviewer_ids TEXT[], -- Array of employee IDs
    location VARCHAR(200), -- Office, Video Call, Phone
    meeting_link VARCHAR(500),
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- pending_availability, slots_provided, scheduled, completed, cancelled
    confirmed_by_candidate BOOLEAN DEFAULT FALSE,
    confirmed_at TIMESTAMP,
    
    -- Follow-up
    completed_at TIMESTAMP,
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### evaluations Table
```sql
CREATE TABLE evaluations (
    id SERIAL PRIMARY KEY,
    evaluation_number VARCHAR(50) UNIQUE NOT NULL,
    interview_id INTEGER REFERENCES interviews(id),
    candidate_id INTEGER REFERENCES candidates(id),
    evaluator_id VARCHAR(50) NOT NULL, -- Employee who conducted evaluation
    
    -- Evaluation criteria (customizable)
    technical_skills_score INTEGER CHECK (technical_skills_score BETWEEN 1 AND 5),
    communication_score INTEGER CHECK (communication_score BETWEEN 1 AND 5),
    cultural_fit_score INTEGER CHECK (cultural_fit_score BETWEEN 1 AND 5),
    overall_score INTEGER CHECK (overall_score BETWEEN 1 AND 5),
    
    -- Feedback
    strengths TEXT,
    concerns TEXT,
    additional_comments TEXT,
    
    -- Decision
    recommendation VARCHAR(50), -- strong_hire, hire, maybe, no_hire
    next_steps TEXT,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Link to Existing passes Table
The existing `passes` table already supports recruitment passes. We'll use:
- `pass_type = 'recruitment'` for candidate passes
- `pass_type = 'manager'` for hiring manager passes (new type to add to PASS_TYPES)

**Enhancement needed:**
```python
# app/models/passes.py - Add manager pass type
PASS_TYPES = [
    {"key": "recruitment", "name": "Recruitment Pass", "description": "For candidates attending interviews"},
    {"key": "manager", "name": "Manager Pass", "description": "For hiring managers tracking recruitment"},  # NEW
    {"key": "onboarding", "name": "Onboarding Pass", "description": "For new employees during onboarding period"},
    # ... rest
]
```

---

## API Endpoints Design

### Recruitment Requests
```
GET    /api/recruitment/requests              - List all recruitment requests
POST   /api/recruitment/requests              - Create new recruitment request
GET    /api/recruitment/requests/{id}         - Get request details
PATCH  /api/recruitment/requests/{id}         - Update request
POST   /api/recruitment/requests/{id}/approve - Approve request (requisition/budget/offer)
DELETE /api/recruitment/requests/{id}         - Cancel request
```

### Candidates
```
GET    /api/recruitment/candidates            - List all candidates
POST   /api/recruitment/candidates            - Add new candidate
GET    /api/recruitment/candidates/{id}       - Get candidate details
PATCH  /api/recruitment/candidates/{id}       - Update candidate
POST   /api/recruitment/candidates/{id}/stage - Move to next stage
POST   /api/recruitment/candidates/{id}/reject - Reject candidate
POST   /api/recruitment/candidates/{id}/hire  - Convert to employee
GET    /api/recruitment/candidates/{id}/timeline - Get candidate journey timeline
```

### Interviews
```
GET    /api/recruitment/interviews            - List interviews
POST   /api/recruitment/interviews            - Schedule new interview
GET    /api/recruitment/interviews/{id}       - Get interview details
PATCH  /api/recruitment/interviews/{id}       - Update interview
POST   /api/recruitment/interviews/{id}/slots - Manager provides availability slots
POST   /api/recruitment/interviews/{id}/confirm - Candidate confirms slot
POST   /api/recruitment/interviews/{id}/complete - Mark interview complete
```

### Evaluations
```
GET    /api/recruitment/evaluations           - List evaluations
POST   /api/recruitment/evaluations           - Submit evaluation
GET    /api/recruitment/evaluations/{id}      - Get evaluation details
GET    /api/recruitment/candidates/{id}/evaluations - Get all evaluations for candidate
```

### Pass Interfaces
```
GET    /api/recruitment/pass/manager/{pass_number}    - Get manager pass data
GET    /api/recruitment/pass/candidate/{pass_number}  - Get candidate pass data
```

---

## Frontend Component Structure

### Admin Dashboard
```
/recruitment/dashboard
├── Recruitment Metrics (open positions, candidates in pipeline, interviews scheduled)
├── Active Recruitment Requests (table)
├── Recent Candidates (list)
└── Quick Actions (create request, add candidate, schedule interview)
```

### Candidate Pipeline (Kanban Board)
```
/recruitment/pipeline
├── Columns: Applied | Screening | Interview | Offer | Hired
├── Candidate Cards (drag-and-drop)
├── Filters (position, source, date range)
└── Search
```

### Hiring Manager Pass
```
/recruitment/pass/manager/{pass_number}
├── Header (manager info, QR code, position details)
├── Approvals Block (requisition, budget, offer status)
├── Pipeline Snapshot (stage counts with colors)
├── Candidate List (with scores and recommendations)
├── Interview Scheduling (provide availability)
└── Next Actions (approve items, review candidates, conduct interviews)
```

### Candidate Pass
```
/recruitment/pass/candidate/{pass_number}
├── Header (candidate info, QR code, position details, current stage)
├── Application Progress (stage tracker)
├── Interview Details (scheduled interviews, select time slots)
├── Document Upload (resume, certificates)
├── Next Actions (submit documents, confirm interview, accept/reject offer)
└── HR Contact (WhatsApp, Email)
```

---

## Security Considerations

1. **Pass Access Control:**
   - Manager passes: Only assigned hiring manager + HR
   - Candidate passes: Candidate (via unique token) + HR

2. **Data Privacy:**
   - Candidate PII encrypted at rest
   - Resume files stored securely (S3 with signed URLs)
   - Evaluation data restricted to HR and hiring manager

3. **Audit Trail:**
   - Log all stage changes
   - Track who moved candidate to each stage
   - Record all evaluation submissions

4. **Email Security:**
   - Don't expose candidate emails in URLs
   - Use secure tokens for candidate pass access
   - Rate limit candidate actions

---

## Advantages Over External ATS

| Aspect | Custom Solution | External ATS (OpenCATS/Odoo) |
|--------|----------------|------------------------------|
| **Deployment** | Single deployment | Dual deployment |
| **Maintenance** | One codebase | Two codebases to maintain |
| **Tech Stack** | Unified (FastAPI/React) | Mixed (PHP/Python + yours) |
| **Pass System** | Native support | Not supported |
| **Solo HR Focus** | Designed for it | Designed for enterprises |
| **Customization** | Full control | Limited |
| **Time to Launch** | 3-5 weeks | 6-12 weeks |
| **Learning Curve** | Team already knows stack | New system to learn |
| **Cost** | $0 (dev time only) | $0 but higher total cost |

---

## Future Expansion Architecture

### Phase 2 Features (Documented for Future)

1. **External Recruiter Portal**
   ```
   /recruitment/external/login
   ├── Agency/freelancer login
   ├── Assigned positions
   ├── Upload candidates directly
   └── Commission tracking
   ```

2. **Public Job Board**
   ```
   /careers (public)
   ├── Open positions
   ├── Apply online form
   ├── Resume upload
   └── Application tracking link
   ```

3. **Assessment Tests**
   ```
   Integration with testing platforms:
   - HackerRank API (technical tests)
   - Personality assessments
   - Skills tests
   ```

4. **Bulk Candidate Import**
   ```
   CSV import for:
   - Multiple candidates at once
   - Recruitment fairs
   - Database transfers
   ```

---

## Comparison: Build vs Buy/Integrate

### If You Build (Recommended)

**Pros:**
- ✅ Perfect fit for your unique workflow
- ✅ Single codebase, single deployment
- ✅ Team already knows the stack
- ✅ Pass system native support
- ✅ Faster time to launch (3-5 weeks)
- ✅ No additional infrastructure
- ✅ Full customization freedom
- ✅ Lower long-term maintenance

**Cons:**
- ⚠️ Initial development time (3-5 weeks)
- ⚠️ Need to build features from scratch
- ⚠️ No out-of-box advanced features

**Total Effort:** 3-5 weeks development

---

### If You Integrate OpenCATS

**Pros:**
- ✅ Complete ATS out of the box
- ✅ Resume parsing included
- ✅ Mature system

**Cons:**
- ❌ PHP stack (LAMP required)
- ❌ Separate deployment
- ❌ No pass system support
- ❌ Needs heavy customization for your workflow
- ❌ Database sync complexity
- ❌ Dual maintenance burden
- ❌ Legacy UI

**Total Effort:** 6-8 weeks integration + ongoing maintenance overhead

---

### If You Integrate Twenty CRM

**Pros:**
- ✅ Modern tech stack (TypeScript/React)
- ✅ Good UI/UX
- ✅ GraphQL API

**Cons:**
- ❌ It's a CRM, not an ATS
- ❌ Separate deployment
- ❌ Heavy customization needed
- ❌ GraphQL learning curve
- ❌ No recruitment-specific features
- ❌ No pass system support

**Total Effort:** 5-7 weeks integration + customization

---

### If You Integrate Odoo Recruitment

**Pros:**
- ✅ Python-based
- ✅ Complete recruitment module
- ✅ Enterprise features

**Cons:**
- ❌ Entire Odoo framework required (massive)
- ❌ Very heavy resource usage
- ❌ Complex deployment
- ❌ Steep learning curve
- ❌ No pass system
- ❌ Overkill for solo HR

**Total Effort:** 10-14 weeks deployment + configuration

---

## Final Recommendation

### 🎯 Build Custom Lightweight ATS

**Rationale:**
1. Your pass-based workflow is unique - no external system supports it
2. You already have 80% of infrastructure (database, API, UI, auth)
3. Building is faster than integrating (3-5 weeks vs 6-12 weeks)
4. Single codebase = lower maintenance
5. Perfect fit for solo HR operations
6. Full control over features and UX

**Optional Component Integrations:**
- **Cal.com API** for advanced interview scheduling (2-3 days)
- **pyresparser** for resume parsing (1-2 days)
- **pdfme** for document generation (1-2 days)

**Total Time:** 3-5 weeks core + 4-7 days optional integrations = **4-6 weeks total**

**Total Cost:** $0 (development time only, no licensing, no additional infrastructure)

---

## Next Steps

1. **Review and approve this recommendation**
2. **Prioritize which phases to implement first**
3. **Start with Phase 1: Core Models** (database schema)
4. **Implement incrementally** (1 phase per week)
5. **Get HR feedback after each phase**
6. **Iterate based on real usage**

---

## Questions for Clarification

Before starting implementation, please confirm:

1. **Priority order:** Which pass is more critical first - Manager or Candidate?
2. **Interview types:** How many interview rounds typically? (phone screen, technical, manager, panel?)
3. **Evaluation criteria:** What specific skills/attributes do you evaluate? (for evaluation forms)
4. **Approval workflow:** Who approves requisitions, budgets, and offers?
5. **Sourcing categories:** What candidate sources do you track? (LinkedIn, agencies, referrals, etc.)
6. **External recruiters:** Timeline for adding agency portal? (future or soon?)
7. **Public job board:** Timeline for candidate applications? (future or soon?)

---

## Conclusion

After thorough analysis of open-source recruitment systems on GitHub, **building a custom lightweight ATS** on your existing infrastructure is the optimal solution for solo HR operations with your unique pass-based workflow.

External systems like OpenCATS, Twenty CRM, and Odoo are either:
- Too heavy for solo operations
- Different tech stacks requiring separate deployment
- Don't support your pass system
- Take longer to integrate than to build from scratch

The recommended approach leverages your existing FastAPI + React stack, integrates seamlessly with your pass system, and can be built in **3-5 weeks** with optional component integrations for advanced features.

This document provides the complete architecture, database schema, API design, and implementation phases to guide development.

---

**Document Status:** ✅ Complete - Ready for Review  
**Next Action:** Await approval to begin Phase 1 implementation
