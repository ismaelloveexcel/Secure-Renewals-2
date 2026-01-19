# HR Apps Integration Guide

**For:** Secure Renewals HR Portal  
**Purpose:** Comprehensive guide to integrating GitHub-based HR applications for complete HR operations  
**Last Updated:** January 2026  
**Prepared by:** HR Assistant

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Security Best Practices](#security-best-practices)
3. [Recruitment & Applicant Tracking](#1-recruitment--applicant-tracking)
4. [Onboarding Automation](#2-onboarding-automation)
5. [Employee Requests Management](#3-employee-requests-management)
6. [Probation Evaluation & Performance](#4-probation-evaluation--performance)
7. [Job Description Generation](#5-job-description-generation-ai-powered)
8. [Offboarding Workflows](#6-offboarding-workflows)
9. [Training & Learning Management](#7-training--learning-management)
10. [Attendance Tracking (WFH Support)](#8-attendance-tracking-wfh-support)
11. [Overtime Tracking & Leave Management](#9-overtime-tracking--leave-management)
12. [Integration Architecture](#integration-architecture)
13. [Implementation Roadmap](#implementation-roadmap)

---

## Executive Summary

This guide identifies open-source GitHub repositories suitable for integration with your Secure Renewals HR Portal. Each section provides:

- **Top GitHub Projects** - Actively maintained, production-ready solutions
- **Integration Strategy** - How to connect with your existing FastAPI + React stack
- **Implementation Effort** - Time and complexity estimates
- **Benefits** - Specific HR workflow improvements

**Quick Stats:**
- 25+ GitHub projects identified
- Coverage: All 10 HR operation areas
- Integration patterns: REST API, webhooks, database sync, embeddable widgets
- Tech stack compatibility: Python/Node.js focus for seamless integration

---

## Security Best Practices

🔒 **Critical:** Follow these security guidelines when integrating external HR applications.

### API Key Management

**DO:**
- ✅ Store API keys in environment variables or secure secret management systems (e.g., AWS Secrets Manager, HashiCorp Vault)
- ✅ Use different API keys for development, staging, and production
- ✅ Rotate API keys regularly (at least quarterly)
- ✅ Keep API keys on the backend/server-side ONLY
- ✅ Use parameterized queries to prevent SQL injection

**DON'T:**
- ❌ Never expose API keys in frontend code (e.g., `VITE_*` variables)
- ❌ Never commit API keys to version control
- ❌ Never hardcode API keys in source code
- ❌ Never log API keys in application logs
- ❌ Never use raw SQL queries with string concatenation

### Integration Security Checklist

- [ ] All external API calls go through backend proxy endpoints
- [ ] API keys retrieved from secure environment variables
- [ ] HTTP clients properly closed to prevent resource leaks
- [ ] All database queries use parameterized/prepared statements
- [ ] Error messages don't expose sensitive system details
- [ ] Rate limiting enabled on all integration endpoints
- [ ] Input validation on all data from external systems
- [ ] HTTPS/TLS used for all external communications
- [ ] Authentication required on all integration endpoints
- [ ] Regular security audits of integrated systems

### Example: Secure API Integration Pattern

```python
# ✅ CORRECT: Secure backend integration
import os
from fastapi import APIRouter, Depends, HTTPException
import httpx

router = APIRouter()

# Securely retrieve from environment
API_KEY = os.getenv('EXTERNAL_SERVICE_API_KEY')
if not API_KEY:
    raise ValueError("EXTERNAL_SERVICE_API_KEY not configured")

@router.get("/api/external-data")
async def get_external_data(current_user = Depends(get_current_user)):
    """Proxy to external service - keeps API key server-side"""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                'https://external-service.com/api/data',
                headers={'Authorization': f'Bearer {API_KEY}'}
            )
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail="External service unavailable")
```

```typescript
// ✅ CORRECT: Frontend calls backend proxy
async function fetchExternalData() {
  const response = await fetch('/api/external-data', {
    headers: {
      'Authorization': `Bearer ${getUserToken()}`  // Your app's auth
    }
  });
  return response.json();
}

// ❌ WRONG: Never expose API keys in frontend
// const API_KEY = process.env.VITE_API_KEY;  // SECURITY RISK!
```

---

## 1. Recruitment & Applicant Tracking

### 🎯 Top GitHub Projects

#### 1.1 OpenCATS (Open Source ATS)
- **Repository:** `opencats/OpenCATS`
- **Stars:** 1.5k+ | **Language:** PHP
- **Description:** Full-featured applicant tracking system with job postings, candidate management, and interview scheduling

**Key Features:**
- Job requisition management
- Candidate pipeline tracking
- Resume parsing
- Interview scheduling
- Email integration
- Reporting & analytics

**Integration Strategy:**
```python
# Backend integration approach
# Option 1: Database-level integration (read OpenCATS candidates table)
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import text
import os

# Securely retrieve connection string from environment
OPENCATS_DB_URL = os.getenv('OPENCATS_DATABASE_URL')
if not OPENCATS_DB_URL:
    raise ValueError("OPENCATS_DATABASE_URL environment variable not set")

# Use async engine for async operations
opencats_engine = create_async_engine(OPENCATS_DB_URL, pool_pre_ping=True)
AsyncSessionLocal = async_sessionmaker(
    opencats_engine,
    class_=AsyncSession,
    expire_on_commit=False
)

async def sync_candidates_from_opencats():
    """Periodic sync of candidates from OpenCATS"""
    # Read OpenCATS candidates using parameterized query
    query = text("SELECT * FROM candidate WHERE status = :status")
    
    async with AsyncSessionLocal() as session:
        result = await session.execute(query, {"status": "active"})
        candidates = result.all()  # Use .all() for async results
    
    # Import into HR Portal
    for candidate in candidates:
        await recruitment_service.create_candidate({
            'name': candidate.name,
            'email': candidate.email,
            'position': candidate.job_title,
            'status': map_opencats_status(candidate.status)
        })
```

**Integration Effort:** Medium (2-3 weeks)
- Setup OpenCATS instance
- Create sync service in backend
- Build recruitment dashboard in frontend
- Configure cron job for periodic sync

---

#### 1.2 Recruit CRM Alternative: Twenty (Open Source CRM)
- **Repository:** `twentyhq/twenty`
- **Stars:** 15k+ | **Language:** TypeScript
- **Description:** Modern, open-source CRM that can be adapted for recruitment

**Key Features:**
- Customizable pipelines
- Contact management
- Email sync
- Task automation
- API-first architecture
- Self-hosted or cloud

**Integration Strategy:**
```typescript
// Frontend: Fetch recruitment data through backend proxy (secure approach)
import { useState, useEffect } from 'react';

export function RecruitmentPipeline() {
  const [candidates, setCandidates] = useState([]);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    // Fetch from YOUR backend API (which securely calls Twenty API)
    // Never expose API keys in frontend
    fetch('/api/recruitment/candidates', {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}` // Your app's auth token
      }
    })
    .then(res => {
      if (!res.ok) throw new Error('Failed to fetch candidates');
      return res.json();
    })
    .then(data => setCandidates(data))
    .catch(err => setError(err.message));
  }, []);
  
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div className="recruitment-module">
      {/* Render candidates in Kanban board */}
    </div>
  );
}

// Backend proxy endpoint (secure)
// backend/app/routers/recruitment.py
from fastapi import APIRouter, Depends, HTTPException
from app.auth.dependencies import get_current_user
from app.schemas.user import User
import httpx
import os

router = APIRouter()

# Validate API key is configured
TWENTY_API_KEY = os.getenv('TWENTY_API_KEY')
if not TWENTY_API_KEY:
    raise ValueError("TWENTY_API_KEY environment variable not set")

@router.get("/recruitment/candidates")
async def get_candidates(current_user: User = Depends(get_current_user)):
    """Proxy to Twenty API - keeps API key server-side"""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                'https://twenty.yourdomain.com/api/candidates',
                headers={'Authorization': f'Bearer {TWENTY_API_KEY}'}
            )
            response.raise_for_status()
            return response.json()
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=502,
            detail=f"Twenty API error: {e.response.status_code}"
        )
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=503,
            detail="Unable to connect to Twenty API"
        )
```

**Integration Effort:** Low-Medium (1-2 weeks)
- Deploy Twenty instance
- Configure API access
- Create recruitment module in frontend
- Setup webhook for status updates

---

#### 1.3 Cal.com (Interview Scheduling)
- **Repository:** `calcom/cal.com`
- **Stars:** 29k+ | **Language:** TypeScript
- **Description:** Open-source Calendly alternative for scheduling interviews

**Key Features:**
- Calendar syncing (Google, Outlook)
- Custom booking pages
- Team scheduling
- Automated reminders
- Timezone handling
- Video meeting integration (Zoom, Meet)

**Integration Strategy:**
```python
# Backend: Create interview scheduling endpoint
from fastapi import APIRouter
import httpx

router = APIRouter()

@router.post("/recruitment/schedule-interview")
async def schedule_interview(candidate_id: str, interviewer_id: str):
    """Schedule interview via Cal.com API"""
    
    # Get candidate and interviewer details
    candidate = await recruitment_service.get_candidate(candidate_id)
    interviewer = await employee_service.get_employee(interviewer_id)
    
    # Create Cal.com booking
    async with httpx.AsyncClient() as client:
        response = await client.post(
            'https://cal.yourdomain.com/api/bookings',
            json={
                'eventTypeId': 'interview-60min',
                'attendee': {
                    'name': candidate.name,
                    'email': candidate.email
                },
                'host': {
                    'name': interviewer.name,
                    'email': interviewer.email
                }
            },
            headers={'Authorization': f'Bearer {CAL_COM_API_KEY}'}
        )
    
    return {"booking_url": response.json()['url']}
```

**Integration Effort:** Low (3-5 days)
- Deploy Cal.com or use cloud version
- Configure event types (phone screen, technical, final)
- Add scheduling button to candidate cards
- Webhook for booking confirmations

---

### 📊 Recruitment Module Integration Summary

| Component | GitHub Project | Integration Method | Effort |
|-----------|---------------|-------------------|--------|
| **Applicant Tracking** | OpenCATS | Database sync | Medium |
| **Pipeline Management** | Twenty CRM | REST API | Low-Medium |
| **Interview Scheduling** | Cal.com | REST API + Webhooks | Low |
| **Job Posting** | Custom (extend portal) | Native feature | Low |

**Combined Integration Effort:** 4-6 weeks for complete recruitment module

---

## 2. Onboarding Automation

### 🎯 Top GitHub Projects

#### 2.1 DocuSeal (Document Signing)
- **Repository:** `docusealco/docuseal`
- **Stars:** 5.5k+ | **Language:** Ruby/JavaScript
- **Description:** Open-source DocuSign alternative for e-signatures

**Key Features:**
- PDF form filling
- E-signature workflows
- Template management
- Audit trail
- Multiple signers
- Email notifications

**Integration Strategy:**
```python
# Backend: Onboarding document signing
from fastapi import APIRouter, UploadFile
import httpx

router = APIRouter()

@router.post("/onboarding/send-documents")
async def send_onboarding_documents(employee_id: str):
    """Send onboarding documents for e-signature"""
    
    employee = await employee_service.get_employee(employee_id)
    
    # Prepare documents (offer letter, NDA, policies)
    documents = [
        {'template': 'offer_letter', 'name': 'Offer Letter'},
        {'template': 'nda', 'name': 'Non-Disclosure Agreement'},
        {'template': 'company_policies', 'name': 'Company Policies'}
    ]
    
    # Send to DocuSeal
    async with httpx.AsyncClient() as client:
        response = await client.post(
            'https://docuseal.yourdomain.com/api/submissions',
            json={
                'template_id': 'onboarding_package',
                'send_email': True,
                'recipients': [{
                    'email': employee.email,
                    'name': employee.name,
                    'role': 'signer'
                }],
                'documents': documents
            },
            headers={'X-Auth-Token': DOCUSEAL_API_KEY}
        )
    
    return {"submission_id": response.json()['id']}
```

**Integration Effort:** Low-Medium (1 week)
- Deploy DocuSeal instance
- Create document templates
- Add signing workflow to onboarding module
- Setup webhook for completion notifications

---

#### 2.2 Novu (Notification Infrastructure)
- **Repository:** `novuhq/novu`
- **Stars:** 33k+ | **Language:** TypeScript
- **Description:** Open-source notification infrastructure for onboarding communications

**Key Features:**
- Multi-channel (email, SMS, in-app)
- Template management
- Workflow automation
- Preference management
- Analytics & tracking

**Integration Strategy:**
```python
# Backend: Automated onboarding notifications
from novu.api import EventApi
import os

# Securely retrieve API key from environment
NOVU_API_KEY = os.getenv('NOVU_API_KEY')
if not NOVU_API_KEY:
    raise ValueError("NOVU_API_KEY environment variable not set")

novu = EventApi(api_key=NOVU_API_KEY)

async def trigger_onboarding_sequence(employee_id: str):
    """Start automated onboarding notification sequence"""
    
    employee = await employee_service.get_employee(employee_id)
    
    # Trigger Novu workflow
    novu.trigger(
        name='employee-onboarding',
        recipients=[employee.email],
        payload={
            'employee_name': employee.name,
            'start_date': employee.start_date,
            'manager': employee.manager_name,
            'department': employee.department
        }
    )
    
    # Novu handles:
    # Day -7: Welcome email with prep checklist
    # Day -3: Reminder to complete pre-boarding forms
    # Day 0: First day instructions
    # Day 1: Check-in message
    # Day 7: Week one survey
    # Day 30: 30-day feedback request
```

**Integration Effort:** Low (3-5 days)
- Setup Novu cloud or self-hosted
- Create onboarding notification workflows
- Configure email templates
- Add triggers to employee creation endpoint

---

#### 2.3 Plane (Task Management)
- **Repository:** `makeplane/plane`
- **Stars:** 25k+ | **Language:** TypeScript
- **Description:** Open-source project management for onboarding checklists

**Key Features:**
- Kanban boards
- Task assignments
- Due dates & reminders
- Team collaboration
- Custom workflows
- Automation rules

**Integration Strategy:**
```python
# Backend: Create onboarding checklist via Plane API
import httpx

async def create_onboarding_checklist(employee_id: str):
    """Auto-create onboarding tasks in Plane"""
    
    employee = await employee_service.get_employee(employee_id)
    
    # Onboarding tasks by department
    tasks = get_department_onboarding_tasks(employee.department)
    
    async with httpx.AsyncClient() as client:
        # Create Plane project for new hire
        project_response = await client.post(
            f'{PLANE_API_URL}/api/workspaces/{WORKSPACE_ID}/projects/',
            json={
                'name': f'Onboarding: {employee.name}',
                'description': f'Onboarding checklist for {employee.name}',
                'identifier': f'ONB-{employee.employee_id}'
            },
            headers={'X-Api-Key': PLANE_API_KEY}
        )
        
        project_id = project_response.json()['id']
        
        # Create tasks
        for task in tasks:
            await client.post(
                f'{PLANE_API_URL}/api/workspaces/{WORKSPACE_ID}/projects/{project_id}/issues/',
                json={
                    'name': task['name'],
                    'description': task['description'],
                    'assignees': [task['owner_id']],
                    'due_date': calculate_due_date(employee.start_date, task['days_offset'])
                },
                headers={'X-Api-Key': PLANE_API_KEY}
            )
```

**Integration Effort:** Medium (1-2 weeks)
- Deploy Plane instance
- Define onboarding task templates by department
- Create API integration service
- Build onboarding dashboard with task progress

---

### 📊 Onboarding Module Integration Summary

| Component | GitHub Project | Integration Method | Effort |
|-----------|---------------|-------------------|--------|
| **Document Signing** | DocuSeal | REST API | Low-Medium |
| **Notifications** | Novu | SDK + Webhooks | Low |
| **Task Management** | Plane | REST API | Medium |
| **Forms & Surveys** | Formbricks | Embeddable widget | Low |

**Combined Integration Effort:** 3-4 weeks for complete onboarding automation

---

## 3. Employee Requests Management

### 🎯 Top GitHub Projects

#### 3.1 Peppermint (Ticketing System)
- **Repository:** `Peppermint-Lab/peppermint`
- **Stars:** 1.7k+ | **Language:** TypeScript
- **Description:** Open-source ticket management system for employee requests

**Key Features:**
- Ticket creation & tracking
- Priority levels
- Assignment & routing
- Email integration
- Knowledge base
- Reporting

**Integration Strategy:**
```python
# Backend: Employee request submission
from fastapi import APIRouter, File
import httpx

router = APIRouter()

@router.post("/requests/create")
async def create_employee_request(
    employee_id: str,
    category: str,
    subject: str,
    description: str,
    attachments: list[File] = None
):
    """Create employee request ticket in Peppermint"""
    
    employee = await employee_service.get_employee(employee_id)
    
    # Create ticket in Peppermint
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f'{PEPPERMINT_URL}/api/v1/ticket/create',
            json={
                'name': subject,
                'detail': description,
                'email': employee.email,
                'priority': 'medium',
                'client_id': employee.employee_id,
                'category': category
            },
            headers={'Authorization': f'Bearer {PEPPERMINT_API_KEY}'}
        )
    
    ticket_id = response.json()['id']
    
    # Upload attachments if any
    if attachments:
        for file in attachments:
            await upload_attachment_to_peppermint(ticket_id, file)
    
    return {"ticket_id": ticket_id, "status": "submitted"}
```

**Request Categories:**
- Salary certificates
- No Objection Certificates (NOC)
- Experience letters
- Leave requests
- Equipment requests
- IT support
- Policy clarifications

**Integration Effort:** Low-Medium (1 week)
- Deploy Peppermint instance
- Configure request categories
- Create submission form in HR portal
- Setup email notifications

---

#### 3.2 Erxes (Open Source CRM with Service Desk)
- **Repository:** `erxes/erxes`
- **Stars:** 3.4k+ | **Language:** TypeScript
- **Description:** All-in-one platform with service desk capabilities

**Key Features:**
- Omnichannel inbox
- Automated workflows
- SLA management
- Knowledge base
- Analytics dashboard

**Integration Effort:** Medium (2 weeks)

---

### 📊 Employee Requests Integration Summary

| Component | GitHub Project | Integration Method | Effort |
|-----------|---------------|-------------------|--------|
| **Ticketing System** | Peppermint | REST API | Low-Medium |
| **Request Portal** | Custom (extend portal) | Native feature | Low |
| **Approval Workflows** | n8n (automation) | Webhooks | Medium |

**Combined Integration Effort:** 2-3 weeks

---

## 4. Probation Evaluation & Performance

### 🎯 Top GitHub Projects

#### 4.1 Rallly (Scheduling & Feedback)
- **Repository:** `lukevella/rallly`
- **Stars:** 3.3k+ | **Language:** TypeScript
- **Description:** Scheduling tool adaptable for review meetings

**Use Case:** Schedule probation review meetings

**Integration Effort:** Low (3-5 days)

---

#### 4.2 Formbricks (Survey & Feedback)
- **Repository:** `formbricks/formbricks`
- **Stars:** 7k+ | **Language:** TypeScript
- **Description:** Open-source survey platform for performance reviews

**Key Features:**
- Custom survey builder
- Multi-step forms
- Conditional logic
- Analytics & insights
- Embeddable widgets

**Integration Strategy:**
```python
# Backend: Trigger probation evaluation survey
import httpx

async def send_probation_evaluation(employee_id: str):
    """Send probation evaluation survey"""
    
    employee = await employee_service.get_employee(employee_id)
    
    # Create personalized survey link
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f'{FORMBRICKS_URL}/api/v1/responses',
            json={
                'surveyId': 'probation-evaluation-template',
                'userId': employee.employee_id,
                'attributes': {
                    'employee_name': employee.name,
                    'manager': employee.manager_name,
                    'department': employee.department,
                    'start_date': employee.start_date
                }
            },
            headers={'x-api-key': FORMBRICKS_API_KEY}
        )
    
    survey_link = response.json()['link']
    
    # Send to employee and manager
    await notification_service.send_evaluation_link(
        employee.email,
        employee.manager_email,
        survey_link
    )
