# Azure Deployment - Essential Files Guide

This document identifies which files are **REQUIRED** for deploying the application to Azure vs which files are **NOT REQUIRED** (documentation, reference materials, development tools, etc.).

**Purpose:** Help migrate only essential files to a new repository to reduce app size and avoid performance issues.

---

## 🚀 Ready to Create Your New Repository?

**See the complete guide:** [NEW_REPO_CREATION_GUIDE.md](NEW_REPO_CREATION_GUIDE.md)

**Quick start with automated script:**

```bash
# Linux/macOS
./scripts/create_new_repo.sh

# Windows
scripts\create_new_repo.bat
```

The script automatically copies only the essential files listed below and sets up your new lean repository!

---

## Summary

| Category | File Count | Status |
|----------|------------|--------|
| **Required for Azure** | ~50 files | ✅ COPY TO NEW REPO |
| **Not Required** | ~200+ files | ❌ DO NOT COPY |

---

## ✅ REQUIRED FOR AZURE DEPLOYMENT

These files are essential for the application to run on Azure.

### 1. Backend (FastAPI) - REQUIRED

```
backend/
├── app/                          # ✅ ALL FILES REQUIRED
│   ├── __init__.py
│   ├── main.py                   # FastAPI entry point
│   ├── database.py               # Database connection
│   ├── startup_migrations.py     # Startup migrations
│   ├── seed_employees.json       # Initial seed data
│   ├── auth/                     # ✅ Authentication module
│   ├── core/                     # ✅ Core utilities/config
│   ├── models/                   # ✅ SQLAlchemy models
│   ├── repositories/             # ✅ Database access layer
│   ├── routers/                  # ✅ API endpoints
│   ├── schemas/                  # ✅ Pydantic schemas
│   └── services/                 # ✅ Business logic
├── alembic/                      # ✅ Database migrations
│   ├── env.py
│   └── versions/                 # ✅ All migration files
├── alembic.ini                   # ✅ Alembic configuration
├── static/                       # ✅ Built frontend assets (after npm build)
│   └── assets/                   # Generated JS/CSS files
├── pyproject.toml                # ✅ Python dependencies
├── uv.lock                       # ✅ Dependency lock file
├── .env.example                  # ✅ Environment template
├── start.sh                      # ✅ Production startup script
└── run_production.py             # ✅ Production runner (Cloud Run)
```

### 2. Frontend (React/Vite) - REQUIRED

```
frontend/
├── src/                          # ✅ ALL FILES REQUIRED
│   ├── App.tsx                   # Main React component
│   ├── main.tsx                  # Entry point
│   ├── index.css                 # Global styles
│   ├── button.css                # Button styles
│   ├── loader.css                # Loader styles
│   ├── components/               # ✅ All React components
│   ├── services/                 # ✅ API client
│   └── types/                    # ✅ TypeScript types
├── public/                       # ✅ Static assets
├── index.html                    # ✅ HTML entry point
├── package.json                  # ✅ NPM dependencies
├── tsconfig.json                 # ✅ TypeScript config
├── tsconfig.node.json            # ✅ Node TypeScript config
├── vite.config.ts                # ✅ Vite configuration
├── tailwind.config.ts            # ✅ TailwindCSS config
└── postcss.config.cjs            # ✅ PostCSS config
```

### 3. Root Configuration Files - REQUIRED

```
(root)/
├── .gitignore                    # ✅ Git ignore rules
├── pyproject.toml                # ✅ Root Python config (for uv)
├── uv.lock                       # ✅ Root dependency lock
└── deploy_to_azure.sh            # ✅ Azure deployment script
```

### 4. Streamlit Configuration - REQUIRED (if using Streamlit features)

```
.streamlit/
└── config.toml                   # ✅ Streamlit configuration
```

---

## ❌ NOT REQUIRED FOR AZURE DEPLOYMENT

These files are NOT needed for the application to run on Azure. They are documentation, development tools, reference materials, or platform-specific configurations.

### 1. Documentation Files - NOT REQUIRED

