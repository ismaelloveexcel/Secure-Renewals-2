# HR Templates Reference Guide

This document provides a comprehensive reference for the professional HR templates available in the Secure Renewals HR Portal.

## Template Architecture

All templates utilize a **JSON-based schema** (v2.0) designed for enterprise-grade HR operations:

- **Configurable Competencies** - Customize evaluation criteria and weighting
- **Professional Rating Scales** - Numeric ratings with descriptive labels
- **OKR Framework Support** - Objectives and Key Results methodology
- **Continuous Feedback Integration** - Year-round performance documentation
- **Dynamic Sections** - Flexible forms adapted to organizational needs
- **Workflow Automation** - Built-in notifications and approval processes
- **Confidentiality Controls** - Role-based access and data protection

---

## Available Templates

### 1. Annual Performance Evaluation - Non-Managerial Staff

**Type:** `performance_evaluation`  
**Category:** `non_managerial`  
**Schema Version:** 2.0

#### Overview
A comprehensive evaluation framework for individual contributors, designed to assess core competencies, document achievements, and establish development goals aligned with organizational objectives.

#### Key Features:
- Professional numeric rating scale (1-5) with detailed descriptors
- Configurable competency weights totaling 100%
- SMART goal tracking with OKR format support
- Continuous feedback documentation throughout the evaluation period
- Structured self-assessment with guided prompts
- Automated workflow with configurable deadlines and notifications

#### Competency Framework:

**Core Competencies (85% total weight)**

| Competency | Weight | Description |
|------------|--------|-------------|
| Job Knowledge & Skills | 20% | Technical proficiency, role understanding, continuous learning |
| Quality of Work | 20% | Accuracy, thoroughness, attention to detail |
| Productivity & Efficiency | 15% | Output volume, deadline management, resource optimization |
| Communication & Collaboration | 15% | Written/verbal skills, teamwork, relationship building |
| Initiative & Problem Solving | 15% | Proactivity, analytical thinking, solution development |

**Values & Culture (15% total weight)**

| Competency | Weight | Status |
|------------|--------|--------|
| Integrity & Ethics | 10% | Required |
| Adaptability & Growth Mindset | 5% | Optional |

#### Rating Scale:

| Rating | Label | Code | Description |
|--------|-------|------|-------------|
| 5 | Outstanding | O | Exceptional performance; consistently exceeds expectations |
| 4 | Exceeds Expectations | EE | Frequently surpasses job requirements |
| 3 | Meets Expectations | ME | Consistently meets job requirements |
| 2 | Developing | D | Occasionally meets expectations; development needed |
| 1 | Needs Improvement | NI | Performance below expectations; immediate action required |

#### Workflow Process:
1. **Self Assessment** — Employee (7 business days)
2. **Manager Review** — Direct Manager (7 business days)
3. **Calibration** — HR (optional)
4. **Review Discussion** — Employee + Manager (5 business days)
5. **Employee Acknowledgment** — Employee (3 business days)

---

### 2. Leadership Performance Evaluation - Managerial Staff

**Type:** `performance_evaluation`  
**Category:** `managerial`  
**Schema Version:** 2.0

#### Overview
A comprehensive leadership assessment framework designed for managers and supervisors, incorporating multi-rater feedback, team performance metrics, and strategic objective tracking.

#### Key Features:
- Multi-rater (360°) feedback integration
- Key Performance Indicator (KPI) tracking
- Team performance metrics dashboard
- Strategic OKR tracking and alignment
- Leadership competency framework

#### Leadership Competencies:

| Competency | Weight | Description |
|------------|--------|-------------|
| Strategic Thinking & Vision | 15% | Direction setting, organizational alignment |
| People Leadership & Development | 20% | Coaching, talent development, succession planning |
| Decision Making & Judgment | 15% | Analytical thinking, accountability |
| Stakeholder Management | 15% | Relationship building, influence, communication |
| Performance Management | 10% | Expectations setting, feedback, development |
| Operational Efficiency | 10% | Process improvement, resource optimization |
| Financial Acumen | 10% | Budget management, cost awareness |
| Innovation & Change Leadership | 5% | Change management, innovation culture |

#### Team Performance Metrics (Auto-Populated):
- Current team size and organizational structure
- Annual turnover rate and retention metrics
- Employee engagement survey scores
- Internal promotions and career progression
- Average training and development hours

#### Workflow Process:
1. **Self Assessment** — Manager (10 business days)
2. **Multi-Rater Feedback Collection** — System (14 business days)
3. **Supervisor Review** — Senior Manager (7 business days)
4. **Leadership Calibration** — HR (required)
5. **Review Discussion** — Manager + Supervisor (5 business days)
6. **Acknowledgment** — Manager (3 business days)

---

### 3. Employee of the Year Award Nomination

**Type:** `recognition_nomination`  
**Award Type:** `employee_of_the_year`  
**Schema Version:** 2.0

#### Overview
A formal nomination process for the organization's most prestigious employee recognition award, designed to identify and celebrate exceptional contributors who exemplify organizational values and deliver outstanding results.

#### Eligibility Criteria:
- Minimum one (1) year of continuous service
- No active performance improvement plans or disciplinary actions
- Demonstrated excellence across multiple performance dimensions
- Strong record of attendance and professional conduct

#### Evaluation Categories:

| Category | Weight | Description |
|----------|--------|-------------|
| Professional Excellence | 25% | Exceptional performance exceeding expectations |
| Values & Culture Ambassador | 20% | Consistent demonstration of organizational values |
| Collaboration & Team Contribution | 20% | Exceptional teamwork and colleague support |
| Innovation & Continuous Improvement | 20% | Process improvements and innovative solutions |
| Business Impact & Results | 15% | Measurable positive organizational impact |

#### Nomination Components:
- Nominee information and eligibility verification
- Professional relationship and nominator credentials
- Significant achievements with business impact documentation
- Comprehensive nomination rationale statement
- Optional professional endorsements
- Supporting documentation and evidence

#### Selection Workflow:
1. **Draft Nomination** — Nominator creates nomination
2. **Submission** — Formal submission with confirmation
3. **HR Eligibility Review** — Verification (5 business days)
4. **Selection Committee Evaluation** — Scoring and ranking
5. **Final Selection** — Committee decision
6. **Award Announcement** — Public recognition

---

## API Reference

### List All Templates
```http
GET /api/templates
```

### Filter Templates by Type
```http
GET /api/templates?type=performance_evaluation
```

### Retrieve Specific Template
```http
GET /api/templates/{template_id}
```

### Create New Template
```http
POST /api/templates
Content-Type: application/json

{
  "name": "Custom Evaluation Template",
  "type": "performance_evaluation",
  "content": { /* JSON schema */ }
}
```

### Create Template Revision
```http
POST /api/templates/{template_id}/revision
Content-Type: application/json

{
  "content": { /* Updated JSON schema */ },
  "revision_note": "Updated competency weightings per HR policy review"
}
```

---

## JSON Schema Reference

### Template Structure
```json
{
  "schema_version": "2.0",
  "template_type": "performance_evaluation",
  "category": "non_managerial",
  "title": "Annual Performance Evaluation",
  "confidentiality_notice": "CONFIDENTIAL",
  "settings": {
    "allow_self_assessment": true,
    "enable_continuous_feedback": true,
    "rating_style": "numeric",
    "display_mode": "professional"
  },
  "rating_scales": { ... },
  "competencies": { ... },
  "sections": [ ... ],
  "workflow": { ... },
  "signatures": { ... }
}
```

### Competency Definition
```json
{
  "id": "job_knowledge",
  "name": "Job Knowledge & Skills",
  "description": "Technical proficiency, role understanding, continuous learning",
  "weight": 20,
  "required": true,
  "behaviors": [
    "Demonstrates thorough understanding of job responsibilities",
    "Applies technical skills effectively",
    "Seeks opportunities for professional development"
  ]
}
```

### Section Types

| Type | Description |
|------|-------------|
| `dynamic_list` | Add multiple structured items (achievements, goals) |
| `goal_tracker` | SMART goals with OKR framework support |
| `feedback_log` | Continuous feedback documentation |
| `rich_text` | Long-form narrative with guided prompts |
| `tag_select` | Selection from predefined categories |
| `kpi_tracker` | Key Performance Indicator metrics |
| `metrics_dashboard` | Auto-populated performance metrics |
| `okr_tracker` | Objectives and Key Results tracking |
| `feedback_360` | Multi-rater feedback collection |
| `achievement_cards` | Structured achievement documentation |
| `media_upload` | Supporting document attachments |
| `structured_reflection` | Guided self-assessment questions |

---

## Configuration Guide

### Customizing Competency Weights
```json
{
  "competencies": {
    "configurable": true,
    "allow_custom": true,
    "categories": [
      {
        "id": "department_specific",
        "name": "Department-Specific Competencies",
        "items": [
          {
            "id": "custom_competency",
            "name": "Custom Competency Name",
            "description": "Detailed description of expected behaviors",
            "weight": 15,
            "required": true
          }
        ]
      }
    ]
  }
}
```

### Configuring Rating Labels
```json
{
  "rating_scales": {
    "default": {
      "type": "numeric",
      "min": 1,
      "max": 5,
      "labels": {
        "5": {
          "text": "Outstanding",
          "short": "O",
          "color": "#059669",
          "description": "Exceptional performance in all areas"
        }
      }
    }
  }
}
```

### Workflow Configuration
```json
{
  "workflow": {
    "steps": [
      {
        "id": "review_step",
        "name": "Manager Review",
        "actor": "manager",
        "deadline_days": 7
      }
    ],
    "notifications": {
      "enabled": true,
      "channels": ["email", "in_app"],
      "reminders": [7, 3, 1]
    }
  }
}
```

---

## Database Seeding

To populate templates in a new environment:

```bash
cd backend
uv run python ../scripts/seed_hr_templates.py
```

---

## Best Practices

1. **Align with Organizational Strategy** — Ensure competency weights reflect strategic priorities
2. **Establish Consistent Timelines** — Define realistic deadlines for each workflow stage
3. **Enable Continuous Feedback** — Document performance throughout the year, not just annually
4. **Set Measurable Objectives** — Use the OKR framework for clear, quantifiable goals
5. **Implement Multi-Rater Feedback** — Leverage 360° feedback for leadership assessments
6. **Maintain Confidentiality** — Apply appropriate access controls to sensitive information

---

## Related Documentation

- [HR User Guide](HR_USER_GUIDE.md)
- [HR Implementation Plan](HR_IMPLEMENTATION_PLAN.md)
- [Process Simplification (UAE)](PROCESS_SIMPLIFICATION_UAE.md)

---

*Last Updated: January 2025 | Schema Version 2.0*  
*CONFIDENTIAL — Internal Use Only*