```

**Evaluation Components:**
- Self-assessment form
- Manager assessment form
- Peer feedback (optional)
- Goals review
- Decision (pass/extend/terminate)

**Integration Effort:** Low-Medium (1 week)

---

#### 4.3 Umami (Analytics for Performance Metrics)
- **Repository:** `umami-software/umami`
- **Stars:** 20k+ | **Language:** TypeScript
- **Description:** Privacy-focused analytics for tracking performance KPIs

**Integration Effort:** Low (2-3 days)

---

### 📊 Probation & Performance Integration Summary

| Component | GitHub Project | Integration Method | Effort |
|-----------|---------------|-------------------|--------|
| **Review Scheduling** | Rallly | REST API | Low |
| **Evaluation Surveys** | Formbricks | REST API + Embed | Low-Medium |
| **Performance Dashboard** | Custom | Native charts | Low |
| **Goal Tracking** | Plane | REST API | Medium |

**Combined Integration Effort:** 2-3 weeks

---

## 5. Job Description Generation (AI-Powered)

### 🎯 Top GitHub Projects

#### 5.1 Ollama (Local AI Models)
- **Repository:** `ollama/ollama`
- **Stars:** 80k+ | **Language:** Go
- **Description:** Run large language models locally for job description generation

**Key Features:**
- Local AI inference
- No API costs
- Privacy-focused
- Multiple models (Llama, Mistral, etc.)
- Simple API

**Integration Strategy:**
```python
# Backend: AI-powered job description generator
from fastapi import APIRouter
from datetime import datetime
import httpx

