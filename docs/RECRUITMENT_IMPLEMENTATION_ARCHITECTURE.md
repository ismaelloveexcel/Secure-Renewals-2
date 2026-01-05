# Recruitment Module Implementation Architecture

**For:** Secure Renewals HR Portal  
**Date:** January 2026  
**Purpose:** Technical architecture for custom lightweight ATS implementation

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React + TypeScript)                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │ Admin Dashboard  │  │ Manager Pass     │  │ Candidate Pass   │  │
│  │                  │  │                  │  │                  │  │
│  │ - Metrics        │  │ - Position Info  │  │ - Status Track   │  │
│  │ - Requests List  │  │ - Approvals      │  │ - Interview Slots│  │
│  │ - Quick Actions  │  │ - Pipeline View  │  │ - Next Actions   │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ Candidate Pipeline (Kanban Board)                              │ │
│  │                                                                 │ │
│  │ [Applied] → [Screening] → [Interview] → [Offer] → [Hired]    │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ Interview Scheduler                                             │ │
│  │ - Manager: Provide availability slots                          │ │
│  │ - Candidate: Select preferred slot                             │ │
│  │ - Auto-confirmation & notifications                            │ │
│  └────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ REST API (JSON)
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          BACKEND (FastAPI + Python)                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  API Routers                                                         │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ /api/recruitment/requests    - Recruitment request CRUD      │   │
│  │ /api/recruitment/candidates  - Candidate management          │   │
│  │ /api/recruitment/interviews  - Interview scheduling          │   │
│  │ /api/recruitment/evaluations - Interview evaluations         │   │
│  │ /api/recruitment/pass/*      - Pass-specific endpoints       │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  Business Logic (Services)                                           │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ RecruitmentService                                            │   │
│  │ - create_request()                                            │   │
│  │ - approve_request()                                           │   │
│  │ - track_candidate_stage()                                     │   │
│  │                                                               │   │
│  │ CandidateService                                              │   │
│  │ - add_candidate()                                             │   │
│  │ - move_to_stage()                                             │   │
│  │ - generate_candidate_pass()                                   │   │
│  │                                                               │   │
│  │ InterviewService                                              │   │
│  │ - schedule_interview()                                        │   │
│  │ - match_availability()                                        │   │
│  │ - confirm_slot()                                              │   │
│  │                                                               │   │
│  │ EvaluationService                                             │   │
│  │ - submit_evaluation()                                         │   │
│  │ - calculate_scores()                                          │   │
│  │ - get_recommendations()                                       │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  Data Access (Repositories)                                          │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ - RecruitmentRequestRepository                                │   │
│  │ - CandidateRepository                                         │   │
│  │ - InterviewRepository                                         │   │
│  │ - EvaluationRepository                                        │   │
│  │ - PassRepository (existing, extended)                        │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ SQLAlchemy ORM
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      DATABASE (PostgreSQL)                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Core Tables                                                         │
│  ┌──────────────────────┐  ┌──────────────────────┐                │
│  │ recruitment_requests │  │ candidates           │                │
│  │                      │  │                      │                │
│  │ - request_number     │  │ - candidate_number   │                │
│  │ - position_title     │  │ - full_name          │                │
│  │ - hiring_manager_id  │  │ - email, phone       │                │
│  │ - status             │  │ - stage              │                │
│  │ - approval_status    │  │ - pass_number (FK)   │                │
│  └──────────────────────┘  └──────────────────────┘                │
│           │                          │                               │
│           └──────────┬───────────────┘                               │
│                      │                                               │
│  ┌──────────────────────┐  ┌──────────────────────┐                │
│  │ interviews           │  │ evaluations          │                │
│  │                      │  │                      │                │
│  │ - interview_number   │  │ - evaluation_number  │                │
│  │ - candidate_id (FK)  │  │ - interview_id (FK)  │                │
│  │ - available_slots    │  │ - evaluator_id       │                │
│  │ - scheduled_date     │  │ - scores             │                │
│  │ - status             │  │ - recommendation     │                │
│  └──────────────────────┘  └──────────────────────┘                │
│                                                                       │
│  Linked to Existing                                                  │
│  ┌──────────────────────┐                                           │
│  │ passes (existing)    │                                           │
│  │                      │                                           │
│  │ - pass_number        │                                           │
│  │ - pass_type          │  (recruitment | manager)                 │
│  │ - full_name          │                                           │
│  │ - status             │                                           │
│  └──────────────────────┘                                           │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### 1. Recruitment Request Creation Flow

```
┌─────────┐
│  Admin  │
└────┬────┘
     │ 1. Creates recruitment request
     ▼
┌─────────────────────────────┐
│ POST /api/recruitment/      │
│      requests               │
└────────────┬────────────────┘
             │
             │ 2. Validates data
             ▼
┌─────────────────────────────┐
│ RecruitmentService          │
│ .create_request()           │
└────────────┬────────────────┘
             │
             │ 3. Generates request_number
             │ 4. Creates database record
             ▼
┌─────────────────────────────┐
│ recruitment_requests table  │
└────────────┬────────────────┘
             │
             │ 5. Triggers pass generation
             ▼
┌─────────────────────────────┐
│ PassService                 │
│ .create_pass(               │
│   type='manager',           │
│   linked_to=request_id      │
│ )                           │
└────────────┬────────────────┘
             │
             │ 6. Creates manager pass
             ▼
┌─────────────────────────────┐
│ passes table                │
│ (pass_type = 'manager')     │
└────────────┬────────────────┘
             │
             │ 7. Notifies hiring manager
             ▼
┌─────────────────────────────┐
│ Email: "New recruitment     │
│ request assigned to you"    │
└─────────────────────────────┘
```

---

### 2. Candidate Addition & Pass Generation Flow

```
┌─────────┐
│ Admin   │
└────┬────┘
     │ 1. Adds candidate to pipeline
     ▼
┌─────────────────────────────┐
│ POST /api/recruitment/      │
│      candidates             │
└────────────┬────────────────┘
             │
             │ 2. Validates candidate data
             ▼
┌─────────────────────────────┐
│ CandidateService            │
│ .add_candidate()            │
└────────────┬────────────────┘
             │
             │ 3. Generates candidate_number
             │ 4. Creates candidate record
             ▼
┌─────────────────────────────┐
│ candidates table            │
│ (status='applied')          │
└────────────┬────────────────┘
             │
             │ 5. Triggers candidate pass
             ▼
┌─────────────────────────────┐
│ PassService                 │
│ .create_pass(               │
│   type='recruitment',       │
│   candidate_id=...          │
│ )                           │
└────────────┬────────────────┘
             │
             │ 6. Creates recruitment pass
             ▼
┌─────────────────────────────┐
│ passes table                │
│ (pass_type = 'recruitment') │
└────────────┬────────────────┘
             │
             │ 7. Updates candidate record
             │    with pass_number
             ▼
┌─────────────────────────────┐
│ candidates.pass_number      │
│ = "REC-20260105-0001"       │
└────────────┬────────────────┘
             │
             │ 8. Sends candidate pass link
             ▼
┌─────────────────────────────┐
│ Email: "Your application    │
│ has been received. Track    │
│ your status: [Pass Link]"   │
└─────────────────────────────┘
```

---

### 3. Interview Scheduling & Availability Matching Flow

```
┌────────────────┐                          ┌──────────────┐
│ Hiring Manager │                          │  Candidate   │
└───────┬────────┘                          └──────┬───────┘
        │                                          │
        │ 1. Provides availability slots           │
        ▼                                          │
┌─────────────────────────────┐                   │
│ POST /api/recruitment/      │                   │
│      interviews/{id}/slots  │                   │
└────────────┬────────────────┘                   │
             │                                     │
             │ 2. Stores available_slots (JSONB)  │
             ▼                                     │
┌─────────────────────────────┐                   │
│ interviews table            │                   │
│ available_slots: [          │                   │
│   {start: "...", end: "..."}, │                 │
│   {start: "...", end: "..."}  │                 │
│ ]                           │                   │
│ status = 'slots_provided'   │                   │
└────────────┬────────────────┘                   │
             │                                     │
             │ 3. Notifies candidate               │
             ▼                                     │
┌─────────────────────────────┐                   │
│ Email: "Please select your  │                   │
│ preferred interview slot"   │                   │
└─────────────────────────────┘                   │
             │                                     │
             │ 4. Candidate accesses pass          │
             ◄─────────────────────────────────────┤
             │                                     │
             │ 5. Shows available slots            │
             ├─────────────────────────────────────►
             │                                     │
             │ 6. Candidate confirms slot          │
             ◄─────────────────────────────────────┤
             │                                     │
             ▼                                     │
┌─────────────────────────────┐                   │
│ POST /api/recruitment/      │                   │
│      interviews/{id}/confirm│                   │
└────────────┬────────────────┘                   │
             │                                     │
             │ 7. Updates interview record         │
             ▼                                     │
┌─────────────────────────────┐                   │
│ interviews table            │                   │
│ scheduled_date = selected   │                   │
│ status = 'scheduled'        │                   │
│ confirmed_by_candidate=true │                   │
└────────────┬────────────────┘                   │
             │                                     │
             │ 8. Notifies both parties            │
             ├──────────────────┬──────────────────┤
             ▼                  ▼                  ▼
┌───────────────────┐  ┌─────────────────────────────┐
│ Manager Email:    │  │ Candidate Email:            │
│ "Interview        │  │ "Your interview is          │
│ scheduled with    │  │ confirmed for [datetime]"   │
│ candidate on..."  │  │                             │
└───────────────────┘  └─────────────────────────────┘
```

---

### 4. Linked Fields Between Manager & Candidate Passes

```
┌────────────────────────────────────────────────────────────┐
│                    RECRUITMENT REQUEST                      │
│                    (id: 123)                                │
└────────────────┬───────────────────────────┬────────────────┘
                 │                           │
                 │                           │
        ┌────────▼────────┐         ┌───────▼────────┐
        │  MANAGER PASS   │         │ CANDIDATE PASS │
        │  (pass_type:    │         │ (pass_type:    │
        │   'manager')    │         │  'recruitment')│
        └────────┬────────┘         └───────┬────────┘
                 │                           │
                 │                           │
    ┌────────────┴────────────┬──────────────┴────────────┐
    │                         │                            │
    ▼                         ▼                            ▼
┌─────────────┐      ┌─────────────────┐      ┌──────────────┐
│ INTERVIEWS  │      │ APPROVAL STATUS │      │ EVALUATIONS  │
│             │      │                 │      │              │
│ - slots     │◄─────┤ - requisition   │      │ - scores     │
│ - scheduled │      │ - budget        │      │ - feedback   │
└─────────────┘      │ - offer         │      └──────────────┘
                     └─────────────────┘

┌──────────────────────────────────────────────────────────────┐
│             SYNCHRONIZED DATA (Real-time)                     │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Manager Provides Availability ──────► Shows on Candidate    │
│                                         Pass for Selection   │
│                                                               │
│  Candidate Confirms Slot ──────────────► Updates Manager     │
│                                          Pass                │
│                                                               │
│  Manager Submits Evaluation ───────────► Updates Candidate   │
│                                          Stage/Status        │
│                                                               │
│  Admin Changes Stage ──────────────────► Both Passes         │
│                                          Reflect Change      │
└──────────────────────────────────────────────────────────────┘
```

---

## Database Relationships

```sql
-- Core Relationships

recruitment_requests (1) ──< (many) candidates
    │
    └──> (1) hiring_manager (employees.employee_id)

candidates (1) ──< (many) interviews
    │
    ├──> (1) recruitment_request
    └──> (1) pass (passes.pass_number)

interviews (1) ──< (many) evaluations
    │
    └──> (1) candidate

passes
    │
    ├──> recruitment passes (for candidates)
    └──> manager passes (for hiring managers)

-- Link Examples:

-- Manager Pass linked to Recruitment Request
SELECT * FROM passes 
WHERE pass_type = 'manager' 
  AND purpose LIKE '%request_id:123%';

-- Candidate Pass linked to Candidate
SELECT p.*, c.* 
FROM passes p
JOIN candidates c ON p.pass_number = c.pass_number
WHERE p.pass_type = 'recruitment';

-- All interviews for a recruitment request
SELECT i.*, c.full_name 
FROM interviews i
JOIN candidates c ON i.candidate_id = c.id
WHERE c.recruitment_request_id = 123;
```

---

## API Request/Response Examples

### 1. Create Recruitment Request

**Request:**
```http
POST /api/recruitment/requests
Authorization: Bearer {token}
Content-Type: application/json

{
  "position_title": "Senior Backend Developer",
  "department": "Engineering",
  "hiring_manager_id": "EMP001",
  "target_hire_date": "2026-03-01",
  "headcount": 1,
  "employment_type": "Full-time",
  "job_description": "We are looking for...",
  "requirements": "5+ years Python, FastAPI experience...",
  "salary_range_min": 15000,
  "salary_range_max": 20000
}
```

**Response:**
```json
{
  "id": 123,
  "request_number": "RRF-20260105-0001",
  "position_title": "Senior Backend Developer",
  "department": "Engineering",
  "hiring_manager_id": "EMP001",
  "status": "pending",
  "approval_status": {
    "requisition": {"status": "pending", "approver": null, "date": null},
    "budget": {"status": "pending", "approver": null, "date": null},
    "offer": {"status": "pending", "approver": null, "date": null}
  },
  "manager_pass_number": "MGR-20260105-0001",
  "created_at": "2026-01-05T10:30:00Z"
}
```

---

### 2. Add Candidate

**Request:**
```http
POST /api/recruitment/candidates
Authorization: Bearer {token}
Content-Type: application/json

{
  "recruitment_request_id": 123,
  "full_name": "Ahmed Al Mansouri",
  "email": "ahmed@example.com",
  "phone": "+971501234567",
  "current_position": "Backend Developer",
  "current_company": "Tech Solutions LLC",
  "years_experience": 6,
  "expected_salary": 18000,
  "notice_period_days": 30,
  "source": "LinkedIn",
  "linkedin_url": "https://linkedin.com/in/ahmed-almansouri"
}
```

**Response:**
```json
{
  "id": 456,
  "candidate_number": "CAN-20260105-0001",
  "full_name": "Ahmed Al Mansouri",
  "email": "ahmed@example.com",
  "status": "applied",
  "stage": "applied",
  "pass_number": "REC-20260105-0001",
  "pass_url": "https://portal.company.com/recruitment/pass/candidate/REC-20260105-0001",
  "created_at": "2026-01-05T11:00:00Z"
}
```

---

### 3. Provide Interview Availability (Manager)

**Request:**
```http
POST /api/recruitment/interviews/789/slots
Authorization: Bearer {token}
Content-Type: application/json

{
  "available_slots": [
    {
      "start": "2026-01-10T10:00:00Z",
      "end": "2026-01-10T11:00:00Z"
    },
    {
      "start": "2026-01-10T14:00:00Z",
      "end": "2026-01-10T15:00:00Z"
    },
    {
      "start": "2026-01-11T10:00:00Z",
      "end": "2026-01-11T11:00:00Z"
    }
  ]
}
```

**Response:**
```json
{
  "interview_id": 789,
  "status": "slots_provided",
  "available_slots": [
    {"start": "2026-01-10T10:00:00Z", "end": "2026-01-10T11:00:00Z"},
    {"start": "2026-01-10T14:00:00Z", "end": "2026-01-10T15:00:00Z"},
    {"start": "2026-01-11T10:00:00Z", "end": "2026-01-11T11:00:00Z"}
  ],
  "candidate_notified": true
}
```

---

### 4. Confirm Interview Slot (Candidate)

**Request:**
```http
POST /api/recruitment/interviews/789/confirm
Authorization: Bearer {candidate_token}
Content-Type: application/json

{
  "selected_slot": {
    "start": "2026-01-10T14:00:00Z",
    "end": "2026-01-10T15:00:00Z"
  }
}
```

**Response:**
```json
{
  "interview_id": 789,
  "status": "scheduled",
  "scheduled_date": "2026-01-10T14:00:00Z",
  "duration_minutes": 60,
  "confirmed_by_candidate": true,
  "confirmed_at": "2026-01-05T12:00:00Z",
  "calendar_invite_sent": true
}
```

---

### 5. Submit Interview Evaluation (Manager)

**Request:**
```http
POST /api/recruitment/evaluations
Authorization: Bearer {token}
Content-Type: application/json

{
  "interview_id": 789,
  "candidate_id": 456,
  "technical_skills_score": 4,
  "communication_score": 5,
  "cultural_fit_score": 4,
  "overall_score": 4,
  "strengths": "Strong technical skills, excellent problem-solving",
  "concerns": "Limited experience with distributed systems",
  "additional_comments": "Would be a great addition to the team",
  "recommendation": "hire",
  "next_steps": "Proceed to offer stage"
}
```

**Response:**
```json
{
  "id": 101,
  "evaluation_number": "EVAL-20260110-0001",
  "candidate_id": 456,
  "interview_id": 789,
  "overall_score": 4,
  "recommendation": "hire",
  "candidate_stage_updated": "offer",
  "created_at": "2026-01-10T15:30:00Z"
}
```

---

### 6. Get Manager Pass Data

**Request:**
```http
GET /api/recruitment/pass/manager/MGR-20260105-0001
Authorization: Bearer {token}
```

**Response:**
```json
{
  "pass_number": "MGR-20260105-0001",
  "pass_type": "manager",
  "manager": {
    "employee_id": "EMP001",
    "full_name": "Sarah Ahmed",
    "department": "Engineering"
  },
  "recruitment_request": {
    "request_number": "RRF-20260105-0001",
    "position_title": "Senior Backend Developer",
    "status": "open",
    "sla_days": 5
  },
  "approvals": {
    "requisition": {"status": "approved", "approver": "CEO", "date": "2026-01-06"},
    "budget": {"status": "approved", "approver": "GCFO", "date": "2026-01-06"},
    "offer": {"status": "pending", "approver": null, "date": null}
  },
  "pipeline_snapshot": {
    "applied": 5,
    "screening": 3,
    "interview": 2,
    "offer": 0,
    "hired": 0
  },
  "candidates": [
    {
      "candidate_number": "CAN-20260105-0001",
      "full_name": "Ahmed Al Mansouri",
      "stage": "interview",
      "overall_score": 4,
      "recommendation": "hire",
      "next_interview": "2026-01-10T14:00:00Z"
    }
  ],
  "next_actions": [
    "Review evaluation for Ahmed Al Mansouri",
    "Schedule interview with 2 screening candidates",
    "Approve offer for top candidate"
  ]
}
```

---

### 7. Get Candidate Pass Data

**Request:**
```http
GET /api/recruitment/pass/candidate/REC-20260105-0001
Authorization: Bearer {candidate_token}
```

**Response:**
```json
{
  "pass_number": "REC-20260105-0001",
  "pass_type": "recruitment",
  "candidate": {
    "candidate_number": "CAN-20260105-0001",
    "full_name": "Ahmed Al Mansouri",
    "email": "ahmed@example.com"
  },
  "position": {
    "position_title": "Senior Backend Developer",
    "department": "Engineering",
    "employment_type": "Full-time"
  },
  "current_stage": "interview",
  "status": "active",
  "application_progress": {
    "stages": [
      {"name": "applied", "status": "completed", "date": "2026-01-05"},
      {"name": "screening", "status": "completed", "date": "2026-01-07"},
      {"name": "interview", "status": "in_progress", "date": "2026-01-10"},
      {"name": "offer", "status": "not_started", "date": null},
      {"name": "hired", "status": "not_started", "date": null}
    ]
  },
  "interviews": [
    {
      "interview_type": "technical",
      "interview_round": 1,
      "status": "scheduled",
      "scheduled_date": "2026-01-10T14:00:00Z",
      "interviewer": "Sarah Ahmed",
      "location": "Video Call",
      "meeting_link": "https://meet.company.com/xyz123"
    }
  ],
  "next_actions": [
    "Join interview on Jan 10 at 2:00 PM",
    "Prepare portfolio/code samples",
    "Contact HR if you need to reschedule"
  ],
  "hr_contact": {
    "whatsapp": "https://wa.me/971501234567",
    "email": "mailto:hr@company.com"
  }
}
```

---

## State Machines

### Candidate Stage Transitions

```
                    ┌──────────┐
                    │ Applied  │ (Initial)
                    └────┬─────┘
                         │
                         ▼
                    ┌──────────┐
              ┌────►│Screening │
              │     └────┬─────┘
              │          │
              │          ▼
              │     ┌──────────┐
              │     │Interview │
              │     └────┬─────┘
              │          │
              │          ▼
              │     ┌──────────┐
              │     │  Offer   │
              │     └────┬─────┘
              │          │
              │          ▼
              │     ┌──────────┐
              │     │  Hired   │ (Terminal - Success)
              │     └──────────┘
              │
              │     ┌──────────┐
              └─────│ Rejected │ (Terminal - Failure)
                    └──────────┘
                    (Can happen from any stage)
```

**Allowed Transitions:**
- `applied` → `screening` OR `rejected`
- `screening` → `interview` OR `rejected`
- `interview` → `offer` OR `interview` (another round) OR `rejected`
- `offer` → `hired` OR `rejected`

---

### Interview Status Flow

```
┌─────────────────┐
│ pending         │ (Created)
└────────┬────────┘
         │
         │ Manager provides slots
         ▼
┌─────────────────┐
│ slots_provided  │
└────────┬────────┘
         │
         │ Candidate confirms
         ▼
┌─────────────────┐
│ scheduled       │
└────────┬────────┘
         │
         │ Interview happens
         ▼
┌─────────────────┐
│ completed       │ (Terminal - Success)
└─────────────────┘

     OR
         │
         │ Cancellation
         ▼
┌─────────────────┐
│ cancelled       │ (Terminal - Failure)
└─────────────────┘
```

---

## Security & Access Control

### Role-Based Access

| Resource | Admin | HR | Hiring Manager | Candidate |
|----------|-------|----|--------------  |-----------|
| **Recruitment Requests** |
| Create | ✅ | ✅ | 🟡 Request only | ❌ |
| View All | ✅ | ✅ | 🟡 Own only | ❌ |
| Approve | ✅ | ❌ | ❌ | ❌ |
| **Candidates** |
| Add | ✅ | ✅ | ❌ | ❌ |
| View All | ✅ | ✅ | 🟡 Own candidates | ❌ |
| Move Stage | ✅ | ✅ | ❌ | ❌ |
| **Interviews** |
| Schedule | ✅ | ✅ | ❌ | ❌ |
| Provide Slots | ✅ | ✅ | ✅ | ❌ |
| Confirm Slot | ❌ | ❌ | ❌ | ✅ |
| **Evaluations** |
| Submit | ✅ | ✅ | ✅ | ❌ |
| View All | ✅ | ✅ | 🟡 Own only | ❌ |
| **Passes** |
| Manager Pass | ✅ | ✅ | ✅ (Own) | ❌ |
| Candidate Pass | ✅ | ✅ | ✅ (Read) | ✅ (Own) |

**Legend:**
- ✅ Full access
- 🟡 Limited access (own records only)
- ❌ No access

### Candidate Pass Access Token

Candidates access their pass via a secure token (not just pass number):

```
URL: /recruitment/pass/candidate/{pass_number}?token={secure_token}

Token Generation:
- Created when candidate pass is generated
- Stored as hash in database
- Sent to candidate email
- Valid until recruitment process completes
- One token per candidate pass
```

---

## Performance Considerations

### Database Indexes

```sql
-- Recruitment Requests
CREATE INDEX idx_recruitment_requests_status ON recruitment_requests(status);
CREATE INDEX idx_recruitment_requests_hiring_manager ON recruitment_requests(hiring_manager_id);
CREATE INDEX idx_recruitment_requests_created ON recruitment_requests(created_at);

-- Candidates
CREATE INDEX idx_candidates_stage ON candidates(stage);
CREATE INDEX idx_candidates_status ON candidates(status);
CREATE INDEX idx_candidates_recruitment_request ON candidates(recruitment_request_id);
CREATE INDEX idx_candidates_pass_number ON candidates(pass_number);
CREATE INDEX idx_candidates_email ON candidates(email);

-- Interviews
CREATE INDEX idx_interviews_candidate ON interviews(candidate_id);
CREATE INDEX idx_interviews_status ON interviews(status);
CREATE INDEX idx_interviews_scheduled_date ON interviews(scheduled_date);

-- Evaluations
CREATE INDEX idx_evaluations_candidate ON evaluations(candidate_id);
CREATE INDEX idx_evaluations_interview ON evaluations(interview_id);
```

### Caching Strategy

```python
# Cache pass data for 5 minutes (frequently accessed)
@cache(ttl=300)
async def get_manager_pass_data(pass_number: str):
    # ...

# Cache candidate pipeline (updates less frequently)
@cache(ttl=60)
async def get_pipeline_snapshot(request_id: int):
    # ...
```

### Pagination

```python
# All list endpoints support pagination
GET /api/recruitment/candidates?page=1&limit=20

# Response includes pagination metadata
{
  "items": [...],
  "total": 100,
  "page": 1,
  "limit": 20,
  "pages": 5
}
```

---

## Notification System

### Event Triggers

| Event | Recipients | Message |
|-------|-----------|---------|
| **Recruitment request created** | Hiring Manager | "New position assigned to you" |
| **Candidate added** | Candidate | "Application received + pass link" |
| **Candidate stage changed** | Candidate | "Your application moved to {stage}" |
| **Interview slots provided** | Candidate | "Please select interview time" |
| **Interview confirmed** | Manager + Candidate | "Interview scheduled for {datetime}" |
| **Evaluation submitted** | Candidate (if next stage) | "You've progressed to {stage}" |
| **Offer extended** | Candidate | "Congratulations! Offer details..." |
| **Candidate rejected** | Candidate | "Thank you for your application..." |

### Notification Channels

1. **Email** (Primary)
   - All notifications
   - Includes pass links
   - Action buttons where applicable

2. **WhatsApp** (Optional - if integration exists)
   - Critical notifications only
   - Interview confirmations
   - Offer notifications

3. **In-App** (Via pass interface)
   - Real-time status updates
   - Next actions reminders

---

## Testing Strategy

### Unit Tests

```python
# test_recruitment_service.py
async def test_create_recruitment_request():
    # Test request creation
    # Verify manager pass generation
    # Check approval status initialization

async def test_add_candidate():
    # Test candidate creation
    # Verify candidate pass generation
    # Check stage initialization

async def test_stage_transition():
    # Test valid transitions
    # Test invalid transitions (should fail)
    # Verify notifications sent
```

### Integration Tests

```python
# test_recruitment_flow.py
async def test_complete_recruitment_flow():
    # 1. Create request
    # 2. Add candidate
    # 3. Move through stages
    # 4. Schedule interview
    # 5. Submit evaluation
    # 6. Extend offer
    # 7. Hire candidate
    # 8. Verify pass transitions
```

### API Tests

```python
# test_recruitment_api.py
async def test_recruitment_endpoints():
    # Test all CRUD operations
    # Test authorization (role-based)
    # Test pagination
    # Test filters
    # Test error cases
```

---

## Deployment Checklist

Before deploying recruitment module:

- [ ] Database migration applied (all 4 tables)
- [ ] Indexes created
- [ ] Manager pass type added to PASS_TYPES
- [ ] Email service configured
- [ ] File storage configured (for resumes)
- [ ] Frontend routes added
- [ ] API documentation updated
- [ ] Role permissions configured
- [ ] Test data seeded (optional)
- [ ] Monitoring alerts configured
- [ ] Backup strategy verified

---

## Monitoring & Metrics

### Key Metrics to Track

1. **Recruitment Funnel:**
   - Candidates by stage
   - Stage conversion rates
   - Time in each stage
   - Drop-off points

2. **Performance:**
   - Time to hire (request → hired)
   - Time to interview (applied → first interview)
   - Interviews per hire
   - Offer acceptance rate

3. **System Health:**
   - API response times
   - Error rates
   - Pass access frequency
   - Email delivery rates

### Dashboard Widgets

```
┌───────────────────────────────────────────┐
│  Recruitment Dashboard                     │
├───────────────────────────────────────────┤
│                                            │
│  Active Positions: 5                      │
│  Candidates in Pipeline: 23               │
│  Interviews This Week: 8                  │
│  Offers Pending: 2                        │
│                                            │
│  Average Time to Hire: 28 days           │
│  Offer Acceptance Rate: 75%               │
│                                            │
│  [Funnel Chart]                           │
│  Applied (23) → Screening (15) →          │
│  Interview (8) → Offer (2) → Hired (0)    │
│                                            │
└───────────────────────────────────────────┘
```

---

## Future Enhancements (Phase 2+)

1. **External Recruiter Portal**
   - Separate login for agencies
   - Commission tracking
   - Candidate submission interface

2. **Public Careers Page**
   - Job listings
   - Online application form
   - Direct candidate pass generation

3. **Advanced Scheduling**
   - Cal.com integration
   - Google Calendar sync
   - Outlook Calendar sync
   - Automated rescheduling

4. **Assessment Integration**
   - HackerRank API
   - Custom skill tests
   - Personality assessments

5. **AI-Powered Resume Parsing (Recommended ⭐)**
   - **pyresparser integration** with spaCy NLP models
   - Auto-extract data from PDF/DOCX resumes
   - Automatic candidate data population
   - Skills, experience, education extraction
   - 85% accuracy with AI/ML
   - **Time Savings:** 5-10 minutes per candidate
   - **See:** [AI_CV_PARSING_SOLUTIONS.md](./AI_CV_PARSING_SOLUTIONS.md) for detailed guide
   - **Implementation:** 1-2 days
   - **Cost:** $0 (free open source)

6. **Analytics & Reporting**
   - Recruitment source effectiveness
   - Hiring manager performance
   - Time-to-hire trends
   - Cost-per-hire

---

## Conclusion

This architecture provides a comprehensive technical blueprint for implementing a custom lightweight ATS integrated with your existing pass system. The modular design allows for incremental implementation (phase by phase) while maintaining system stability.

**Key Advantages:**
- Leverages existing infrastructure (FastAPI + React + PostgreSQL)
- Native pass system support (unique to your workflow)
- Single codebase/deployment
- Designed for solo HR operations
- 3-5 weeks implementation time

**Ready for Implementation:** ✅

---

**Next Step:** Begin Phase 1 - Core Recruitment Models
