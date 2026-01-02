# HR Implementation Blueprint & Admin Hardening Plan

**Audience:** HR leadership, system owners, and implementers  
**Goal:** Provide a pragmatic path to migrate employees (Excel source), structure HR operations (probation/onboarding/recruitment/pass generation/offboarding/requests/docs), and harden the admin portal.

---

## 1) Employee Migration & List Maintenance

**Source file:** `Employees-Employee Database- Github.csv` (already in repo root).  
**Target API:** `POST /api/employees/import` (CSV with headers: `employee_id,name,email,department,date_of_birth,role`).

**Migration steps (1–2 days):**
1. **Profiling:** Open the Excel/CSV, validate headers, and normalize DOB to `DDMMYYYY` (8 digits, no separators). Convert common inputs like `DD/MM/YYYY` or `YYYY-MM-DD` into that exact 8-digit string before import; store a canonical ISO `YYYY-MM-DD` copy in the database for interoperability.
2. **Data hygiene:** Deduplicate `employee_id`, enforce roles (`admin|hr|viewer`), and fill missing emails/departments.
3. **Staging import:** Use `/api/employees/import` in a non-prod environment; capture the returned summary (`created|skipped|errors`).
4. **Fix & re-run:** Correct errored rows, re-upload until zero errors.
5. **Production import:** Run the same flow in prod; download the summary for audit storage.

**Ongoing maintenance:**
- **Monthly delta import:** Export new/changed employees from the HRIS to CSV and re-run `/employees/import` (existing IDs are skipped).
- **Access hygiene:** Run `/employees?active_only=false` monthly; deactivate leavers via `DELETE /employees/{employee_id}`.
- **Password posture:** Use `/employees/reset-password` for exceptions; enforce password-change-on-first-login via current backend logic.
- **Audit trail:** Store each import summary (created/skipped/error counts) in a shared HR folder.

---

## 2) HR Operations Menu (under Admin)

Add submenus to the Admin area so HR work is grouped and permissions stay centralized. Each item below can be backed by a feature toggle (see existing `/admin/features` and categories in `admin.py`):

1. **Recruitment & Offers**  
   - Track candidates, offers, start dates, and pre-boarding tasks.  
   - Statuses: `sourcing → interview → offer → accepted → start-ready`.
2. **Onboarding Checklists**  
   - Task templates per department (IT access, equipment, documents).  
   - Owner & due date per task; show SLA countdown on the dashboard.
3. **Probation Tracking**  
   - Capture probation start/end, reviewers, checkpoints, and decision (pass/extend/fail).  
   - Automatic reminders 30/14/7 days before end.
4. **Pass/Access Generation**  
   - Store badge/pass requests with type, location, and expiry.  
   - Integrate with the existing `passes` router; expose approval + print/export actions.
5. **Employee Requests Desk**  
   - Lightweight ticketing for letters, changes, or support.  
   - Categories + attachment support; auto-acknowledge via email when notifications are enabled.
6. **Offboarding**  
   - Checklist for asset return, access revocation, and final pay inputs.  
   - Block account login via `DELETE /employees/{id}` when completed.
7. **Document Automation**  
   - Templates for offer letters, probation confirmations, NOCs, and experience letters.  
   - Fill from employee + request context; generate PDF and log to the employee record.
8. **Reports & Audit**  
   - CSV exports and KPI tiles (open onboarding tasks, probation ending soon, pending passes).

---

## 3) Admin Portal Secrecy & Security Hardening

Immediate actions (no backend rewrite required):
1. **Entry gate:** Put the Admin tile behind a feature toggle (e.g., `admin_portal_enabled`) and display the tile only when enabled.  
2. **Access code on entry:** Require a short-lived admin access code (env-driven, rotated daily by default and configurable for 6–12 hour intervals in high-security environments) before showing the admin login modal; use 12+ random characters and store attempts in the audit log.
3. **Rate limiting & alerts:** Leverage existing `slowapi` limiter (already wired in `main.py`) for `/auth/login`; add alerting on repeated failures from the same IP.
4. **Audit everything:** Log admin logins, feature-toggle changes, imports, password resets, and deactivations with actor + timestamp.
5. **Network allowlist (deployment):** Restrict admin routes to corporate IP/VPN at the reverse proxy level.

---

## 4) Lightweight Delivery Plan (2–4 weeks)

- **Week 1:** Data migration (staging → prod), enable feature toggles for Admin menu, implement access-code gate on Admin entry, and surface import summaries.  
- **Week 2:** Ship Onboarding + Probation submenus with checklist CRUD and reminders.  
- **Week 3:** Add Recruitment (basic pipeline) and Pass/Access (hook to `passes` router).  
- **Week 4:** Employee Requests + Document templates (PDF generation), then Offboarding with account deactivation hook.

---

## 5) Automation & Templates

- **Doc templates:** Store DOCX/Markdown templates per document type; render via backend service (e.g., docx templating) and return signed PDFs. Validate and sanitize all dynamic fields (allowlist expected fields, escape user input with an HTML/Markdown sanitizer, and use parameterized rendering with template auto-escaping) to prevent template/code injection; add a Content Security Policy when serving generated documents.  
- **Reminders:** Use a daily cron/worker to email or post Teams/Slack reminders for probation, onboarding tasks, and pending passes.  
- **Exports:** Provide CSV exports for each submenu; align columns with the import schema for round-tripping data.

---

## 6) Success Criteria

- All employees from the provided Excel are imported with zero errors and monthly delta imports are scheduled.  
- Admin area exposes clear submenus for each HR operation listed above, gated by feature toggles and an access code.  
- Probation/onboarding/pass/offboarding/request flows each have: owner, due date, status, and export.  
- Document automation can generate the top HR letters (offer, probation confirmation, NOC, experience) with audit logs.
