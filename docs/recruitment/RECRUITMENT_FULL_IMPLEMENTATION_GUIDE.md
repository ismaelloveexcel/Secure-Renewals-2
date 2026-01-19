# Complete Recruitment System - Implementation Guide

**For:** Solo HR in UAE-based Startup  
**System:** Custom Lightweight ATS on FastAPI + React + PostgreSQL  
**Using:** Free GitHub Resources Only  
**Date:** January 2026  
**Status:** Ready to Implement

---

## 🎯 Executive Overview

This guide provides **complete, ready-to-implement code** for a recruitment system designed specifically for solo HR operations in a UAE startup. All components use free, open-source resources from GitHub.

### What You're Building

A complete recruitment system with:
- ✅ Recruitment request management
- ✅ AI-powered CV parsing (pyresparser)
- ✅ Candidate pipeline (Kanban board)
- ✅ Manager Pass (hiring manager interface)
- ✅ Candidate Pass (applicant self-service)
- ✅ Interview scheduling with availability matching
- ✅ Evaluation & feedback capture
- ✅ Offer management & onboarding handoff
- ✅ UAE-specific compliance fields

### Your Flow Alignment

```
Admin/HR:
├── Creates recruitment request
├── Sources candidates (manual or CV upload)
├── AI parses CV → auto-fills candidate data
├── Creates Candidate Pass
├── Creates Manager Pass for hiring manager
├── Sets up interviews
├── Provides availability slots
├── Screens/shortlists candidates
├── Captures evaluations
└── Finalizes candidate → Onboarding

Hiring Manager:
├── Receives Manager Pass
├── Views position details & pipeline
├── Provides interview availability
├── Reviews candidates
├── Submits evaluations
└── Makes hiring decisions

Candidate:
├── Receives Candidate Pass
├── Tracks application status
├── Views interview details
├── Selects interview slot from available times
├── Completes assessments (if applicable)
└── Responds to offer
```

**Key Feature:** Manager provides availability → Automatically appears on Candidate Pass → Candidate confirms → Both passes update in real-time

---

## 📦 Technology Stack (All Free from GitHub)

| Component | Technology | Source |
|-----------|-----------|--------|
| **Backend** | FastAPI | `tiangolo/fastapi` |
| **Database** | PostgreSQL | PostgreSQL.org |
| **ORM** | SQLAlchemy | `sqlalchemy/sqlalchemy` |
| **Migrations** | Alembic | `sqlalchemy/alembic` |
| **Frontend** | React 18 | `facebook/react` |
| **UI Framework** | TailwindCSS | `tailwindlabs/tailwindcss` |
| **DnD (Kanban)** | dnd-kit | `clauderic/dnd-kit` |
| **AI CV Parsing** | pyresparser | `OmkarPathak/pyresparser` |
| **NLP Models** | spaCy | `explosion/spaCy` |
| **Validation** | Pydantic | `pydantic/pydantic` |

**Total Cost:** $0

---

## 🗂️ Phase 1: Database Schema (Day 1-2)

### Step 1.1: Create Alembic Migration

```bash
cd backend
alembic revision -m "add_recruitment_tables"
```

### Step 1.2: Database Models

Create `backend/app/models/recruitment.py`:

```python
"""Recruitment models for ATS system."""
from datetime import date, datetime
from typing import List, Optional

from sqlalchemy import (
    Boolean, Date, DateTime, ForeignKey, Integer, 
    String, Text, DECIMAL, ARRAY, JSON, func
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.renewal import Base


class RecruitmentRequest(Base):
    """Job requisition/opening."""
    
    __tablename__ = "recruitment_requests"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    request_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    
    # Position details
    position_title: Mapped[str] = mapped_column(String(200), nullable=False)
    department: Mapped[str] = mapped_column(String(100), nullable=False)
    hiring_manager_id: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    
    # Request info
    requested_by: Mapped[str] = mapped_column(String(50), nullable=False)
    request_date: Mapped[date] = mapped_column(Date, nullable=False, default=date.today)
    target_hire_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    
    # Position specs
    headcount: Mapped[int] = mapped_column(Integer, default=1)
    employment_type: Mapped[str] = mapped_column(String(50), nullable=False)  # Full-time, Contract, Intern
    job_description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    requirements: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Salary
    salary_range_min: Mapped[Optional[float]] = mapped_column(DECIMAL(10, 2), nullable=True)
    salary_range_max: Mapped[Optional[float]] = mapped_column(DECIMAL(10, 2), nullable=True)
    
    # Status & approvals
    status: Mapped[str] = mapped_column(String(50), default="pending", nullable=False)
    # pending, approved, rejected, filled, cancelled
    approval_status: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    # {requisition: {status, approver, date}, budget: {...}, offer: {...}}
    
    # Manager pass reference
    manager_pass_number: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    
    # Audit
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    candidates: Mapped[List["Candidate"]] = relationship(back_populates="recruitment_request", cascade="all, delete-orphan")


class Candidate(Base):
    """Candidate/applicant for a position."""
    
    __tablename__ = "candidates"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    candidate_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    
    # Link to recruitment request
    recruitment_request_id: Mapped[int] = mapped_column(ForeignKey("recruitment_requests.id"), nullable=False)
    
    # Pass reference
    pass_number: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, index=True)
    
    # Personal info
    full_name: Mapped[str] = mapped_column(String(200), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    
    # Current employment
    current_position: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    current_company: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    years_experience: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Expectations
    expected_salary: Mapped[Optional[float]] = mapped_column(DECIMAL(10, 2), nullable=True)
    notice_period_days: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Source
    source: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    # LinkedIn, Referral, Agency, Direct Application, etc.
    source_details: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Resume
    resume_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    linkedin_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    # Status & stage
    status: Mapped[str] = mapped_column(String(50), default="applied", nullable=False)
    # applied, screening, interview, offer, hired, rejected
    stage: Mapped[str] = mapped_column(String(50), default="applied", nullable=False, index=True)
    stage_changed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Rejection
    rejection_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Notes
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # UAE-specific (parsed from CV or manually entered)
    emirates_id: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    visa_status: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    # Audit
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    recruitment_request: Mapped["RecruitmentRequest"] = relationship(back_populates="candidates")
    interviews: Mapped[List["Interview"]] = relationship(back_populates="candidate", cascade="all, delete-orphan")
    evaluations: Mapped[List["Evaluation"]] = relationship(back_populates="candidate", cascade="all, delete-orphan")


class Interview(Base):
    """Interview scheduling and management."""
    
    __tablename__ = "interviews"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    interview_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    
    # Links
    candidate_id: Mapped[int] = mapped_column(ForeignKey("candidates.id"), nullable=False)
    recruitment_request_id: Mapped[int] = mapped_column(ForeignKey("recruitment_requests.id"), nullable=False)
    
    # Interview details
    interview_type: Mapped[str] = mapped_column(String(50), nullable=False)
    # phone_screen, technical, hr, manager, panel
    interview_round: Mapped[int] = mapped_column(Integer, default=1)
    
    # Availability slots (from hiring manager) - JSONB array
    available_slots: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    # [{"start": "2026-01-10T10:00:00Z", "end": "2026-01-10T11:00:00Z"}, ...]
    
    # Scheduled slot (selected by candidate)
    scheduled_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True, index=True)
    duration_minutes: Mapped[int] = mapped_column(Integer, default=60)
    
    # Interview setup
    interviewer_ids: Mapped[Optional[list]] = mapped_column(ARRAY(String), nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    # Office, Video Call, Phone
    meeting_link: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    # Status
    status: Mapped[str] = mapped_column(String(50), default="pending", nullable=False)
    # pending, slots_provided, scheduled, completed, cancelled
    confirmed_by_candidate: Mapped[bool] = mapped_column(Boolean, default=False)
    confirmed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Completion
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Audit
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    candidate: Mapped["Candidate"] = relationship(back_populates="interviews")
    evaluations: Mapped[List["Evaluation"]] = relationship(back_populates="interview", cascade="all, delete-orphan")


class Evaluation(Base):
    """Interview evaluation/feedback."""
    
    __tablename__ = "evaluations"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    evaluation_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    
    # Links
    interview_id: Mapped[int] = mapped_column(ForeignKey("interviews.id"), nullable=False)
    candidate_id: Mapped[int] = mapped_column(ForeignKey("candidates.id"), nullable=False)
    evaluator_id: Mapped[str] = mapped_column(String(50), nullable=False)
    
    # Scores (1-5 scale)
    technical_skills_score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    communication_score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    cultural_fit_score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    overall_score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Feedback
    strengths: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    concerns: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    additional_comments: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Decision
    recommendation: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    # strong_hire, hire, maybe, no_hire
    next_steps: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Audit
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    interview: Mapped["Interview"] = relationship(back_populates="evaluations")
    candidate: Mapped["Candidate"] = relationship(back_populates="evaluations")
```

### Step 1.3: Pydantic Schemas

Create `backend/app/schemas/recruitment.py`:

```python
"""Pydantic schemas for recruitment module."""
from datetime import date, datetime
from typing import List, Optional, Dict, Any

from pydantic import BaseModel, EmailStr, Field


# Recruitment Request Schemas
class RecruitmentRequestBase(BaseModel):
    position_title: str
    department: str
    hiring_manager_id: Optional[str] = None
    target_hire_date: Optional[date] = None
    headcount: int = 1
    employment_type: str
    job_description: Optional[str] = None
    requirements: Optional[str] = None
    salary_range_min: Optional[float] = None
    salary_range_max: Optional[float] = None


class RecruitmentRequestCreate(RecruitmentRequestBase):
    pass


class RecruitmentRequestUpdate(BaseModel):
    position_title: Optional[str] = None
    department: Optional[str] = None
    hiring_manager_id: Optional[str] = None
    target_hire_date: Optional[date] = None
    employment_type: Optional[str] = None
    job_description: Optional[str] = None
    requirements: Optional[str] = None
    salary_range_min: Optional[float] = None
    salary_range_max: Optional[float] = None
    status: Optional[str] = None


class RecruitmentRequestResponse(RecruitmentRequestBase):
    id: int
    request_number: str
    requested_by: str
    request_date: date
    status: str
    approval_status: Optional[Dict[str, Any]] = None
    manager_pass_number: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Candidate Schemas
class CandidateBase(BaseModel):
    recruitment_request_id: int
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    current_position: Optional[str] = None
    current_company: Optional[str] = None
    years_experience: Optional[int] = None
    expected_salary: Optional[float] = None
    notice_period_days: Optional[int] = None
    source: Optional[str] = None
    source_details: Optional[str] = None
    linkedin_url: Optional[str] = None
    notes: Optional[str] = None
    emirates_id: Optional[str] = None
    visa_status: Optional[str] = None


class CandidateCreate(CandidateBase):
    pass


class CandidateUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    current_position: Optional[str] = None
    current_company: Optional[str] = None
    years_experience: Optional[int] = None
    expected_salary: Optional[float] = None
    notice_period_days: Optional[int] = None
    source: Optional[str] = None
    linkedin_url: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None
    stage: Optional[str] = None
    rejection_reason: Optional[str] = None


class CandidateResponse(CandidateBase):
    id: int
    candidate_number: str
    pass_number: Optional[str] = None
    resume_path: Optional[str] = None
    status: str
    stage: str
    stage_changed_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Interview Schemas
class InterviewSlot(BaseModel):
    start: datetime
    end: datetime


class InterviewBase(BaseModel):
    candidate_id: int
    recruitment_request_id: int
    interview_type: str
    interview_round: int = 1
    duration_minutes: int = 60
    interviewer_ids: Optional[List[str]] = None
    location: Optional[str] = None
    meeting_link: Optional[str] = None


class InterviewCreate(InterviewBase):
    pass


class InterviewUpdate(BaseModel):
    interview_type: Optional[str] = None
    duration_minutes: Optional[int] = None
    interviewer_ids: Optional[List[str]] = None
    location: Optional[str] = None
    meeting_link: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class InterviewSlotsProvide(BaseModel):
    available_slots: List[InterviewSlot]


class InterviewSlotConfirm(BaseModel):
    selected_slot: InterviewSlot


class InterviewResponse(InterviewBase):
    id: int
    interview_number: str
    available_slots: Optional[Dict[str, Any]] = None
    scheduled_date: Optional[datetime] = None
    status: str
    confirmed_by_candidate: bool
    confirmed_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Evaluation Schemas
class EvaluationBase(BaseModel):
    interview_id: int
    candidate_id: int
    technical_skills_score: Optional[int] = Field(None, ge=1, le=5)
    communication_score: Optional[int] = Field(None, ge=1, le=5)
    cultural_fit_score: Optional[int] = Field(None, ge=1, le=5)
    overall_score: Optional[int] = Field(None, ge=1, le=5)
    strengths: Optional[str] = None
    concerns: Optional[str] = None
    additional_comments: Optional[str] = None
    recommendation: Optional[str] = None
    next_steps: Optional[str] = None


class EvaluationCreate(EvaluationBase):
    pass


class EvaluationResponse(EvaluationBase):
    id: int
    evaluation_number: str
    evaluator_id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Resume Parsing Schemas
class ParsedResumeData(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    mobile_number: Optional[str] = None
    skills: List[str] = []
    experience: List[str] = []
    education: List[str] = []
    designation: List[str] = []
    company_names: List[str] = []
    degree: List[str] = []
    college_name: List[str] = []
    total_experience: Optional[int] = None
    parsed: bool = False
    error: Optional[str] = None
```

### Step 1.4: Run Migration

```bash
alembic upgrade head
```

**Status:** ✅ Database ready (Day 1-2)

---

## 🔧 Phase 2: AI Resume Parsing Service (Day 3)

### Step 2.1: Install Dependencies