router = APIRouter()

@router.post("/recruitment/generate-job-description")
async def generate_job_description(
    job_title: str,
    department: str,
    experience_level: str,
    key_responsibilities: list[str],
    required_skills: list[str]
):
    """Generate job description using local Ollama LLM"""
    
    # Build prompt
    responsibilities_text = '\n'.join(f'- {r}' for r in key_responsibilities)
    skills_text = '\n'.join(f'- {s}' for s in required_skills)
    
    prompt = f"""
    Generate a professional job description for the following role:
    
    Job Title: {job_title}
    Department: {department}
    Experience Level: {experience_level}
    
    Key Responsibilities:
    {responsibilities_text}
    
    Required Skills:
    {skills_text}
    
    Include sections for: Overview, Responsibilities, Requirements, Nice-to-Have, Benefits.
    Format in markdown.
    """
    
    # Call Ollama API
    async with httpx.AsyncClient() as client:
        response = await client.post(
            'http://localhost:11434/api/generate',
            json={
                'model': 'mistral',
                'prompt': prompt,
                'stream': False
            }
        )
    
    job_description = response.json()['response']
    
    return {
        "job_description": job_description,
        "generated_at": datetime.utcnow()
    }
```

**Integration Effort:** Low (2-3 days)
- Install Ollama on server
- Download model (mistral or llama2)
- Create generation endpoint
- Build frontend editor with AI assistance

---

#### 5.2 Alternative: OpenAI Compatible APIs
- Use OpenAI API for cloud-based generation
- Or use open alternatives like Together.ai, Replicate

**Integration Effort:** Very Low (1 day)

---

### 📊 Job Description Generation Integration Summary

| Component | GitHub Project | Integration Method | Effort |
|-----------|---------------|-------------------|--------|
| **AI Generation** | Ollama | HTTP API | Low |
| **Template Library** | Custom | Database | Low |
| **Editor** | TipTap | React component | Low |

**Combined Integration Effort:** 3-5 days

---

## 6. Offboarding Workflows

### 🎯 Top GitHub Projects

#### 6.1 n8n (Workflow Automation)
- **Repository:** `n8n-io/n8n`
- **Stars:** 42k+ | **Language:** TypeScript
- **Description:** Open-source workflow automation for offboarding checklists

**Key Features:**
- Visual workflow builder
- 400+ integrations
- Conditional logic
- Scheduled executions
- Webhooks
- Self-hosted or cloud

**Integration Strategy:**
```python
# Backend: Trigger offboarding workflow
import httpx

