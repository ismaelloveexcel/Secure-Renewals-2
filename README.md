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

1. 📖 Read the [HR User Guide](docs/user-guides/HR_USER_GUIDE.md) - Simple, step-by-step instructions
2. 🔑 Get your authentication token from IT
3. 🌐 Open the portal URL in your browser
4. ✅ Enter your token and start managing renewals!

**Need help?** Check the [Troubleshooting section](docs/user-guides/HR_USER_GUIDE.md#troubleshooting) in the user guide.

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

**📖 Full Documentation**: [Copilot Agents Guide](docs/development/COPILOT_AGENTS.md) | [Quick Reference](.github/agents/QUICK_REFERENCE.md) | [Deployment Guide](docs/development/AGENT_DEPLOYMENT_GUIDE.md)

---

## 📚 Documentation

**All documentation has been organized into categories for easy navigation. See [docs/README.md](docs/README.md) for the complete index.**

### Quick Start Guides

| Document | Description | Audience |
|----------|-------------|----------|
| [📖 Documentation Index](docs/README.md) | **START HERE** - Complete documentation navigation guide | Everyone |
| [👥 HR User Guide](docs/user-guides/HR_USER_GUIDE.md) | How to use the portal | HR Users |
| [🚀 Contributing Guide](CONTRIBUTING.md) | Setup instructions, Copilot best practices, troubleshooting | Contributors/Developers |

### Main Documentation Categories

#### 📦 Deployment Guides
- [Deployment Alternatives](docs/deployment/DEPLOYMENT_ALTERNATIVES_GUIDE.md) - Docker, On-Premise, Oracle Cloud
- [GitHub Deployment Options](docs/deployment/GITHUB_DEPLOYMENT_OPTIONS.md) - Local, Codespaces, self-hosted
- [VSCode Deployment](docs/deployment/VSCODE_DEPLOYMENT_GUIDE.md) - Complete VSCode setup
- [Performance & Deployment Quick Reference](docs/deployment/PERFORMANCE_DEPLOYMENT_QUICK_REFERENCE.md) - Quick wins

#### 💻 Development Resources
- [Copilot Agents](docs/development/COPILOT_AGENTS.md) - AI development assistance
- [System Health Check](docs/development/SYSTEM_HEALTH_CHECK.md) - Application assessment
- [Awesome Resources](docs/development/AWESOME_RESOURCES.md) - Curated tools and libraries
- [Performance Optimization](docs/development/PERFORMANCE_OPTIMIZATION_GUIDE.md) - Optimization strategies

#### 🎯 Recruitment System
- [Recruitment Quick Reference](docs/recruitment/RECRUITMENT_QUICK_REFERENCE.md) - **START HERE** for recruitment
- [Full Implementation Guide](docs/recruitment/RECRUITMENT_FULL_IMPLEMENTATION_GUIDE.md) - Complete implementation
- [Technical Architecture](docs/recruitment/RECRUITMENT_IMPLEMENTATION_ARCHITECTURE.md) - System architecture
- [AI CV Parsing](docs/recruitment/AI_CV_PARSING_SOLUTIONS.md) - Resume parsing solutions

#### 🏢 HR Management
- [HR Implementation Plan](docs/hr-management/HR_IMPLEMENTATION_PLAN.md) - Migration and operations
- [HR Templates Reference](docs/hr-management/HR_TEMPLATES_REFERENCE.md) - Performance templates
- [Employee Management Quick Start](docs/hr-management/EMPLOYEE_MANAGEMENT_QUICK_START.md) - Employee features
- [Process Simplification (UAE)](docs/hr-management/PROCESS_SIMPLIFICATION_UAE.md) - UAE workflows

**📊 Total**: 30 organized documents across 5 categories | **See [docs/README.md](docs/README.md) for complete listing**

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

📖 **Full Guide**: [Deployment Alternatives Guide](docs/deployment/DEPLOYMENT_ALTERNATIVES_GUIDE.md) - Docker, On-Premise, Oracle Cloud Free

---

### 🏆 Local Desktop Deployment (Simple & Private)

**Best for:** Solo HR user, maximum privacy, no third-party domain exposure

📖 **[GitHub Deployment Options Guide](docs/GITHUB_DEPLOYMENT_OPTIONS.md)** - Complete guide for all deployment options

**🖱️ One-Click (macOS/Linux)**

```bash
chmod +x scripts/oneclick-local.sh
./scripts/oneclick-local.sh
```

This installs dependencies, creates env files, runs migrations, and starts everything locally (auto-starts Postgres/Redis via Docker when available). On Windows, use the bundled scripts: `scripts\install-windows.bat` then `scripts\start-portal-windows.bat`.

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

📖 **[VSCode Deployment Guide](docs/deployment/VSCODE_DEPLOYMENT_GUIDE.md)** - Comprehensive guide for development in VSCode

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