Add to `backend/pyproject.toml`:

```toml
[project.dependencies]
pyresparser = ">=1.0.6"
spacy = ">=3.7.0"
pdfminer.six = ">=20221105"
python-docx = ">=1.1.0"
nltk = ">=3.8.1"
python-multipart = ">=0.0.9"
```

Install:

```bash
cd backend
pip install pyresparser spacy pdfminer.six python-docx nltk python-multipart

# Download AI models
python -m spacy download en_core_web_sm
python -c "import nltk; nltk.download('stopwords'); nltk.download('punkt')"
```

### Step 2.2: Create Resume Parser Service

Create `backend/app/services/resume_parser.py`:

```python
"""AI-powered resume parsing service using pyresparser."""
from typing import Dict, Optional
from pathlib import Path
import re
import logging

try:
    from pyresparser import ResumeParser
    PYRESPARSER_AVAILABLE = True
except ImportError:
    PYRESPARSER_AVAILABLE = False
    logging.warning("pyresparser not available. Resume parsing will be disabled.")


logger = logging.getLogger(__name__)


class ResumeParserService:
    """Service for parsing resumes using AI/NLP."""
    
    SUPPORTED_FORMATS = ['.pdf', '.docx', '.doc', '.txt']
    
    def __init__(self):
        if not PYRESPARSER_AVAILABLE:
            logger.warning("Resume parsing functionality disabled - pyresparser not installed")
    
    async def parse_resume(self, file_path: str) -> Dict:
        """
        Parse resume and extract structured data using AI.
        
        Args:
            file_path: Path to resume file
            
        Returns:
            Dict with extracted data (name, email, phone, skills, etc.)
        """
        if not PYRESPARSER_AVAILABLE:
            return {
                'error': 'Resume parsing not available',
                'parsed': False
            }
        
        try:
            # Validate file format
            file_ext = Path(file_path).suffix.lower()
            if file_ext not in self.SUPPORTED_FORMATS:
                raise ValueError(f"Unsupported format: {file_ext}")
            
            # Parse using pyresparser (AI-powered)
            parser = ResumeParser(file_path)
            data = parser.get_extracted_data()
            
            # Clean and structure data
            cleaned_data = self._clean_parsed_data(data)
            
            # Extract UAE-specific data
            with open(file_path, 'rb') as f:
                text_content = str(f.read())
            uae_data = self._extract_uae_specific_data(text_content)
            cleaned_data.update(uae_data)
            
            return cleaned_data
            
        except Exception as e:
            logger.error(f"Resume parsing error: {str(e)}")
            return {
                'error': str(e),
                'parsed': False
            }
    
    def _clean_parsed_data(self, data: Dict) -> Dict:
        """Clean and structure parsed data."""
        return {
            'name': data.get('name', ''),
            'email': data.get('email', ''),
            'mobile_number': self._clean_phone(data.get('mobile_number', '')),
            'skills': data.get('skills', []),
            'experience': data.get('experience', []),
            'education': data.get('education', []),
            'designation': data.get('designation', []),
            'company_names': data.get('company_names', []),
            'degree': data.get('degree', []),
            'college_name': data.get('college_name', []),
            'total_experience': data.get('total_experience', 0),
            'parsed': True
        }
    
    def _clean_phone(self, phone: str) -> str:
        """Clean and format phone number for UAE."""
        if not phone:
            return ''
        # Remove spaces and special chars
        cleaned = ''.join(filter(str.isdigit, str(phone)))
        # Add UAE country code if missing
        if cleaned and len(cleaned) >= 9:
            if not cleaned.startswith('971'):
                cleaned = '971' + cleaned
            return '+' + cleaned
        return phone  # Return original if can't clean
    
    def _extract_uae_specific_data(self, text: str) -> Dict:
        """Extract UAE-specific information from resume text."""
        data = {}
        
        # Extract Emirates ID
        eid_pattern = r'784-?\d{4}-?\d{7}-?\d{1}'
        eid_match = re.search(eid_pattern, text)
        if eid_match:
            data['emirates_id'] = eid_match.group(0)
        
        # Extract Visa status keywords
        visa_keywords = ['visa status', 'residency visa', 'work permit', 'employment visa']
        for keyword in visa_keywords:
            if keyword.lower() in text.lower():
                # Try to extract surrounding context
                pattern = rf'.{{0,50}}{re.escape(keyword)}.{{0,50}}'
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    data['visa_status'] = match.group(0).strip()
                    break
        
        return data


# Singleton instance
resume_parser_service = ResumeParserService()
```

**Status:** ✅ AI CV Parsing Ready (Day 3)

---

## 🚀 Phase 3: Backend API Endpoints (Day 4-6)