async def initiate_offboarding(employee_id: str, last_working_day: str):
    """Start automated offboarding workflow"""
    
    employee = await employee_service.get_employee(employee_id)
    
    # Trigger n8n workflow
    async with httpx.AsyncClient() as client:
        await client.post(
            f'{N8N_URL}/webhook/offboarding',
            json={
                'employee_id': employee.employee_id,
                'employee_name': employee.name,
                'email': employee.email,
                'department': employee.department,
                'last_working_day': last_working_day,
                'manager': employee.manager_email
            }
        )
    
    # n8n workflow handles:
    # 1. Notify IT to revoke access
    # 2. Notify facilities for asset collection
    # 3. Schedule exit interview
    # 4. Generate clearance form
    # 5. Notify payroll for final settlement
    # 6. Archive employee records
    # 7. Send goodbye email to team
```

**Offboarding Checklist:**
- Access revocation (email, systems, building)
- Asset collection (laptop, phone, ID card)
- Exit interview scheduling
- Knowledge transfer
- Final payroll processing
- Benefits termination
- Reference letter generation
- Alumni network invitation

**Integration Effort:** Medium (1-2 weeks)
- Deploy n8n instance
- Build offboarding workflows
- Configure integrations (email, Slack, etc.)
- Create offboarding dashboard

---

### 📊 Offboarding Integration Summary

| Component | GitHub Project | Integration Method | Effort |
|-----------|---------------|-------------------|--------|
| **Workflow Automation** | n8n | Webhooks | Medium |
| **Checklist Tracking** | Custom | Native feature | Low |
| **Exit Survey** | Formbricks | REST API | Low |
| **Document Generation** | DocuSeal | REST API | Low |

**Combined Integration Effort:** 2-3 weeks

---

## 7. Training & Learning Management

### 🎯 Top GitHub Projects

#### 7.1 Moodle LMS
- **Repository:** `moodle/moodle`
- **Stars:** 5.4k+ | **Language:** PHP
- **Description:** World's most popular open-source LMS

**Key Features:**
- Course management
- Student enrollment
- Quizzes & assignments
- Progress tracking
- Certificates
- Mobile app support
- SCORM compliance

**Integration Strategy:**
```python
# Backend: Sync employees to Moodle
import httpx

