# Recruitment System - Quick Reference Guide

**Status:** Research & Planning Complete ✅  
**Recommendation:** Build Custom Lightweight ATS (Not integrate external system)  
**Implementation Time:** 3-5 weeks  
**Cost:** $0 (development time only)

---

## 🎯 Executive Decision Summary

### What Was Researched
Evaluated all major open-source recruitment/ATS systems on GitHub:
- ✅ OpenCATS (PHP-based ATS)
- ✅ Twenty CRM (Modern CRM adaptable to recruitment)
- ✅ Odoo HR Recruitment Module
- ✅ Various other ATS and HR systems

### Why External Systems Don't Fit

| System | Issue |
|--------|-------|
| **OpenCATS** | PHP stack, separate deployment, no pass support, legacy UI |
| **Twenty CRM** | Not an ATS (needs heavy customization), separate deployment, GraphQL complexity |
| **Odoo** | Massive framework, too heavy for solo HR, complex deployment |
| **Others** | Either unmaintained, too basic, or not truly open source |

### The Problem
**Your workflow is unique:**
- ✨ Pass-based system (Manager Pass + Candidate Pass)
- ✨ Linked fields between passes (availability matching)
- ✨ Solo HR operations focus
- ✨ Already have infrastructure (FastAPI + React + PostgreSQL)

**No external ATS supports this** ❌

---

## ✅ Recommended Solution: Custom Build

### Why Build Instead of Integrate?

**You Already Have 80% Built:**
- Database (PostgreSQL) ✅
- API (FastAPI) ✅
- Frontend (React) ✅
- Authentication ✅
- Pass System ✅

**Just Need to Add:**
- Recruitment-specific models (4 tables)
- API endpoints for recruitment
- Frontend components (Kanban, pass interfaces)

**Time Comparison:**
- Build custom: **3-5 weeks**
- Integrate OpenCATS: **6-8 weeks** + dual maintenance
- Integrate Twenty: **5-7 weeks** + heavy customization
- Integrate Odoo: **10-14 weeks** + complexity overhead

---

## 📋 What Gets Built - Phase by Phase

### Phase 1: Core Models (Week 1)
**Deliverable:** Database foundation
- `recruitment_requests` table (job requisitions)
- `candidates` table (candidate profiles)
- `interviews` table (scheduling)
- `evaluations` table (feedback)

**Time:** 3-5 days

### Phase 2: Candidate Pipeline (Week 1-2)
**Deliverable:** Visual tracking
- Kanban board (Applied → Screening → Interview → Offer → Hired)
- Drag-and-drop stage transitions
- Candidate profile pages

**Time:** 4-6 days

### Phase 3: Manager Pass (Week 2)
**Deliverable:** Hiring manager interface
- Position details
- Approval status (requisition, budget, offer)
- Pipeline snapshot
- Candidate list with scores
- Interview scheduling

**Time:** 3-4 days

### Phase 4: Candidate Pass (Week 2-3)
**Deliverable:** Candidate interface
- Application status tracker
- Stage progress visualization
- Interview details
- Next actions (submit docs, confirm interview)
- HR contact links

**Time:** 3-4 days

### Phase 5: Interview Scheduling (Week 3)
**Deliverable:** Availability matching
- Manager enters available slots
- Candidate sees slots on their pass
- Candidate confirms preferred slot
- Auto-notifications to both parties

**Time:** 4-5 days

### Phase 6: Evaluations (Week 3-4)
**Deliverable:** Feedback capture
- Evaluation forms (customizable criteria)
- Score submission
- Decision workflow (hire/reject)
- Display on candidate profile

**Time:** 3-4 days

### Phase 7: Finalization (Week 4)
**Deliverable:** Hire & handoff
- Offer generation
- Acceptance/rejection
- Auto-convert: Recruitment Pass → Onboarding Pass
- Link to employee master

**Time:** 3-4 days

---

## 🔄 How Linked Fields Work

### Example: Interview Availability Matching

```
MANAGER PASS                     CANDIDATE PASS
┌─────────────────┐             ┌─────────────────┐
│ Manager enters  │             │                 │
│ available slots:│             │                 │
│                 │             │                 │
│ □ Jan 10, 10am  │────────────►│ ✓ Jan 10, 10am │
│ □ Jan 10, 2pm   │             │ □ Jan 10, 2pm   │
│ □ Jan 11, 10am  │             │ □ Jan 11, 10am  │
└─────────────────┘             └─────────────────┘
                                 Candidate selects
                                        │
                                        ▼
┌─────────────────┐             ┌─────────────────┐
│ Interview       │◄────────────│ Confirmed:      │
│ confirmed for:  │             │ Jan 10, 2pm     │
│ Jan 10, 2pm     │             │                 │
└─────────────────┘             └─────────────────┘
```

**Both passes update in real-time** when either party takes action.

---

## 📊 Database Structure (High-Level)

```
recruitment_requests (Job openings)
    ├── candidates (People applying)
    │   ├── interviews (Scheduled meetings)
    │   │   └── evaluations (Feedback)
    │   └── passes (Candidate pass)
    └── passes (Manager pass)
```

**Key Relationships:**
- 1 Request → Many Candidates
- 1 Candidate → 1 Pass (recruitment type)
- 1 Request → 1 Pass (manager type)
- 1 Candidate → Many Interviews
- 1 Interview → Many Evaluations

---

## 🔐 Access Control