```
docs/                             # ❌ ENTIRE FOLDER - Documentation only
├── AGENT_DEPLOYMENT_GUIDE.md
├── AGENT_IMPLEMENTATION_SUMMARY.md
├── AGENT_STATUS_REPORT.md
├── AGENT_WORKFLOW_EXAMPLES.md
├── AI_CV_PARSING_SOLUTIONS.md
├── APP_ANALYSIS_REPORT.md
├── COPILOT_AGENTS.md
├── EMPLOYEE_MANAGEMENT_QUICK_START.md
├── EMPLOYEE_MIGRATION_APPS_GUIDE.md
├── FRAPPE_HRMS_IMPLEMENTATION_PLAN.md
├── GITHUB_DEPLOYMENT_OPTIONS.md
├── HR_APPS_INTEGRATION_GUIDE.md
├── HR_GITHUB_APPS_REFERENCE.md
├── HR_IMPLEMENTATION_PLAN.md
├── HR_TEMPLATES_REFERENCE.md
├── HR_USER_GUIDE.md
├── PROCESS_SIMPLIFICATION_UAE.md
├── PR_CONFLICT_ANALYSIS.md
├── RECOMMENDED_ADDONS.md
├── RECRUITMENT_DECISION_LOG.md
├── RECRUITMENT_DEPLOYMENT_CHECKLIST.md
├── RECRUITMENT_DOCS_QUICK_REFERENCE.md
├── RECRUITMENT_DOCUMENTATION_ACTION_PLAN.md
├── RECRUITMENT_DOCUMENTATION_REVIEW.md
├── RECRUITMENT_ENHANCEMENT_SUMMARY.md
├── RECRUITMENT_EXECUTIVE_SUMMARY.md
├── RECRUITMENT_FULL_IMPLEMENTATION_GUIDE.md
├── RECRUITMENT_IMPLEMENTATION_ARCHITECTURE.md
├── RECRUITMENT_QUICK_REFERENCE.md
├── RECRUITMENT_SYSTEMS_RESEARCH.md
├── SYSTEM_HEALTH_CHECK.md
├── VSCODE_DEPLOYMENT_CHECKLIST.md
├── VSCODE_DEPLOYMENT_GUIDE.md
├── VSCODE_IMPLEMENTATION_SUMMARY.md
└── VSCODE_QUICK_START.md
```

**Reason:** Documentation is for developers/HR users, not required for app runtime.

### 2. Root Documentation Files - NOT REQUIRED

```
(root)/
├── README.md                     # ❌ Project overview (not runtime)
├── CONTRIBUTING.md               # ❌ Contributor guide
├── SECURITY.md                   # ❌ Security policy
├── BRANCH_PUSH_NOTE.md           # ❌ Development notes
├── CLEANUP_SUMMARY.md            # ❌ Cleanup history
├── ISSUE_RESOLUTION_SUMMARY.md   # ❌ Issue tracking notes
└── replit.md                     # ❌ Replit-specific documentation
```

### 3. Attached Assets Folder - NOT REQUIRED

```
attached_assets/                  # ❌ ENTIRE FOLDER - Reference files only
├── *.xlsx                        # Census format samples
├── *.pdf                         # CV samples
├── *.docx                        # Job description samples
├── *.png                         # Screenshots
├── *.jpeg                        # Images
├── *.txt                         # Pasted content references
└── *.md                          # Blueprint documents
```

**Reason:** These are reference materials, samples, and screenshots - not runtime dependencies. Contains ~180+ files of sample data and images.

### 4. Recruitment Folder - NOT REQUIRED

```
recruitment/                      # ❌ ENTIRE FOLDER - Empty placeholder folders
├── Benefits/
│   └── .gitkeep
└── request/
    └── .gitkeep
```

**Reason:** Empty placeholder folders with no content.

### 5. Scripts Folder - NOT REQUIRED FOR AZURE

```
scripts/                          # ❌ Local development/utility scripts
├── demo_agents.sh                # Demo script
├── import_employees.py           # Data import utility
├── install-windows.bat           # Windows installer
├── install.sh                    # Linux/Mac installer
├── proactive_scan.py             # Code scanning utility
├── replit_data_pull.sh           # Replit data export
├── seed_hr_templates.py          # Template seeding
├── setup-autostart-macos.sh      # macOS autostart
├── setup-autostart-windows.bat   # Windows autostart
├── start-portal-windows.bat      # Windows start script
├── start-portal.sh               # Linux/Mac start script
└── sync_to_production.sh         # Sync utility
```

**Reason:** These are local development, installation, and utility scripts. Azure has its own startup mechanism (via `backend/start.sh`).

### 6. GitHub Configuration - NOT REQUIRED FOR AZURE RUNTIME

```
.github/                          # ❌ GitHub-specific (CI/CD, agents, templates)
├── agents/                       # Copilot agents configuration
├── chatmodes/                    # Chat mode configurations
├── instructions/                 # Copilot instructions
├── ISSUE_TEMPLATE/               # Issue templates
├── workflows/                    # GitHub Actions (CI/CD)
│   ├── app-health-check.yml
│   ├── audit-log.yml
│   ├── backup-db.yml
│   ├── ci.yml
│   ├── dependabot.yml
│   ├── deploy-local.yml
│   ├── deploy.yml
│   ├── security-monitoring.yml
│   ├── ssl-renewal-check.yml
│   └── user-experience.yml
└── dependabot.yml                # Dependabot config
```