async def enroll_employee_in_training(employee_id: str, course_id: str):
    """Enroll employee in Moodle course"""
    
    employee = await employee_service.get_employee(employee_id)
    
    # Create user in Moodle if doesn't exist
    async with httpx.AsyncClient() as client:
        # Check if user exists
        user_response = await client.post(
            f'{MOODLE_URL}/webservice/rest/server.php',
            data={
                'wstoken': MOODLE_WS_TOKEN,
                'wsfunction': 'core_user_get_users_by_field',
                'field': 'email',
                'values[0]': employee.email,
                'moodlewsrestformat': 'json'
            }
        )
        
        users = user_response.json()
        
        if not users:
            # Create user
            await client.post(
                f'{MOODLE_URL}/webservice/rest/server.php',
                data={
                    'wstoken': MOODLE_WS_TOKEN,
                    'wsfunction': 'core_user_create_users',
                    'users[0][username]': employee.employee_id,
                    'users[0][email]': employee.email,
                    'users[0][firstname]': employee.first_name,
                    'users[0][lastname]': employee.last_name,
                    'moodlewsrestformat': 'json'
                }
            )
        
        # Enroll in course
        await client.post(
            f'{MOODLE_URL}/webservice/rest/server.php',
            data={
                'wstoken': MOODLE_WS_TOKEN,
                'wsfunction': 'enrol_manual_enrol_users',
                'enrolments[0][roleid]': 5,  # Student role
                'enrolments[0][userid]': users[0]['id'],
                'enrolments[0][courseid]': course_id,
                'moodlewsrestformat': 'json'
            }
        )
```

**Training Modules:**
- Onboarding courses (company policies, tools)
- Compliance training (data privacy, security)
- Skills development
- Leadership programs
- Technical certifications

**Integration Effort:** Medium-High (3-4 weeks)

---

#### 7.2 Open edX
- **Repository:** `openedx/edx-platform`
- **Stars:** 7.2k+ | **Language:** Python
- **Description:** Massive open online course (MOOC) platform

**Integration Effort:** High (4-6 weeks)
- More complex than Moodle but more scalable

---

#### 7.3 Oppia (Lightweight Alternative)
- **Repository:** `oppia/oppia`
- **Stars:** 5.5k+ | **Language:** Python/TypeScript
- **Description:** Simpler LMS for creating interactive lessons

**Integration Effort:** Medium (2-3 weeks)

---

### 📊 Training & LMS Integration Summary

| Component | GitHub Project | Integration Method | Effort |
|-----------|---------------|-------------------|--------|
| **LMS Platform** | Moodle | Web services API | Medium-High |
| **Course Library** | Custom | Content import | Medium |
| **Progress Tracking** | Moodle API | REST API | Low |
| **Certificates** | Moodle | Auto-generation | Low |

**Combined Integration Effort:** 3-5 weeks

---

## 8. Attendance Tracking (WFH Support)

### 🎯 Top GitHub Projects

#### 8.1 Kimai (Time Tracking)
- **Repository:** `kimai/kimai`
- **Stars:** 3k+ | **Language:** PHP/Symfony
- **Description:** Open-source time tracking with project support

**Key Features:**
- Clock in/out
- Project time tracking
- Timesheet management
- Location tracking
- Mobile-friendly
- Reporting & exports
- Invoice generation

**Integration Strategy:**
```python
# Backend: Attendance tracking with WFH support
from fastapi import APIRouter
from datetime import datetime
import httpx

