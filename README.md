# Secure Renewals HR Portal

> 🏢 Internal application for securely managing employee contract renewals and onboarding checks.

[![License](https://img.shields.io/badge/license-ISC-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/)
[![React](https://img.shields.io/badge/react-18.3-blue.svg)](https://react.dev/)

---

## 📋 Table of Contents

- [Quick Start for HR Users](#-quick-start-for-hr-users)
- [GitHub Copilot Agents](#-github-copilot-agents)
- [Documentation](#-documentation)
- [Features](#-features)
- [Project Structure](#-project-structure)
- [Tech Stack](#-tech-stack)
- [Setup Guide](#-setup-guide)
- [Authentication](#-authentication)
- [Deployment](#-deployment)

---

## 🚀 Quick Start for HR Users

**New to the system?** Start here:

1. 📖 Read the [HR User Guide](docs/HR_USER_GUIDE.md) - Simple, step-by-step instructions
2. 🔑 Get your authentication token from IT
3. 🌐 Open the portal URL in your browser
4. ✅ Enter your token and start managing renewals!

**Need help?** Check the [Troubleshooting section](docs/HR_USER_GUIDE.md#troubleshooting) in the user guide.

---

## 🤖 GitHub Copilot Agents

**Need development assistance?** We have specialized AI agents to help!

### Available Agents

| Agent | Purpose | Use When |
|-------|---------|----------|
| [HR Assistant](.github/agents/hr-assistant.md) | HR workflows & portal engineering | Planning features, automation ideas, finding HR modules |
| [Portal Engineer](.github/agents/portal-engineer.md) | Technical implementation | Building features, fixing bugs, optimizing code |
| [Code Quality Monitor](.github/agents/code-quality-monitor.md) | Security & quality scanning | Checking security, code quality, performance |

### Quick Start with Agents

```bash
# Get help planning a feature
Open: .github/agents/hr-assistant.md
Ask: "Help me implement an onboarding module"

# Get help with implementation
Open: .github/agents/portal-engineer.md  
Ask: "Create API endpoints for probation tracking"

# Check code quality
Open: .github/agents/code-quality-monitor.md
Ask: "Scan for security vulnerabilities"
```

**📖 Full Documentation**: [Copilot Agents Guide](docs/COPILOT_AGENTS.md) | [Quick Reference](.github/agents/QUICK_REFERENCE.md) | [Deployment Guide](docs/AGENT_DEPLOYMENT_GUIDE.md)

---

## 📚 Documentation

| Document | Description | Audience |
|----------|-------------|----------|
| [Awesome Resources](docs/AWESOME_RESOURCES.md) | **NEW!** Curated tools from awesome lists for performance, deployment & HR features | Everyone |
| [Performance & Deployment Quick Reference](docs/PERFORMANCE_DEPLOYMENT_QUICK_REFERENCE.md) | **NEW!** Quick reference for 30-minute performance wins and deployment options | Everyone |
| [Performance Optimization Guide](docs/PERFORMANCE_OPTIMIZATION_GUIDE.md) | **NEW!** Comprehensive performance optimization strategies using awesome lists tools | Developers/Admins |
| [Deployment Alternatives Guide](docs/DEPLOYMENT_ALTERNATIVES_GUIDE.md) | **NEW!** Privacy-focused deployment options: Docker, On-Premise, Oracle Cloud Free | HR Users/Developers/Admins |
| [GitHub Deployment Options](docs/GITHUB_DEPLOYMENT_OPTIONS.md) | Complete guide for local laptop, GitHub Codespaces, and self-hosted deployment options | HR Users/Developers |
| [VSCode Deployment Guide](docs/VSCODE_DEPLOYMENT_GUIDE.md) | Complete guide for development and deployment in Visual Studio Code | Developers |
| [Contributing Guide](CONTRIBUTING.md) | Setup instructions, Copilot best practices, troubleshooting | Contributors/Developers |
| [HR User Guide](docs/HR_USER_GUIDE.md) | How to use the portal | HR Users |
| [HR Templates Reference](docs/HR_TEMPLATES_REFERENCE.md) | Performance Evaluation & Employee of the Year templates | HR Users/Managers |
| [App Analysis Report](docs/APP_ANALYSIS_REPORT.md) | Comprehensive codebase analysis and issue remediation | Admins/Developers |
| [Process Simplification (UAE)](docs/PROCESS_SIMPLIFICATION_UAE.md) | Automated workflows for solo HR/multi-entity operations | HR Leadership |
| [Copilot Agents Guide](docs/COPILOT_AGENTS.md) | AI agents for development assistance | Developers |
| [Agent Deployment Guide](docs/AGENT_DEPLOYMENT_GUIDE.md) | How to deploy and use agents | Developers |
| [System Health Check](docs/SYSTEM_HEALTH_CHECK.md) | Application assessment & roadmap | Admins/Developers |
| [Recommended Add-ons](docs/RECOMMENDED_ADDONS.md) | Integration options | Developers |
| [HR Implementation Plan](docs/HR_IMPLEMENTATION_PLAN.md) | Migration, admin hardening, and HR ops structure | HR Leadership/Admins |
| [HR Apps Integration Guide](docs/HR_APPS_INTEGRATION_GUIDE.md) | Complete guide to GitHub HR apps & integration strategies | HR Leadership/Developers |
| [Employee Management Quick Start](docs/EMPLOYEE_MANAGEMENT_QUICK_START.md) | Add employee management features to your existing app | Developers |
| [Employee Migration Apps Guide](docs/EMPLOYEE_MIGRATION_APPS_GUIDE.md) | GitHub apps for layered employee migration strategy | HR Leadership/Developers |
| [Frappe HRMS Implementation Plan](docs/FRAPPE_HRMS_IMPLEMENTATION_PLAN.md) | 6-week plan to integrate Frappe HRMS (if needed later) | HR Leadership/Developers |
| [Recruitment Systems Research](docs/RECRUITMENT_SYSTEMS_RESEARCH.md) | Comprehensive analysis of open-source ATS options & custom build recommendation | HR Leadership/Developers |
| [Recruitment Implementation Architecture](docs/RECRUITMENT_IMPLEMENTATION_ARCHITECTURE.md) | Technical architecture for custom lightweight ATS with pass integration | Developers |
| [Recruitment Quick Reference](docs/RECRUITMENT_QUICK_REFERENCE.md) | Executive summary and quick decision guide for recruitment system | HR Leadership |
| [AI CV Parsing Solutions](docs/AI_CV_PARSING_SOLUTIONS.md) | AI-powered resume parsing with pyresparser for automatic candidate data extraction | Developers/HR |
| [Recruitment Full Implementation Guide](docs/RECRUITMENT_FULL_IMPLEMENTATION_GUIDE.md) | Complete ready-to-implement code for recruitment system (solo HR, UAE startup) | Developers |
| [Recruitment Deployment Checklist](docs/RECRUITMENT_DEPLOYMENT_CHECKLIST.md) | Step-by-step deployment checklist and verification guide | Developers/DevOps |

### 📋 Recruitment Documentation Review

> Comprehensive review of recruitment system documentation

| Document | Description | Audience |
|----------|-------------|----------|
| [📊 Quick Reference](docs/RECRUITMENT_DOCS_QUICK_REFERENCE.md) | **START HERE!** TL;DR summary, top actions, quick fixes | Everyone |
| [📝 Full Review](docs/RECRUITMENT_DOCUMENTATION_REVIEW.md) | Complete 900+ line review with ratings and recommendations | Leadership/Developers |
| [📅 Action Plan](docs/RECRUITMENT_DOCUMENTATION_ACTION_PLAN.md) | 4-week implementation plan with timeline and resources | Project Managers |

**Key Findings:**
- Grade: 7/10 - Good strategic planning, needs operational depth
- 6 documents reviewed, 7 critical documents missing
- Top priority: Create recruitment system overview and workflow diagrams
- Timeline: 2-3 days for critical gaps, 4 weeks for complete documentation

---

## ✨ Features

### Current Features
- ✅ **Contract Renewals** - Create, list, and track renewal requests
- ✅ **Role-Based Access** - Admin, HR, and Viewer roles
- ✅ **Audit Trail** - All actions logged for compliance
- ✅ **Simple Login** - Employee ID + password (DOB for first-time login)

### Coming Soon
- 🔜 **Onboarding Module** - New employee checklists
- 🔜 **External Users** - Contractor/vendor management
- 🔜 **Email Notifications** - Automated reminders

---

## 📁 Project Structure

```
Secure-Renewals-2/
├── backend/              # FastAPI Python API
│   ├── app/              # Application code
│   │   ├── routers/      # API endpoints
│   │   ├── services/     # Business logic
│   │   ├── repositories/ # Database access
│   │   ├── models/       # SQLAlchemy models
│   │   └── schemas/      # Pydantic schemas
│   └── alembic/          # Database migrations
├── frontend/             # React + TypeScript UI
│   └── src/              # React components
├── docs/                 # Documentation
│   ├── HR_USER_GUIDE.md
│   ├── SYSTEM_HEALTH_CHECK.md
│   └── RECOMMENDED_ADDONS.md
└── README.md
```

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | Python 3.11+, FastAPI, SQLAlchemy, Alembic |
| **Frontend** | React 18, TypeScript, Vite, TailwindCSS |
| **Database** | PostgreSQL (with asyncpg driver) |
| **Auth** | Employee ID + Password (JWT) |

---

## 📦 Setup Guide

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL database

### Backend Setup

```bash
# 1. Navigate to backend
cd backend

# 2. Create environment file
cp .env.example .env
# Edit .env with your database and auth settings

# 3. Install dependencies
uv sync  # or pip install -r requirements.txt

# 4. Run database migrations
uv run alembic upgrade head

# 5. Start the API server
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

🔗 API docs available at: `http://localhost:8000/docs`

### Frontend Setup

```bash
# 1. Navigate to frontend
cd frontend

# 2. Install dependencies
npm install

# 3. Create environment file
echo "VITE_API_BASE_URL=http://localhost:8000/api" > .env

# 4. Start development server
npm run dev
```

🔗 App available at: `http://localhost:5173`

---

## 🔐 Authentication

### Roles

| Role | Permissions |
|------|-------------|
| **Admin** | Full access, auto-approve renewals, manage users |
| **HR** | Create renewals (need approval), view all employees |
| **Viewer** | Read-only access |

### Employee Login System

Employees log in using their **Employee ID** and a password:

1. **First-time Login:**
   - Enter your **Employee ID**
   - Enter your **Date of Birth** (DOB) as initial password
   - System prompts you to **create a new password**
   - Password must meet security requirements (min 8 characters, mixed case, number)

2. **Subsequent Logins:**
   - Enter your **Employee ID**
   - Enter your **password**

### Password Reset

If you forget your password:
1. Click "Forgot Password" on the login page
2. Enter your Employee ID
3. System sends a reset link (or HR can reset manually)

### Environment Variables

```env
# Authentication settings
AUTH_SECRET_KEY=<your-secret-key-for-jwt>
PASSWORD_MIN_LENGTH=8
SESSION_TIMEOUT_MINUTES=480
```

### Development Mode

For local testing:

```env
DEV_AUTH_BYPASS=true
DEV_USER_ID=EMP001
DEV_USER_ROLE=admin
```

---

## 🚀 Deployment

### 🐳 Docker Deployment (RECOMMENDED - Easy & Portable)

**Best for:** Easy setup, portability, and professional deployment

Docker provides a clean, isolated environment that runs consistently across different machines.

**Quick Start:**

```bash
# One-command deployment (Linux/macOS)
./scripts/deploy-docker.sh

# OR Windows
scripts\deploy-docker.bat
```

**What you get:**
- ✅ **All-in-one setup** - Backend, Frontend, Database, Redis cache
- ✅ **One command to start** - `docker compose up -d`
- ✅ **Easy backup/restore** - `./scripts/backup-database.sh`
- ✅ **Portable** - Move to another machine easily
- ✅ **Production-ready** - Same setup works in cloud

**Access URLs:**
- Application: http://localhost:5000
- API Docs: http://localhost:8000/docs

📖 **Full Guide**: [Deployment Alternatives Guide](docs/DEPLOYMENT_ALTERNATIVES_GUIDE.md) - Docker, On-Premise, Oracle Cloud Free

---

### 🏆 Local Desktop Deployment (Simple & Private)

**Best for:** Solo HR user, maximum privacy, no third-party domain exposure

📖 **[GitHub Deployment Options Guide](docs/GITHUB_DEPLOYMENT_OPTIONS.md)** - Complete guide for all deployment options

**Why Local Desktop?**
- ✅ **100% Private** - Data never leaves your computer
- ✅ **No subscription costs** - Completely free
- ✅ **No third-party domains** - No replit.dev, vercel.app, etc.
- ✅ **Works offline** - Once data is loaded
- ✅ **Auto-start available** - Launches automatically with your computer

**🤖 Automated Installation (First Time):**

Windows:
```batch
scripts\install-windows.bat
```

macOS/Linux:
```bash
chmod +x scripts/install.sh && ./scripts/install.sh
```

The installer handles everything: dependencies, environment setup, database, and optionally enables auto-start.

**🔄 Enable Auto-Start (After Installation):**

Windows:
```batch
scripts\setup-autostart-windows.bat
```

macOS:
```bash
./scripts/setup-autostart-macos.sh enable
```

**Manual Start (if needed):**

Windows: `scripts\start-portal-windows.bat`  
macOS/Linux: `./scripts/start-portal.sh`

**Access URLs:**
- Application: http://localhost:5000
- API Docs: http://localhost:8000/docs

### Visual Studio Code (Development & Deployment)

Complete VSCode setup with debugging, tasks, and deployment support.

📖 **[VSCode Deployment Guide](docs/VSCODE_DEPLOYMENT_GUIDE.md)** - Comprehensive guide for development in VSCode

**Quick Start:**
1. Open the project: `code .` or open `secure-renewals.code-workspace`
2. Install recommended extensions (VSCode will prompt)
3. Press `Ctrl+Shift+B` to start both frontend and backend
4. Press `F5` to debug

**Key Features:**
- ✅ Pre-configured tasks for building, running, and deploying
- ✅ Debug configurations for Python and React
- ✅ Multi-folder workspace support
- ✅ Integrated terminal with proper environment
- ✅ One-click deployment to Azure
- ✅ Database migration tasks

### GitHub Codespaces (Cloud Development)

Run the application in a cloud-based development environment under Microsoft infrastructure.

**Quick Start:**
1. Go to repository → **Code** → **Codespaces** → **Create codespace on main**
2. Wait for environment to start
3. Run: `cd backend && uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`
4. Run (new terminal): `cd frontend && npm run dev`
5. Access via the **Ports** tab (set to Private)

**Advantages:**
- ✅ Microsoft infrastructure (github.dev domain)
- ✅ Private URLs (not publicly visible)
- ✅ 60 hours/month free
- ✅ No setup on your laptop needed

### Replit Deployment

The app is also configured for **Replit** deployment under your company domain.

**Auto-configured features:**
- ✅ Frontend runs on port 5000 (external port 80)
- ✅ Backend runs on port 5001 (external port 3000)
- ✅ PostgreSQL available via Nix packages
- ✅ One-click run via Replit workflows

**Setup Steps:**

1. **Import to Replit**: Fork or import this repo to your Replit workspace
2. **Configure Secrets** (in Replit Secrets tab):
   ```
   DATABASE_URL=postgresql+asyncpg://...
   AUTH_ISSUER=https://login.microsoftonline.com/<tenant-id>/v2.0
   AUTH_AUDIENCE=api://secure-renewals
   AUTH_JWKS_URL=https://login.microsoftonline.com/<tenant-id>/discovery/v2.0/keys
   ALLOWED_ORIGINS=https://your-replit-app.your-company.com
   ```
3. **Set Custom Domain**: In Replit → Settings → Custom Domains, add your company domain
4. **Run**: Click the Run button - frontend and backend start automatically

**Replit-specific URLs:**
- Frontend: `https://your-app-name.your-company.com`
- Backend API: `https://your-app-name.your-company.com:3000/api`
- API Docs: `https://your-app-name.your-company.com:3000/docs`

### Environment Variables

**Backend Secrets (Replit Secrets or `.env`):**
```env
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/dbname
ALLOWED_ORIGINS=https://your-app.your-company.com
AUTH_ISSUER=https://login.microsoftonline.com/<tenant>/v2.0
AUTH_AUDIENCE=api://secure-renewals
AUTH_JWKS_URL=https://login.microsoftonline.com/<tenant>/discovery/v2.0/keys
```

**Frontend (auto-configured in Replit):**
```env
VITE_API_BASE_URL=https://your-app.your-company.com:3000/api
```

### Deployment Checklist

- [ ] Import repo to Replit workspace
- [ ] Configure Replit Secrets with database and auth settings
- [ ] Set custom company domain in Replit settings
- [ ] Run database migrations (`cd backend && uv run alembic upgrade head`)
- [ ] Click Run to start the application
- [ ] Add admin user (first user with admin role)
- [ ] Share portal URL with HR team

---

## 📄 License

ISC License - See [LICENSE](LICENSE) for details.

---

<p align="center">
  <strong>Secure Renewals HR Portal</strong><br>
  Built with ❤️ for HR teams
</p>