### Step 3.1: Recruitment Service

Create `backend/app/services/recruitment_service.py`:

```python
"""Business logic for recruitment operations."""
from datetime import datetime, date
from typing import List, Optional
from sqlalchemy import select, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.recruitment import (
    RecruitmentRequest, Candidate, Interview, Evaluation
)
from app.models.passes import Pass
from app.schemas.recruitment import (
    RecruitmentRequestCreate, RecruitmentRequestUpdate,
    CandidateCreate, CandidateUpdate,
    InterviewCreate, InterviewUpdate,
    EvaluationCreate
)


class RecruitmentService:
    """Service for recruitment operations."""
    
    async def create_request(
        self,
        session: AsyncSession,
        data: RecruitmentRequestCreate,
        created_by: str
    ) -> RecruitmentRequest:
        """Create a new recruitment request."""
        # Generate request number
        request_number = await self._generate_request_number(session)
        
        # Create request
        request = RecruitmentRequest(
            request_number=request_number,
            requested_by=created_by,
            request_date=date.today(),
            approval_status={
                'requisition': {'status': 'pending', 'approver': None, 'date': None},
                'budget': {'status': 'pending', 'approver': None, 'date': None},
                'offer': {'status': 'pending', 'approver': None, 'date': None}
            },
            **data.model_dump()
        )
        
        session.add(request)
        await session.commit()
        await session.refresh(request)
        
        # Create manager pass if hiring manager specified
        if request.hiring_manager_id:
            manager_pass = await self._create_manager_pass(session, request, created_by)
            request.manager_pass_number = manager_pass.pass_number
            await session.commit()
            await session.refresh(request)
        
        return request
    
    async def add_candidate(
        self,
        session: AsyncSession,
        data: CandidateCreate,
        created_by: str
    ) -> Candidate:
        """Add a new candidate to the pipeline."""
        # Generate candidate number
        candidate_number = await self._generate_candidate_number(session)
        
        # Create candidate
        candidate = Candidate(
            candidate_number=candidate_number,
            stage='applied',
            status='applied',
            stage_changed_at=datetime.now(),
            **data.model_dump()
        )
        
        session.add(candidate)
        await session.commit()
        await session.refresh(candidate)
        
        # Create candidate pass
        candidate_pass = await self._create_candidate_pass(session, candidate, created_by)
        candidate.pass_number = candidate_pass.pass_number
        await session.commit()
        await session.refresh(candidate)
        
        return candidate
    
    async def move_candidate_stage(
        self,
        session: AsyncSession,
        candidate_id: int,
        new_stage: str
    ) -> Candidate:
        """Move candidate to a new stage in the pipeline."""
        result = await session.execute(
            select(Candidate).where(Candidate.id == candidate_id)
        )
        candidate = result.scalar_one_or_none()
        
        if not candidate:
            raise ValueError("Candidate not found")
        
        # Update stage
        candidate.stage = new_stage
        candidate.stage_changed_at = datetime.now()
        
        # Update status based on stage
        stage_status_map = {
            'applied': 'applied',
            'screening': 'screening',
            'interview': 'interview',
            'offer': 'offer',
            'hired': 'hired',
            'rejected': 'rejected'
        }
        candidate.status = stage_status_map.get(new_stage, candidate.status)
        
        await session.commit()
        await session.refresh(candidate)
        
        return candidate
    
    async def _generate_request_number(self, session: AsyncSession) -> str:
        """Generate unique request number: RRF-YYYYMMDD-XXXX."""
        today = date.today().strftime('%Y%m%d')
        
        # Get count of requests created today
        result = await session.execute(
            select(RecruitmentRequest).where(
                RecruitmentRequest.request_number.like(f'RRF-{today}-%')
            )
        )
        count = len(result.scalars().all())
        
        return f"RRF-{today}-{count + 1:04d}"
    
    async def _generate_candidate_number(self, session: AsyncSession) -> str:
        """Generate unique candidate number: CAN-YYYYMMDD-XXXX."""
        today = date.today().strftime('%Y%m%d')
        
        result = await session.execute(
            select(Candidate).where(
                Candidate.candidate_number.like(f'CAN-{today}-%')
            )
        )
        count = len(result.scalars().all())
        
        return f"CAN-{today}-{count + 1:04d}"
    
    async def _create_manager_pass(
        self,
        session: AsyncSession,
        request: RecruitmentRequest,
        created_by: str
    ) -> Pass:
        """Create manager pass for hiring manager."""
        from datetime import timedelta
        
        # Generate pass number
        today = date.today().strftime('%Y%m%d')
        result = await session.execute(
            select(Pass).where(Pass.pass_number.like(f'MGR-{today}-%'))
        )
        count = len(result.scalars().all())
        pass_number = f"MGR-{today}-{count + 1:04d}"
        
        # Create pass
        manager_pass = Pass(
            pass_number=pass_number,
            pass_type='manager',
            full_name=request.hiring_manager_id,  # Will be resolved to name
            department=request.department,
            position=request.position_title,
            valid_from=date.today(),
            valid_until=date.today() + timedelta(days=90),  # 3 months
            purpose=f"Recruitment: {request.position_title} (Request: {request.request_number})",
            status='active',
            created_by=created_by
        )
        
        session.add(manager_pass)
        await session.commit()
        await session.refresh(manager_pass)
        
        return manager_pass
    
    async def _create_candidate_pass(
        self,
        session: AsyncSession,
        candidate: Candidate,
        created_by: str
    ) -> Pass:
        """Create recruitment pass for candidate."""
        from datetime import timedelta
        
        # Generate pass number
        today = date.today().strftime('%Y%m%d')
        result = await session.execute(
            select(Pass).where(Pass.pass_number.like(f'REC-{today}-%'))
        )
        count = len(result.scalars().all())
        pass_number = f"REC-{today}-{count + 1:04d}"
        
        # Create pass
        candidate_pass = Pass(
            pass_number=pass_number,
            pass_type='recruitment',
            full_name=candidate.full_name,
            email=candidate.email,
            phone=candidate.phone,
            position=candidate.current_position,
            valid_from=date.today(),
            valid_until=date.today() + timedelta(days=60),  # 2 months
            purpose=f"Candidate application (Ref: {candidate.candidate_number})",
            status='active',
            created_by=created_by
        )
        
        session.add(candidate_pass)
        await session.commit()
        await session.refresh(candidate_pass)
        
        return candidate_pass


recruitment_service = RecruitmentService()
```

