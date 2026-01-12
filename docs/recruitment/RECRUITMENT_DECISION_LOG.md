# Recruitment System - Decision Log

**Project:** Secure Renewals HR Portal - Recruitment Module  
**Date:** January 2026  
**Status:** Awaiting Approval

---

## 🎯 The Ask

**Original Request:**
> "I am finalising the recruitment part of the portal and the flow is as follows for now (to be revised later). Admin creates the recruitment requests; sources for candidates; creates recruitment pass for hiring manager- provides interview set ups; availability; screens/shortlist candidates; provides interview evaluation & finalises candidate. Candidate receives such a pass as well; and is to keep updated; confirms interview; do assessment if applicable. The passes is supposed to cut down the multiple communications by emails/follow ups. Everything is on the pass corresponding fields are linked between hiring manager pass and candidate pass (for eg manager provides interview availability- same appears on candidate pass for them to choose their desired slot).
>
> Expansion future- recruitment requests- raised by hiring manager will be linked to thus directly. External parties (agencies/freelancing recruiters) will also have access to upload their candidates directly) + candidates applying online.
>
> Act as my HR assistant cum system strategist. Task- look for some recruitment services system (free) available on github which can be implemented in my system (inside not external). Something for solo HR."

---

## 🔍 Research Conducted

### GitHub Systems Evaluated

#### 1. OpenCATS (Open Source ATS)
- **Repository:** `opencats/OpenCATS`
- **Stars:** 1.5k+
- **Technology:** PHP (LAMP stack)
- **Assessment:**
  - ✅ Complete ATS functionality
  - ✅ Resume parsing, job postings, interview scheduling
  - ❌ PHP-based (different tech stack)
  - ❌ Requires separate LAMP deployment
  - ❌ Legacy UI
  - ❌ No pass system support
  - ❌ Too complex for solo HR
  - **DECISION:** Not suitable

#### 2. Twenty CRM
- **Repository:** `twentyhq/twenty`
- **Stars:** 15k+
- **Technology:** TypeScript/React/GraphQL
- **Assessment:**
  - ✅ Modern UI (React-based)
  - ✅ Customizable
  - ❌ It's a CRM, not an ATS
  - ❌ Requires separate deployment
  - ❌ Heavy customization needed
  - ❌ GraphQL learning curve
  - ❌ No recruitment-specific features
  - ❌ No pass system
  - **DECISION:** Not suitable

#### 3. Odoo HR Recruitment Module
- **Repository:** `odoo/odoo`
- **Stars:** 35k+
- **Technology:** Python
- **Assessment:**
  - ✅ Python-based (matches stack)
  - ✅ Complete recruitment module
  - ❌ Entire Odoo framework required (massive)
  - ❌ Very heavy resource usage
  - ❌ Complex deployment
  - ❌ Steep learning curve
  - ❌ Overkill for solo HR
  - ❌ No pass system
  - **DECISION:** Not suitable

#### 4. Jobberbase
- **Repository:** `jobberbase/jobberbase`
- **Stars:** 300+
- **Assessment:**
  - ❌ Unmaintained (last update 2020)
  - ❌ Just a job board, no ATS features
  - **DECISION:** Not suitable

#### 5. Other Systems
- Various other recruitment/HR systems evaluated
- Issues: Unmaintained, too basic, not truly open source, or proprietary
- **DECISION:** None suitable

---

## 💡 Recommendation Rationale

### Why Build Custom vs Integrate External?

#### Your Unique Requirements
1. **Pass-Based Workflow**
   - Manager Pass for hiring managers
   - Candidate Pass for applicants
   - Linked fields (real-time sync between passes)
   - **No external ATS supports this**

2. **Solo HR Operations**
   - Lightweight, not enterprise-scale
   - Simple workflow, not complex pipelines
   - Minimal maintenance burden
   - **External systems are too heavy**

3. **Existing Infrastructure**
   - FastAPI backend ✅
   - React frontend ✅
   - PostgreSQL database ✅
   - Authentication system ✅
   - Pass infrastructure ✅
   - **80% already built**

#### Time Comparison

| Approach | Timeline | Maintenance | Fit |
|----------|----------|-------------|-----|
| **Custom Build** | 3-5 weeks | Low | Perfect |
| OpenCATS Integration | 6-8 weeks | High | Poor |
| Twenty CRM Integration | 5-7 weeks | High | Poor |
| Odoo Integration | 10-14 weeks | Very High | Poor |

#### Cost Comparison

| Approach | Dev Cost | Infrastructure | Licensing | Maintenance | Total |
|----------|----------|----------------|-----------|-------------|-------|
| **Custom Build** | 3-5 weeks | $0 (existing) | $0 | Low | Lowest |
| External Integration | 6-14 weeks | New stack | $0 | High | Highest |

### The Deciding Factors

1. **Unique Workflow = Custom Solution**
   - Your pass-based system with linked fields is unique
   - No external system supports this
   - Would require heavy customization anyway
   - Custom build is cleaner and faster