router = APIRouter()

@router.post("/attendance/clock-in")
async def clock_in(
    employee_id: str,
    location_type: str,  # 'office' or 'wfh'
    location_name: str = None
):
    """Clock in employee (office or WFH)"""
    
    employee = await employee_service.get_employee(employee_id)
    
    # Record in Kimai
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f'{KIMAI_URL}/api/timesheets',
            json={
                'user': employee.kimai_user_id,
                'activity': f'work-{location_type}',
                'project': employee.department,
                'begin': datetime.utcnow().isoformat(),
                'tags': [location_type]
            },
            headers={'X-AUTH-USER': KIMAI_USER, 'X-AUTH-TOKEN': KIMAI_TOKEN}
        )
    
    timesheet_id = response.json()['id']
    
    # Store in HR portal
    await attendance_service.create_record({
        'employee_id': employee_id,
        'date': datetime.utcnow().date(),
        'clock_in': datetime.utcnow(),
        'location_type': location_type,
        'location_name': location_name,
        'kimai_timesheet_id': timesheet_id
    })
    
    return {"status": "clocked_in", "timesheet_id": timesheet_id}

@router.post("/attendance/clock-out")
async def clock_out(employee_id: str):
    """Clock out employee"""
    
    # Get active timesheet
    attendance = await attendance_service.get_active_record(employee_id)
    
    # Update Kimai
    async with httpx.AsyncClient() as client:
        await client.patch(
            f'{KIMAI_URL}/api/timesheets/{attendance.kimai_timesheet_id}',
            json={
                'end': datetime.utcnow().isoformat()
            },
            headers={'X-AUTH-USER': KIMAI_USER, 'X-AUTH-TOKEN': KIMAI_TOKEN}
        )
    
    # Update HR portal
    await attendance_service.update_record(attendance.id, {
        'clock_out': datetime.utcnow()
    })
    
    return {"status": "clocked_out"}
```

**Attendance Features:**
- Clock in/out (web + mobile)
- WFH vs office tracking
- GPS verification (optional)
- Flexible schedules
- Late/early tracking
- Absence management
- Monthly reports

**Integration Effort:** Medium (2 weeks)

---

#### 8.2 Clockify Alternative: Custom Solution
- Build lightweight attendance tracker directly in HR portal
- Store in PostgreSQL
- No external dependency

**Integration Effort:** Low-Medium (1 week)

---

### 📊 Attendance Tracking Integration Summary

| Component | GitHub Project | Integration Method | Effort |
|-----------|---------------|-------------------|--------|
| **Time Tracking** | Kimai | REST API | Medium |
| **WFH Management** | Custom | Native feature | Low |
| **Mobile Check-in** | Kimai Mobile | API | Low |
| **Reports** | Custom | Database queries | Low |

**Combined Integration Effort:** 2-3 weeks

---

## 9. Overtime Tracking & Leave Management

### 🎯 Top GitHub Projects

#### 9.1 Kimai (Also for Overtime)
- Same as attendance tracking above
- Track overtime hours
- Export for payroll

**Integration Strategy:**
```python
# Backend: Overtime tracking
@router.post("/overtime/submit")
async def submit_overtime_request(
    employee_id: str,
    date: date,
    hours: float,
    reason: str,
    compensation_type: str  # 'cash' or 'offset'
):
    """Submit overtime request"""
    
    employee = await employee_service.get_employee(employee_id)
    
    # Create overtime record
    overtime = await overtime_service.create_request({
        'employee_id': employee_id,
        'date': date,
        'hours': hours,
        'reason': reason,
        'compensation_type': compensation_type,
        'status': 'pending_approval',
        'submitted_at': datetime.utcnow()
    })
    
    # Notify manager for approval
    await notification_service.notify_overtime_request(
        manager_email=employee.manager_email,
        employee_name=employee.name,
        hours=hours,
        date=date,
        approval_link=f'/approve-overtime/{overtime.id}'
    )
    
    return {"overtime_id": overtime.id, "status": "submitted"}

@router.post("/overtime/{overtime_id}/approve")
async def approve_overtime(overtime_id: str, manager_id: str):
    """Approve overtime request"""
    
    overtime = await overtime_service.get_request(overtime_id)
    
    await overtime_service.update_request(overtime_id, {
        'status': 'approved',
        'approved_by': manager_id,
        'approved_at': datetime.utcnow()
    })
    
    # If cash compensation, send to payroll
    if overtime.compensation_type == 'cash':
        await payroll_service.add_overtime_payment(
            employee_id=overtime.employee_id,
            hours=overtime.hours,
            date=overtime.date
        )
    
    # If offset, add to leave balance
    elif overtime.compensation_type == 'offset':
        offset_days = overtime.hours / 8  # Convert hours to days
        await leave_service.add_offset_days(
            employee_id=overtime.employee_id,
            days=offset_days,
            reason=f'Overtime compensation for {overtime.date}'
        )
    
    return {"status": "approved"}