**Reason:** GitHub Actions and agents don't run on Azure. These are for GitHub platform features.

### 7. VSCode Configuration - NOT REQUIRED

```
.vscode/                          # ❌ IDE configuration only
├── README.md
├── api-tests.http
├── deploy-azure-backend.code-workspace
├── deploy-azure-frontend.code-workspace
├── extensions.json
├── launch.json
├── python.code-snippets
├── settings.json
├── tasks.json
└── typescript.code-snippets
```

**Reason:** IDE settings don't affect runtime.

### 8. DevContainer Configuration - NOT REQUIRED

```
.devcontainer/                    # ❌ Development container config
└── devcontainer.json
```

**Reason:** DevContainers are for local development environments, not Azure deployment.

### 9. Replit Configuration - NOT REQUIRED FOR AZURE

```
.replit                           # ❌ Replit-specific configuration
```

**Reason:** Replit configuration is platform-specific and not used on Azure.

### 10. Miscellaneous Files - NOT REQUIRED

```
(root)/
├── app_architecture.json         # ❌ Architecture reference (not runtime)
├── Untitled-1.txt                # ❌ Scratch file (contains file path)
├── Employees-Employee Database- Github.csv  # ❌ Sample data file
├── package.json                  # ❌ Root package.json (unused - frontend has own)
├── tailwind.config.js            # ❌ Root tailwind (duplicate - frontend has own)
└── secure-renewals.code-workspace # ❌ VSCode workspace file
```

---

## 📋 QUICK COPY LIST

### Files/Folders to COPY to new repo:

```
backend/                          # ✅ Entire folder
frontend/                         # ✅ Entire folder
.streamlit/                       # ✅ Entire folder
.gitignore                        # ✅
pyproject.toml                    # ✅ (root)
uv.lock                           # ✅ (root)
deploy_to_azure.sh                # ✅
```

### Files/Folders to EXCLUDE:

```
docs/                             # ❌
attached_assets/                  # ❌
recruitment/                      # ❌
scripts/                          # ❌
.github/                          # ❌
.vscode/                          # ❌
.devcontainer/                    # ❌
.replit                           # ❌
README.md                         # ❌
CONTRIBUTING.md                   # ❌
SECURITY.md                       # ❌
BRANCH_PUSH_NOTE.md               # ❌
CLEANUP_SUMMARY.md                # ❌
ISSUE_RESOLUTION_SUMMARY.md       # ❌
replit.md                         # ❌
app_architecture.json             # ❌
Untitled-1.txt                    # ❌
Employees-Employee Database- Github.csv  # ❌
package.json (root)               # ❌
tailwind.config.js (root)         # ❌
secure-renewals.code-workspace    # ❌
AZURE_DEPLOYMENT_FILES.md         # ❌ (this file - reference only)
```

---

## 📊 Size Comparison

| Category | Approx. Size |
|----------|--------------|
| **Required files** | ~2-5 MB |
| **attached_assets/** | ~50+ MB (images, PDFs, Excel files) |
| **docs/** | ~500 KB |
| **Other non-required** | ~200 KB |

**Potential size reduction: 80-90%**

---

## 🚀 Recommended New Repo Structure

```
new-secure-renewals-azure/
├── backend/                      # FastAPI backend
│   ├── app/
│   ├── alembic/
│   ├── static/                   # Built frontend (after npm build)
│   ├── pyproject.toml
│   ├── uv.lock
│   ├── alembic.ini
│   ├── .env.example
│   ├── start.sh
│   └── run_production.py
├── frontend/                     # React frontend (for development)
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   ├── tailwind.config.ts
│   ├── postcss.config.cjs
│   └── index.html
├── .streamlit/
│   └── config.toml
├── .gitignore
├── pyproject.toml
├── uv.lock
├── deploy_to_azure.sh
└── README.md                     # Minimal README with setup instructions
```

---

## Notes

1. **Frontend builds to backend/static/**: The Vite config builds the frontend into `backend/static/` for serving by FastAPI in production.

2. **Azure deployment uses backend/start.sh**: This script starts the uvicorn server.

3. **Database migrations**: The `alembic/` folder is required for database schema management.

4. **.env.example**: Keep this as a template; actual `.env` is in `.gitignore` and should be configured per environment.

5. **For Azure App Service**: You typically only deploy the `backend/` folder since it contains the built frontend in `static/`.

---

*Generated: January 2026*
*Purpose: Azure deployment optimization*