| Action | Admin | HR | Manager | Candidate |
|--------|-------|-----|---------|-----------|
| Create request | ✅ | ✅ | Request | ❌ |
| Add candidate | ✅ | ✅ | ❌ | ❌ |
| Move stage | ✅ | ✅ | ❌ | ❌ |
| Provide interview slots | ✅ | ✅ | ✅ | ❌ |
| Confirm interview | ❌ | ❌ | ❌ | ✅ |
| Submit evaluation | ✅ | ✅ | ✅ | ❌ |
| View manager pass | ✅ | ✅ | Own | ❌ |
| View candidate pass | ✅ | ✅ | Read | Own |

---

## 🚀 Optional Integrations (If Needed Later)

**Cal.com** (Interview Scheduling)
- Calendar sync (Google/Outlook)
- Automated reminders
- **Effort:** 2-3 days

**pyresparser** (AI Resume Parsing) ⭐ **RECOMMENDED**
- **AI-powered CV parsing** using spaCy NLP models
- Extract data from PDF/DOCX resumes automatically
- Auto-fill candidate info (name, email, phone, skills, experience, education)
- **85% accuracy** with machine learning
- **Saves 5-10 minutes per candidate**
- Supports bulk resume upload
- **Effort:** 1-2 days
- **Cost:** $0 (free open source)
- **See:** [AI_CV_PARSING_SOLUTIONS.md](./AI_CV_PARSING_SOLUTIONS.md) for complete guide

**pdfme** (Document Generation)
- Generate offer letters
- Professional templates
- **Effort:** 1-2 days

**Total Optional:** 4-7 days extra

**Recommended Priority:**
1. ⭐ AI Resume Parsing (pyresparser) - Highest ROI, major time savings
2. Interview Scheduling (Cal.com) - Enhanced UX
3. Document Generation (pdfme) - Professional output

---

## 📈 Benefits Over External Systems

| Benefit | Custom Build | External ATS |
|---------|-------------|--------------|
| **Single Deployment** | ✅ | ❌ (dual systems) |
| **Pass System Support** | ✅ Native | ❌ Not supported |
| **Solo HR Optimized** | ✅ Designed for it | ❌ Enterprise-focused |
| **Tech Stack** | ✅ Unified (FastAPI/React) | ❌ Mixed (PHP/Python) |
| **Customization** | ✅ Full control | ⚠️ Limited |
| **Maintenance** | ✅ Single codebase | ❌ Two codebases |
| **Launch Time** | ✅ 3-5 weeks | ❌ 6-14 weeks |
| **Learning Curve** | ✅ Team knows stack | ❌ New system |

---

## 🎯 Future Expansion (Documented, Not Built Yet)

### External Recruiter Portal
Allow agencies to:
- Log in separately
- View assigned positions
- Upload candidates directly
- Track commissions

### Public Job Board
Allow candidates to:
- Browse open positions
- Apply online
- Upload resume
- Get instant candidate pass

### Assessment Tests
Integrate with:
- HackerRank (technical tests)
- Custom skill tests
- Personality assessments

### Bulk Import
Support:
- CSV candidate import
- Recruitment fair data
- Database transfers

---

## 📖 Full Documentation

**Comprehensive Guides Created:**

1. **[RECRUITMENT_SYSTEMS_RESEARCH.md](./RECRUITMENT_SYSTEMS_RESEARCH.md)**
   - Detailed analysis of all GitHub ATS options
   - Pros/cons of each system
   - Why custom build is recommended
   - Complete comparison tables
   - Implementation timeline breakdown

2. **[RECRUITMENT_IMPLEMENTATION_ARCHITECTURE.md](./RECRUITMENT_IMPLEMENTATION_ARCHITECTURE.md)**
   - System architecture diagrams
   - Database schema design
   - API endpoint specifications
   - Data flow diagrams
   - State machines
   - Security & access control
   - Performance considerations
   - Testing strategy
   - Deployment checklist

---

## ✅ What's Already Done

Your existing system has:
- ✅ Pass infrastructure (`passes` table)
- ✅ Pass API endpoints
- ✅ Pass frontend components
- ✅ Authentication & authorization
- ✅ Database (PostgreSQL)
- ✅ API framework (FastAPI)
- ✅ Frontend framework (React + TypeScript)
- ✅ Audit logging
- ✅ Notification foundation

**You're 80% there!** Just need recruitment-specific additions.

---

## 💡 Recommended Next Steps

### Option 1: Full Implementation (Recommended)
Implement all 7 phases in sequence:
- **Timeline:** 3-5 weeks
- **Result:** Complete recruitment system with pass integration
- **Cost:** Development time only ($0 licensing)

### Option 2: MVP First
Implement Phases 1-4 only (core + passes):
- **Timeline:** 2-3 weeks
- **Result:** Basic recruitment tracking with pass system
- **Later:** Add scheduling, evaluations, finalization

### Option 3: Hybrid Approach
Start with custom build, add Cal.com for scheduling:
- **Timeline:** 3-5 weeks core + 2-3 days Cal.com
- **Result:** Full system with advanced calendar features

---

## 🤔 Questions Before Starting?

Please confirm your preferences:

1. **Priority:** Manager Pass or Candidate Pass first?
2. **Interview Types:** How many rounds? (phone, technical, HR, panel?)
3. **Evaluation Criteria:** What do you evaluate? (for forms)
4. **Approvals:** Who approves requisition/budget/offer?
5. **Sourcing:** What sources do you track? (LinkedIn, agencies, etc.)
6. **External Recruiters:** Soon or later?
7. **Public Job Board:** Soon or later?

---

## 📞 Ready to Start?

**Status:** ✅ Research Complete, Ready for Implementation

**Recommendation Approved?**
- [ ] Yes → Begin Phase 1 (Core Models)
- [ ] Need clarification → Ask questions
- [ ] Want to explore external options → Discuss further

---

**Last Updated:** January 2026  
**Prepared by:** HR Assistant & System Strategist  
**For:** Solo HR Recruitment Operations