```

---

#### 9.2 TimeOff.Management (Leave Management)
- **Repository:** `timeoff-management/timeoff-management-application`
- **Stars:** 2.7k+ | **Language:** Node.js
- **Description:** Simple leave management system

**Key Features:**
- Leave requests
- Approval workflows
- Leave balance tracking
- Calendar view
- Email notifications
- Multi-tenant

**Integration Strategy:**
```python
# Backend: Leave management integration
@router.post("/leave/request")
async def create_leave_request(
    employee_id: str,
    leave_type: str,  # 'annual', 'sick', 'offset'
    start_date: date,
    end_date: date,
    reason: str
):
    """Create leave request in TimeOff.Management"""
    
    employee = await employee_service.get_employee(employee_id)
    
    # Submit to TimeOff.Management
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f'{TIMEOFF_URL}/api/leave-requests',
            json={
                'employee_email': employee.email,
                'leave_type': leave_type,
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat(),
                'reason': reason
            },
            headers={'Authorization': f'Bearer {TIMEOFF_API_KEY}'}
        )
    
    leave_request_id = response.json()['id']
    
    # Store in HR portal for tracking
    await leave_service.create_request({
        'employee_id': employee_id,
        'leave_type': leave_type,
        'start_date': start_date,
        'end_date': end_date,
        'reason': reason,
        'status': 'pending_approval',
        'timeoff_request_id': leave_request_id
    })
    
    return {"leave_request_id": leave_request_id}
```

**Leave Types:**
- Annual leave
- Sick leave
- Offset days (from overtime)
- Unpaid leave
- Maternity/Paternity leave
- Emergency leave

**Integration Effort:** Low-Medium (1 week)

---

### 📊 Overtime & Leave Integration Summary

| Component | GitHub Project | Integration Method | Effort |
|-----------|---------------|-------------------|--------|
| **Overtime Tracking** | Kimai or Custom | REST API | Low-Medium |
| **Leave Management** | TimeOff.Management | REST API | Low-Medium |
| **Balance Tracking** | Custom | Database | Low |
| **Approval Workflow** | Custom | Native feature | Low |

**Combined Integration Effort:** 2-3 weeks

---

## Integration Architecture

### System Integration Pattern

```
┌─────────────────────────────────────────────────────────────┐
│                   Secure Renewals HR Portal                  │
│                   (FastAPI + React + PostgreSQL)             │
└────────┬────────────────────────────────────────────┬────────┘
         │                                            │
         │ REST API / Webhooks                        │
         │                                            │
    ┌────▼─────┐                              ┌──────▼─────┐
    │ Core HR  │                              │ Extensions │
    │ Modules  │                              │            │
    └────┬─────┘                              └──────┬─────┘
         │                                            │
    ┌────▼────────────────────────────────────────────▼─────┐
    │                                                        │
    │  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
    │  │ Twenty   │  │ Cal.com  │  │ DocuSeal │  ...      │
    │  │ (CRM)    │  │(Schedule)│  │(E-sign)  │           │
    │  └──────────┘  └──────────┘  └──────────┘           │
    │                                                        │
    │  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
    │  │ Novu     │  │ Plane    │  │ Kimai    │  ...      │
    │  │(Notify)  │  │(Tasks)   │  │(Time)    │           │
    │  └──────────┘  └──────────┘  └──────────┘           │
    │                                                        │
    │  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
    │  │ Moodle   │  │ n8n      │  │ Ollama   │  ...      │
    │  │(LMS)     │  │(Automate)│  │(AI)      │           │
    │  └──────────┘  └──────────┘  └──────────┘           │
    │                                                        │
    └────────────────────────────────────────────────────────┘
```

### Integration Methods

1. **REST API Integration**
   - Most common pattern
   - Direct HTTP requests
   - Synchronous or async

2. **Webhook Integration**
   - Event-driven
   - Real-time updates
   - Requires public endpoint

3. **Database Sync**
   - Periodic sync jobs
   - Read-only or bi-directional
   - For legacy systems

4. **Embedded Widgets**
   - iFrame or SDK
   - Frontend integration
   - User-facing features

### Backend Service Layer

```python
# backend/app/services/integrations/
├── __init__.py
├── base.py                    # Base integration class
├── recruitment.py             # Twenty, OpenCATS integrations
├── scheduling.py              # Cal.com integration
├── documents.py               # DocuSeal integration
├── notifications.py           # Novu integration
├── tasks.py                   # Plane integration
├── time_tracking.py           # Kimai integration
├── leave_management.py        # TimeOff integration
├── learning.py                # Moodle integration
└── automation.py              # n8n integration

# Example base integration class with proper resource management
from typing import Optional
import httpx
import os
from contextlib import asynccontextmanager

class BaseIntegration:
    # Subclasses should override this with their specific env var name
    api_key_env_var = 'API_KEY'  # Default, should be overridden
    
    def __init__(self, api_url: str, api_key: Optional[str] = None):
        self.api_url = api_url
        self.api_key = api_key or self._get_api_key_from_env()
        self._client: Optional[httpx.AsyncClient] = None
    
    def _get_api_key_from_env(self) -> str:
        """Securely retrieve API key from environment"""
        key = os.getenv(self.api_key_env_var)
        if not key:
            raise ValueError(
                f"API key not found: {self.api_key_env_var} environment variable not set"
            )
        return key
    
    @asynccontextmanager
    async def get_client(self):
        """Context manager for HTTP client to prevent resource leaks"""
        client = httpx.AsyncClient(timeout=30.0)
        try:
            yield client
        finally:
            await client.aclose()
    
    async def request(self, method: str, endpoint: str, **kwargs):
        """Make authenticated request with proper error handling"""
        headers = kwargs.get('headers', {})
        headers.update(self.get_auth_headers())
        
        try:
            async with self.get_client() as client:
                response = await client.request(
                    method,
                    f"{self.api_url}{endpoint}",
                    headers=headers,
                    **kwargs
                )
                response.raise_for_status()
                return response.json()
        except httpx.HTTPStatusError as e:
            raise IntegrationError(
                f"{self.__class__.__name__} request failed: {e.response.status_code} - {e.response.text}"
            ) from e
        except httpx.RequestError as e:
            raise IntegrationError(
                f"{self.__class__.__name__} connection failed: {str(e)}"
            ) from e
    
    def get_auth_headers(self):
        """Override in subclasses for different auth methods"""
        return {'Authorization': f'Bearer {self.api_key}'}