### Step 3.2: API Router

Create `backend/app/routers/recruitment.py`:

```python
"""API endpoints for recruitment module."""
from typing import List, Optional
from fastapi import (
    APIRouter, Depends, HTTPException, File, UploadFile,
    Query, status
)
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
import tempfile
import os
from pathlib import Path

from app.core.security import require_role
from app.database import get_session
from app.routers.auth import get_current_employee_id
from app.schemas.recruitment import *
from app.services.recruitment_service import recruitment_service
from app.services.resume_parser import resume_parser_service
from app.models.recruitment import (
    RecruitmentRequest, Candidate, Interview, Evaluation
)

router = APIRouter(prefix="/recruitment", tags=["recruitment"])


# ============================================================================
# RECRUITMENT REQUESTS
# ============================================================================

@router.post("/requests", response_model=RecruitmentRequestResponse, status_code=status.HTTP_201_CREATED)
async def create_recruitment_request(
    data: RecruitmentRequestCreate,
    employee_id: str = Depends(get_current_employee_id),
    role: str = Depends(require_role(["admin", "hr"])),
    session: AsyncSession = Depends(get_session)
):
    """Create a new recruitment request."""
    request = await recruitment_service.create_request(session, data, employee_id)
    return request


@router.get("/requests", response_model=List[RecruitmentRequestResponse])
async def list_recruitment_requests(
    status_filter: Optional[str] = Query(None, alias="status"),
    role: str = Depends(require_role(["admin", "hr"])),
    session: AsyncSession = Depends(get_session)
):
    """List all recruitment requests."""
    query = select(RecruitmentRequest)
    
    if status_filter:
        query = query.where(RecruitmentRequest.status == status_filter)
    
    query = query.order_by(RecruitmentRequest.created_at.desc())
    
    result = await session.execute(query)
    requests = result.scalars().all()
    
    return requests


@router.get("/requests/{request_id}", response_model=RecruitmentRequestResponse)
async def get_recruitment_request(
    request_id: int,
    role: str = Depends(require_role(["admin", "hr"])),
    session: AsyncSession = Depends(get_session)
):
    """Get recruitment request details."""
    result = await session.execute(
        select(RecruitmentRequest).where(RecruitmentRequest.id == request_id)
    )
    request = result.scalar_one_or_none()
    
    if not request:
        raise HTTPException(status_code=404, detail="Recruitment request not found")
    
    return request


# ============================================================================
# CANDIDATES
# ============================================================================

@router.post("/candidates", response_model=CandidateResponse, status_code=status.HTTP_201_CREATED)
async def add_candidate(
    data: CandidateCreate,
    employee_id: str = Depends(get_current_employee_id),
    role: str = Depends(require_role(["admin", "hr"])),
    session: AsyncSession = Depends(get_session)
):
    """Add a new candidate manually."""
    candidate = await recruitment_service.add_candidate(session, data, employee_id)
    return candidate


@router.get("/candidates", response_model=List[CandidateResponse])
async def list_candidates(
    recruitment_request_id: Optional[int] = Query(None),
    stage: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    role: str = Depends(require_role(["admin", "hr"])),
    session: AsyncSession = Depends(get_session)
):
    """List all candidates with optional filters."""
    query = select(Candidate)
    
    filters = []
    if recruitment_request_id:
        filters.append(Candidate.recruitment_request_id == recruitment_request_id)
    if stage:
        filters.append(Candidate.stage == stage)
    if status_filter:
        filters.append(Candidate.status == status_filter)
    
    if filters:
        query = query.where(and_(*filters))
    
    query = query.order_by(Candidate.created_at.desc())
    
    result = await session.execute(query)
    candidates = result.scalars().all()
    
    return candidates


@router.post("/candidates/{candidate_id}/stage", response_model=CandidateResponse)
async def move_candidate_stage(
    candidate_id: int,
    new_stage: str = Query(...),
    role: str = Depends(require_role(["admin", "hr"])),
    session: AsyncSession = Depends(get_session)
):
    """Move candidate to a new stage."""
    candidate = await recruitment_service.move_candidate_stage(session, candidate_id, new_stage)
    return candidate


# ============================================================================
# AI RESUME PARSING
# ============================================================================

@router.post("/parse-resume")
async def parse_resume(
    file: UploadFile = File(...),
    role: str = Depends(require_role(["admin", "hr"]))
):
    """
    Parse uploaded resume using AI to extract candidate data.
    
    Supports: PDF, DOCX, DOC, TXT
    Returns structured data: name, email, phone, skills, experience, education
    """
    # Save uploaded file temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix=Path(file.filename).suffix) as tmp_file:
        content = await file.read()
        tmp_file.write(content)
        tmp_file_path = tmp_file.name
    
    try:
        # Parse resume using AI
        parsed_data = await resume_parser_service.parse_resume(tmp_file_path)
        
        return {
            "success": True,
            "filename": file.filename,
            "data": parsed_data
        }
        
    finally:
        # Clean up temp file
        if os.path.exists(tmp_file_path):
            os.remove(tmp_file_path)


@router.post("/candidates/from-resume", response_model=CandidateResponse, status_code=status.HTTP_201_CREATED)
async def create_candidate_from_resume(
    file: UploadFile = File(...),
    recruitment_request_id: int = Query(...),
    source: str = Query("Resume Upload"),
    employee_id: str = Depends(get_current_employee_id),
    role: str = Depends(require_role(["admin", "hr"])),
    session: AsyncSession = Depends(get_session)
):
    """
    Create candidate directly from resume using AI parsing.
    
    Automatically extracts and populates candidate data.
    """
    # Parse resume
    with tempfile.NamedTemporaryFile(delete=False, suffix=Path(file.filename).suffix) as tmp_file:
        content = await file.read()
        tmp_file.write(content)
        tmp_file_path = tmp_file.name
    
    try:
        # Parse using AI
        parsed_data = await resume_parser_service.parse_resume(tmp_file_path)
        
        if not parsed_data.get('parsed'):
            raise HTTPException(
                status_code=400,
                detail=f"Failed to parse resume: {parsed_data.get('error', 'Unknown error')}"
            )
        
        # Create candidate from parsed data
        candidate_data = CandidateCreate(
            recruitment_request_id=recruitment_request_id,
            full_name=parsed_data.get('name', 'Unknown'),
            email=parsed_data.get('email', ''),
            phone=parsed_data.get('mobile_number', ''),
            current_position=parsed_data.get('designation', [''])[0] if parsed_data.get('designation') else '',
            years_experience=parsed_data.get('total_experience', 0),
            source=source,
            notes=f"Skills: {', '.join(parsed_data.get('skills', []))}\n" +
                  f"Education: {', '.join(parsed_data.get('education', []))}",
            emirates_id=parsed_data.get('emirates_id'),
            visa_status=parsed_data.get('visa_status')
        )
        
        # Create candidate
        candidate = await recruitment_service.add_candidate(session, candidate_data, employee_id)
        
        # Save resume file
        resume_dir = Path("storage/resumes")
        resume_dir.mkdir(parents=True, exist_ok=True)
        resume_path = resume_dir / f"{candidate.candidate_number}_{file.filename}"
        
        with open(resume_path, 'wb') as f:
            f.write(content)
        
        # Update candidate with resume path
        candidate.resume_path = str(resume_path)
        await session.commit()
        await session.refresh(candidate)
        
        return candidate
        
    finally:
        if os.path.exists(tmp_file_path):
            os.remove(tmp_file_path)


# ============================================================================
# INTERVIEWS
# ============================================================================

@router.post("/interviews", response_model=InterviewResponse, status_code=status.HTTP_201_CREATED)
async def schedule_interview(
    data: InterviewCreate,
    role: str = Depends(require_role(["admin", "hr"])),
    session: AsyncSession = Depends(get_session)
):
    """Schedule a new interview."""
    # Generate interview number
    from datetime import date
    today = date.today().strftime('%Y%m%d')
    result = await session.execute(
        select(Interview).where(Interview.interview_number.like(f'INT-{today}-%'))
    )
    count = len(result.scalars().all())
    interview_number = f"INT-{today}-{count + 1:04d}"
    
    interview = Interview(
        interview_number=interview_number,
        status='pending',
        **data.model_dump()
    )
    
    session.add(interview)
    await session.commit()
    await session.refresh(interview)
    
    return interview


@router.post("/interviews/{interview_id}/slots")
async def provide_availability_slots(
    interview_id: int,
    data: InterviewSlotsProvide,
    role: str = Depends(require_role(["admin", "hr"])),
    session: AsyncSession = Depends(get_session)
):
    """Hiring manager provides availability slots."""
    result = await session.execute(
        select(Interview).where(Interview.id == interview_id)
    )
    interview = result.scalar_one_or_none()
    
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    
    # Store slots
    interview.available_slots = {
        'slots': [slot.model_dump() for slot in data.available_slots]
    }
    interview.status = 'slots_provided'
    
    await session.commit()
    await session.refresh(interview)
    
    return {
        "success": True,
        "interview_id": interview_id,
        "slots_provided": len(data.available_slots),
        "status": interview.status
    }


@router.post("/interviews/{interview_id}/confirm")
async def confirm_interview_slot(
    interview_id: int,
    data: InterviewSlotConfirm,
    session: AsyncSession = Depends(get_session)
):
    """Candidate confirms an interview slot."""
    result = await session.execute(
        select(Interview).where(Interview.id == interview_id)
    )
    interview = result.scalar_one_or_none()
    
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    
    # Set scheduled time
    interview.scheduled_date = data.selected_slot.start
    interview.duration_minutes = int(
        (data.selected_slot.end - data.selected_slot.start).total_seconds() / 60
    )
    interview.confirmed_by_candidate = True
    interview.confirmed_at = datetime.now()
    interview.status = 'scheduled'
    
    await session.commit()
    await session.refresh(interview)
    
    return {
        "success": True,
        "interview_id": interview_id,
        "scheduled_date": interview.scheduled_date,
        "status": interview.status
    }


# ============================================================================
# EVALUATIONS
# ============================================================================

@router.post("/evaluations", response_model=EvaluationResponse, status_code=status.HTTP_201_CREATED)
async def submit_evaluation(
    data: EvaluationCreate,
    employee_id: str = Depends(get_current_employee_id),
    role: str = Depends(require_role(["admin", "hr"])),
    session: AsyncSession = Depends(get_session)
):
    """Submit interview evaluation."""
    # Generate evaluation number
    from datetime import date
    today = date.today().strftime('%Y%m%d')
    result = await session.execute(
        select(Evaluation).where(Evaluation.evaluation_number.like(f'EVAL-{today}-%'))
    )
    count = len(result.scalars().all())
    evaluation_number = f"EVAL-{today}-{count + 1:04d}"
    
    evaluation = Evaluation(
        evaluation_number=evaluation_number,
        evaluator_id=employee_id,
        **data.model_dump()
    )
    
    session.add(evaluation)
    await session.commit()
    await session.refresh(evaluation)
    
    # Optionally move candidate stage based on recommendation
    if data.recommendation in ['strong_hire', 'hire']:
        result = await session.execute(
            select(Candidate).where(Candidate.id == data.candidate_id)
        )
        candidate = result.scalar_one_or_none()
        
        if candidate and candidate.stage == 'interview':
            candidate.stage = 'offer'
            candidate.stage_changed_at = datetime.now()
            await session.commit()
    
    return evaluation
```

### Step 3.3: Register Router

In `backend/app/main.py`, add:

```python
from app.routers import recruitment

app.include_router(recruitment.router, prefix="/api")
```

**Status:** ✅ Backend API Complete (Day 4-6)

---

*Due to length limitations, I'll continue in the next part with:*
- Phase 4: Frontend Components (Kanban, Pass interfaces)
- Phase 5: Manager & Candidate Pass Pages
- Phase 6: Interview Scheduling UI
- Phase 7: Deployment & Testing

Would you like me to continue with the remaining phases?