2. **Already Have Infrastructure**
   - 80% of needed infrastructure exists
   - Same tech stack (FastAPI + React)
   - Just need recruitment-specific features
   - Incremental addition vs dual system

3. **Solo HR Focus**
   - External systems designed for enterprises
   - Too complex for single-person operations
   - Custom build optimized for solo HR
   - Simpler, cleaner, easier to maintain

4. **Faster Time to Market**
   - Custom: 3-5 weeks
   - External: 6-14 weeks + ongoing complexity
   - Incremental delivery (phase by phase)
   - Can start with MVP and expand

---

## ✅ Final Recommendation

### Build Custom Lightweight ATS

**On existing FastAPI + React + PostgreSQL stack**

**Implementation:** 7 phases over 3-5 weeks

1. **Phase 1:** Core Models (3-5 days)
2. **Phase 2:** Candidate Pipeline (4-6 days)
3. **Phase 3:** Manager Pass (3-4 days)
4. **Phase 4:** Candidate Pass (3-4 days)
5. **Phase 5:** Interview Scheduling (4-5 days)
6. **Phase 6:** Evaluations (3-4 days)
7. **Phase 7:** Finalization (3-4 days)

**Total:** 24-33 days

**Cost:** $0 (development time only)

---

## 📊 Risk Assessment

### Risks of Custom Build

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Development takes longer | Low | Medium | Incremental delivery, MVP first |
| Missing features | Low | Low | Can add features incrementally |
| Maintenance burden | Low | Low | Single codebase, team knows stack |

### Risks of External Integration

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Integration complexity | High | High | Hard to mitigate |
| Tech stack mismatch | High | High | Would need separate deployment |
| Doesn't fit workflow | Certain | High | No mitigation possible |
| Dual system maintenance | Certain | High | No mitigation possible |
| Longer timeline | High | High | No mitigation possible |

**Winner:** Custom Build (lower risk profile)

---

## 🎯 Success Criteria

### How We'll Measure Success

1. **Timeline Met:** Complete in 3-5 weeks
2. **Pass Integration:** Manager & Candidate passes working with linked fields
3. **Solo HR Optimized:** Simple enough for single person to manage
4. **Time Savings:** 50-75 hours saved annually
5. **Zero Email Chains:** All coordination through passes
6. **Future Ready:** Architecture supports Phase 2 expansion

---

## 📋 Pre-Implementation Questions

Before starting Phase 1, need answers to:

1. **Priority:** Manager Pass or Candidate Pass first?
   - Recommendation: Manager Pass (HR needs it first)

2. **Interview Types:** How many rounds typically?
   - Phone Screen
   - Technical Interview
   - HR Interview
   - Manager Interview
   - Panel Interview
   - Other?

3. **Evaluation Criteria:** What skills/attributes to evaluate?
   - Technical skills
   - Communication
   - Cultural fit
   - Problem-solving
   - Other?

4. **Approval Workflow:** Who approves what?
   - Requisition approval: ?
   - Budget approval: ?
   - Offer approval: ?

5. **Sourcing Categories:** What sources to track?
   - LinkedIn
   - Agencies
   - Referrals
   - Direct applications
   - Job boards
   - Other?

6. **External Recruiters:** Timeline for agency portal?
   - Soon (Phase 1)
   - Later (Phase 2)

7. **Public Job Board:** Timeline for candidate applications?
   - Soon (Phase 1)
   - Later (Phase 2)

---

## 📖 Documentation References

All research and architecture documented in:

1. **[RECRUITMENT_EXECUTIVE_SUMMARY.md](./RECRUITMENT_EXECUTIVE_SUMMARY.md)**
   - Start here for overview
   - Visual roadmap and timeline
   - Decision framework

2. **[RECRUITMENT_QUICK_REFERENCE.md](./RECRUITMENT_QUICK_REFERENCE.md)**
   - Quick reference guide
   - Phase summaries
   - FAQ

3. **[RECRUITMENT_SYSTEMS_RESEARCH.md](./RECRUITMENT_SYSTEMS_RESEARCH.md)**
   - Detailed analysis of all GitHub options
   - Complete comparison tables
   - Build vs Buy breakdown

4. **[RECRUITMENT_IMPLEMENTATION_ARCHITECTURE.md](./RECRUITMENT_IMPLEMENTATION_ARCHITECTURE.md)**
   - Technical architecture
   - Database schema
   - API specifications
   - Security design
   - Deployment checklist

---

## ✍️ Decision

**Date:** _Pending_  
**Decision Maker:** Project Owner  
**Decision:**
- [ ] ✅ Approved - Proceed with custom build
- [ ] 🤔 Need more information
- [ ] 🔄 Explore alternative approaches

**If approved, next step:** Begin Phase 1 (Core Models) - 3-5 days

---

## 📝 Notes

_Space for additional comments or requirements:_

---

**Last Updated:** January 2026  
**Status:** Awaiting Decision  
**Prepared by:** HR Assistant & System Strategist