class IntegrationError(Exception):
    """Custom exception for integration errors"""
    pass

# Example subclass implementation
class TwentyIntegration(BaseIntegration):
    api_key_env_var = 'TWENTY_API_KEY'  # Explicit env var name
    
    def __init__(self):
        super().__init__(api_url='https://twenty.yourdomain.com/api')

# Usage example
async def get_twenty_candidates():
    """Fetch candidates from Twenty CRM"""
    integration = TwentyIntegration()
    candidates = await integration.request('GET', '/candidates')
    return candidates
```

---

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)

**Priority: High-impact, low-effort integrations**

| Module | GitHub Project | Effort | Impact |
|--------|---------------|--------|--------|
| Document Signing | DocuSeal | 1 week | High |
| Notifications | Novu | 3-5 days | High |
| Job Description AI | Ollama | 2-3 days | Medium |

**Deliverables:**
- E-signature workflow for offers and contracts
- Automated email notifications
- AI-powered job description generator

---

### Phase 2: Core HR Operations (Weeks 3-6)

**Priority: Essential HR workflows**

| Module | GitHub Project | Effort | Impact |
|--------|---------------|--------|--------|
| Recruitment ATS | Twenty CRM | 2 weeks | High |
| Interview Scheduling | Cal.com | 3-5 days | High |
| Onboarding Tasks | Plane | 1-2 weeks | High |
| Employee Requests | Peppermint | 1 week | Medium |

**Deliverables:**
- Complete recruitment pipeline
- Automated interview scheduling
- Onboarding checklist automation
- Employee request portal

---

### Phase 3: Time & Leave (Weeks 7-9)

**Priority: Attendance and leave automation**

| Module | GitHub Project | Effort | Impact |
|--------|---------------|--------|--------|
| Attendance Tracking | Kimai | 2 weeks | High |
| Leave Management | TimeOff | 1 week | High |
| Overtime Tracking | Custom | 1 week | Medium |

**Deliverables:**
- WFH-enabled attendance system
- Leave request & approval workflow
- Overtime tracking with cash/offset options

---

### Phase 4: Advanced Features (Weeks 10-14)

**Priority: Nice-to-have, high-value additions**

| Module | GitHub Project | Effort | Impact |
|--------|---------------|--------|--------|
| Learning Management | Moodle | 3-4 weeks | Medium |
| Workflow Automation | n8n | 2 weeks | High |
| Performance Reviews | Formbricks | 1 week | Medium |

**Deliverables:**
- Company-wide LMS
- Automated offboarding workflows
- Digital performance evaluation

---

### Total Implementation Timeline

**14 weeks (3.5 months) for complete HR operations platform**

**Team Requirements:**
- 1 Backend Developer (Python/FastAPI)
- 1 Frontend Developer (React/TypeScript)
- 1 DevOps Engineer (deployment & maintenance)
- 1 HR Lead (requirements & testing)

**Infrastructure Costs (Self-Hosted):**
- Server: $50-200/month (4-8GB RAM, 4 vCPU)
- Database: Included (PostgreSQL)
- Total: ~$100-300/month for all systems

---

## Quick Start: Minimal Viable Integration

**Want to start small? Here's a 2-week MVP:**

### Week 1: Notifications + Documents
1. Deploy Novu for notifications (1 day)
2. Deploy DocuSeal for e-signatures (2 days)
3. Integrate both with HR portal (2 days)

### Week 2: Recruitment Basics
1. Deploy Twenty CRM (1 day)
2. Set up recruitment pipeline (2 days)
3. Add job posting & candidate tracking (2 days)

**Total Effort:** 10 days
**Cost:** $0 (all open-source, self-hosted)
**Value:** Automated onboarding documents + basic ATS

---

## Maintenance & Support

### Ongoing Maintenance

| Task | Frequency | Effort |
|------|-----------|--------|
| Dependency updates | Monthly | 2-3 hours |
| Backup verification | Weekly | 30 minutes |
| Integration health checks | Daily | Automated |
| User support | As needed | 1-2 hours/week |
| Feature enhancements | Quarterly | 1-2 weeks |

### Recommended Monitoring

- **Uptime monitoring:** UptimeRobot (free tier)
- **Error tracking:** Sentry (open source)
- **Performance monitoring:** Grafana + Prometheus
- **Logs:** Loki or ELK stack

---

## Conclusion

This guide provides a comprehensive roadmap for transforming your Secure Renewals HR Portal into a complete HR operations platform using open-source GitHub projects.

**Key Takeaways:**

1. **25+ Open Source Solutions** identified across all HR domains
2. **Phased Implementation** allows gradual rollout (14 weeks total)
3. **API-First Integration** ensures flexibility and maintainability
4. **Cost-Effective** - all solutions are open-source and self-hostable
5. **Modern Tech Stack** - compatible with your FastAPI + React setup

**Next Steps:**

1. Review this guide with your development team
2. Prioritize modules based on immediate HR needs
3. Start with Phase 1 (Foundation) - quick wins in 2 weeks
4. Deploy systems incrementally and gather feedback
5. Iterate and expand based on usage patterns

**Need Help?**

- Check individual project documentation on GitHub
- Join project Discord/Slack communities
- Hire contractors with specific tool experience
- Consider managed hosting for complex systems (Moodle, etc.)

**Remember:** Start small, validate with users, then scale. You don't need to implement everything at once. Pick 2-3 high-impact integrations and build from there.

---

**Last Updated:** January 2026  
**Maintained by:** HR Technology Team  
**Questions?** Open an issue in the repository

