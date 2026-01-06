# Secure Renewals HR Portal

## Overview

An internal HR portal for managing employee contract renewals, onboarding passes, and employee records. The application serves non-technical HR users who need to track contract renewals, manage employee data, and generate access passes for recruitment and onboarding processes.

The system follows a standard full-stack architecture with a FastAPI backend and React frontend, designed for deployment on Replit with PostgreSQL database support.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Backend (Python/FastAPI)

**Framework**: FastAPI with async support for high-performance API handling.

**Architecture Pattern**: Layered architecture with clear separation:
- **Routers** (`app/routers/`): Handle HTTP endpoints and request validation
- **Services** (`app/services/`): Business logic layer
- **Repositories** (`app/repositories/`): Database access layer
- **Schemas** (`app/schemas/`): Pydantic models for request/response validation

**Database**: PostgreSQL with async driver (asyncpg). Uses SQLAlchemy ORM with Alembic for migrations.

**Key Models**:
- `Employee`: User accounts with 30+ fields (role, job title, function, line manager, location, salary, leave entitlement, probation dates, visa status, etc.)
- `EmployeeProfile`: Self-service profile data (emergency contact, bank details, address, ID documents)
- `OnboardingToken`: Secure single-use invite tokens for new joiners (7-day expiry)
- `Renewal`: Contract renewal requests with approval workflow
- `Pass`: Recruitment/onboarding access passes
- `SystemSetting`: Feature toggles for admin configuration

**Authentication**: JWT-based authentication using employee ID and password. Initial password is DOB in DDMMYYYY format, requiring change on first login. Legacy Azure AD/SSO support exists but Employee ID + Password is the primary method.

**Security Features**:
- Role-based access control (admin, hr, viewer)
- Input sanitization via HTML escaping
- Rate limiting with slowapi
- CORS middleware configuration

### Frontend (React/TypeScript)

**Framework**: React 19 with TypeScript, built using Vite.

**Styling**: TailwindCSS v4 for utility-first CSS.

**Structure**: Single-page application with section-based navigation. Currently implements a dashboard home screen with placeholder sections for Employees, Onboarding, External Users, and Admin.

**API Communication**: Fetch-based API service layer (`src/services/api.ts`) with typed request/response handling.

### Database Schema

Eight main tables with migrations managed by Alembic:
1. `employees` - User accounts and authentication (76 employees seeded)
2. `renewals` - Contract renewal tracking with audit log
3. `passes` - Access pass management
4. `system_settings` - Feature toggles and configuration
5. `employee_compliance` - Visa/work permit/medical fitness tracking linked by employee_id
6. `employee_bank` - Bank details with self-service workflow (pending_changes, verified_by, verified_at)
7. `employee_documents` - Document registry with file uploads, OCR data, verification status
8. `employee_profiles` - Extended profile data (emergency contacts, personal info)

### Key Features

**Recruitment Pass System** (New):
- **Candidate Pass** (CPASS-xxx): Self-service portal for candidates
  - Journey tracker showing recruitment stages (Applied → Screening → Assessment → Interview → Offer → Onboarding)
  - Interview slot booking with calendar view
  - Inbox for HR communications
  - WhatsApp/Email quick contact options
  - Entity-specific color coding (Blue for Watergeneration, Green for Agriculture)
- **Manager Pass** (MPASS-xxx): Position management for hiring managers
  - Pipeline view with candidate counts by stage
  - Document tracking (JD, Recruitment Form status)
  - Interview setup panel (format, rounds, assessment requirements)
  - Time slot management with bulk creation
  - Confirmed interviews calendar
  - Access via "Manager Pass" buttons on recruitment request cards

**Interview Scheduling Flow**:
1. Manager sets up interview configuration (format, rounds)
2. Manager creates available time slots
3. Candidate views slots and books preferred time
4. Candidate confirms booking
5. Both parties see confirmed interview in calendar

**Self-Service Onboarding System**:
- Employee profile completion with progress tracking
- Self-service bank details submission requiring HR approval
- Document upload with OCR auto-extraction (EID/passport patterns)
- Tabbed profile UI: Overview, Personal, Documents, Compliance

**HR Dashboard Features**:
- Compliance Alerts Dashboard (Quick Access button for HR/Admin)
- Color-coded urgency: Red=expired, Orange=7 days, Yellow=30 days, Amber=60 days
- Bulk CSV import with Employee ID matching
- View Profile integration from alerts

**Document Registry**:
- Supported types: passport, visa, emirates_id, work_permit, medical_fitness, contract, educational, training, security_clearance
- OCR integration using Tesseract with EID pattern matching
- Expiry tracking and verification workflow

### Development Setup

- Backend runs on port 5001 (uvicorn)
- Frontend runs on port 5000 (Vite dev server)
- Database migrations via `alembic upgrade head`

### Pulling data from Replit & quick app analysis

Use this when you need to grab the live data and a quick health snapshot from the running Replit workspace.

1. Open the Replit Shell (Secrets must already include `DATABASE_URL`).
2. Run the helper script (saves everything to `exports/` by default):
   ```bash
   bash scripts/replit_data_pull.sh
   ```
   - Optional: choose a different output folder → `bash scripts/replit_data_pull.sh ./custom_exports` (or any workspace path you prefer)
3. Artifacts produced:
   - `replit_db.dump` (binary `pg_dump` for restore)
   - `replit_db.sql` (plain SQL export)
   - `app_snapshot.tar.gz` (backend, frontend, `.replit` config, and top-level docs)
   - `scan_report.json` (result of the built-in `proactive_scan` code analysis)
4. Download the files from the Replit Files panel or with `wget`/`curl` if you prefer CLI.
5. For a standalone health check without exporting data:
   ```bash
   python scripts/proactive_scan.py --full
   ```

## External Dependencies

### Database
- **PostgreSQL**: Primary database with asyncpg driver for async operations
- Connection string configured via `DATABASE_URL` environment variable

### Python Packages (Backend)
- `fastapi`: Web framework
- `uvicorn`: ASGI server
- `sqlalchemy` + `asyncpg`: Async database ORM
- `alembic`: Database migrations
- `python-jose`: JWT token handling
- `pydantic-settings`: Configuration management
- `httpx`: HTTP client for external requests
- `slowapi`: Rate limiting

### JavaScript Packages (Frontend)
- `react` + `react-dom`: UI framework
- `vite`: Build tool and dev server
- `tailwindcss` + `postcss` + `autoprefixer`: Styling
- `typescript`: Type safety

### External Services
- No external third-party services currently integrated
- JWKS endpoint configured for potential Azure AD/SSO integration (currently using local JWT signing)

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `AUTH_SECRET_KEY`: JWT signing secret (defaults to dev key)
- `APP_ENV`: Runtime environment (development/production)
