# Creating a New Lean Repository for Azure Deployment

This guide provides **step-by-step instructions** for creating a new, lean repository containing only the essential files needed for Azure deployment.

**Use Case:** You want a clean, production-ready repository without documentation, development tools, and reference materials that make the current repo bulky (50+ MB → 2-5 MB).

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Quick Start - Automated Script](#quick-start---automated-script)
3. [Manual Method](#manual-method)
4. [Verification Steps](#verification-steps)
5. [Next Steps](#next-steps)

---

## Overview

### What Gets Copied

✅ **Essential Files (~2-5 MB):**
- `backend/` - Complete FastAPI application
- `frontend/` - Complete React application
- `.streamlit/` - Streamlit configuration
- `.gitignore` - Git ignore rules
- `pyproject.toml` + `uv.lock` - Python dependencies
- `deploy_to_azure.sh` - Deployment script

### What Gets Excluded

❌ **Non-Essential Files (~50+ MB):**
- `docs/` - 35+ documentation files
- `attached_assets/` - 180+ reference files (PDFs, images, Excel samples)
- `scripts/` - Local development/utility scripts
- `.github/`, `.vscode/`, `.devcontainer/` - Platform-specific configs
- Root documentation (README.md, CONTRIBUTING.md, etc.)

**Result:** 80-90% size reduction, faster deployments, no performance overhead.

---

## Quick Start - Automated Script

### Option 1: Using the Provided Script (Recommended)

We provide a script that automates the entire process:

#### On Linux/macOS:

```bash
# 1. Run the creation script
chmod +x scripts/create_new_repo.sh
./scripts/create_new_repo.sh

# 2. Follow the prompts to:
#    - Specify target directory
#    - Initialize git (optional)
#    - Create README (optional)
```

#### On Windows:

```batch
# 1. Run the creation script
scripts\create_new_repo.bat

# 2. Follow the prompts
```

The script will:
1. ✅ Create the target directory
2. ✅ Copy all essential files with structure intact
3. ✅ Exclude all non-essential files
4. ✅ Optionally initialize a new git repository
5. ✅ Optionally create a minimal README
6. ✅ Generate a summary report

---

## Manual Method

If you prefer to copy files manually:

### Step 1: Create New Directory

```bash
mkdir ../secure-renewals-production
cd ../secure-renewals-production
```

### Step 2: Copy Essential Files

```bash
# Copy from the original repo location
SOURCE_REPO="../Secure-Renewals-2"

# Copy main directories
cp -r $SOURCE_REPO/backend ./
cp -r $SOURCE_REPO/frontend ./
cp -r $SOURCE_REPO/.streamlit ./

# Copy root configuration files
cp $SOURCE_REPO/.gitignore ./
cp $SOURCE_REPO/pyproject.toml ./
cp $SOURCE_REPO/uv.lock ./
cp $SOURCE_REPO/deploy_to_azure.sh ./
```

### Step 3: Initialize Git

```bash
git init
git add .
git commit -m "Initial commit - production files only"
```

### Step 4: Create Minimal README

```bash
cat > README.md << 'EOF'
# Secure Renewals HR Portal - Production

Production-ready deployment of the Secure Renewals HR Portal.

## Quick Start

### Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your settings
uv sync
uv run alembic upgrade head
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup

```bash
cd frontend
npm install
echo "VITE_API_BASE_URL=http://localhost:8000/api" > .env
npm run dev
```

## Deployment

See `deploy_to_azure.sh` for Azure deployment instructions.

## Environment Variables

Required environment variables:

**Backend (.env):**
- `DATABASE_URL` - PostgreSQL connection string
- `AUTH_ISSUER` - Authentication issuer URL
- `AUTH_AUDIENCE` - API audience identifier
- `AUTH_JWKS_URL` - JWKS endpoint URL
- `ALLOWED_ORIGINS` - Comma-separated allowed origins

**Frontend (.env):**
- `VITE_API_BASE_URL` - Backend API URL

## Stack

- **Backend:** Python 3.11+, FastAPI, SQLAlchemy, Alembic
- **Frontend:** React 18, TypeScript, Vite, TailwindCSS
- **Database:** PostgreSQL

EOF
```

---

## Verification Steps

After creating the new repository, verify everything is in place:

### 1. Check Directory Structure

```bash
cd ../secure-renewals-production
tree -L 2  # or 'ls -R' if tree is not available
```

Expected structure:
```
secure-renewals-production/
├── backend/
│   ├── app/
│   ├── alembic/
│   ├── pyproject.toml
│   └── ...
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
├── .streamlit/
├── .gitignore
├── pyproject.toml
├── uv.lock
├── deploy_to_azure.sh
└── README.md
```

### 2. Verify File Counts

```bash
# Essential files should be ~50-100 files
find . -type f | wc -l

# Should NOT contain docs, attached_assets, scripts folders
ls docs 2>/dev/null && echo "ERROR: docs/ should not exist" || echo "✓ docs/ excluded"
ls attached_assets 2>/dev/null && echo "ERROR: attached_assets/ should not exist" || echo "✓ attached_assets/ excluded"
ls scripts 2>/dev/null && echo "ERROR: scripts/ should not exist" || echo "✓ scripts/ excluded"
```

### 3. Test Backend Setup

```bash
cd backend
cp .env.example .env
# Configure .env with your settings

# Install dependencies
uv sync

# Run migrations
uv run alembic upgrade head

# Start server
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Access: http://localhost:8000/docs

### 4. Test Frontend Setup

```bash
cd frontend
npm install
echo "VITE_API_BASE_URL=http://localhost:8000/api" > .env
npm run dev
```

Access: http://localhost:5173

### 5. Build Production Frontend

```bash
cd frontend
npm run build
# This should create backend/static/ with built assets
ls -lh ../backend/static/
```

---

## Next Steps

### 1. Push to GitHub

Create a new repository on GitHub and push:

```bash
# On GitHub.com:
# 1. Go to https://github.com/new
# 2. Create a new repository (e.g., "secure-renewals-production")
# 3. Do NOT initialize with README (we already have one)

# In your local directory:
git remote add origin https://github.com/YOUR_USERNAME/secure-renewals-production.git
git branch -M main
git push -u origin main
```

### 2. Configure GitHub Repository

**Settings to configure:**

1. **Secrets** (Settings → Secrets → Actions):
   ```
   DATABASE_URL
   AUTH_ISSUER
   AUTH_AUDIENCE
   AUTH_JWKS_URL
   ALLOWED_ORIGINS
   ```

2. **Environments** (if using GitHub Actions for deployment):
   - Create `production` environment
   - Add protection rules
   - Add environment secrets

3. **Branch Protection** (Settings → Branches):
   - Protect `main` branch
   - Require pull request reviews
   - Require status checks

### 3. Set Up Azure Deployment

#### Option A: Azure CLI

```bash
# Login to Azure
az login

# Create resource group
az group create --name secure-renewals-rg --location eastus

# Create App Service plan
az appservice plan create --name secure-renewals-plan \
  --resource-group secure-renewals-rg \
  --sku B1 --is-linux

# Create Web App
az webapp create --name secure-renewals-app \
  --resource-group secure-renewals-rg \
  --plan secure-renewals-plan \
  --runtime "PYTHON:3.11"

# Configure environment variables
az webapp config appsettings set --name secure-renewals-app \
  --resource-group secure-renewals-rg \
  --settings DATABASE_URL="your-connection-string" \
               AUTH_ISSUER="your-issuer" \
               AUTH_AUDIENCE="your-audience" \
               AUTH_JWKS_URL="your-jwks-url" \
               ALLOWED_ORIGINS="your-origins"

# Deploy
./deploy_to_azure.sh
```

#### Option B: GitHub Actions (Continuous Deployment)

Create `.github/workflows/azure-deploy.yml`:

```yaml
name: Deploy to Azure

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          pip install uv
          cd backend
          uv sync
      
      - name: Build frontend
        run: |
          cd frontend
          npm install
          npm run build
      
      - name: Deploy to Azure Web App
        uses: azure/webapps-deploy@v2
        with:
          app-name: 'secure-renewals-app'
          publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
          package: ./backend
```

### 4. Database Setup on Azure

```bash
# Create PostgreSQL server
az postgres flexible-server create \
  --name secure-renewals-db \
  --resource-group secure-renewals-rg \
  --location eastus \
  --admin-user adminuser \
  --admin-password "YourStrongPassword123!" \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --version 14

# Create database
az postgres flexible-server db create \
  --resource-group secure-renewals-rg \
  --server-name secure-renewals-db \
  --database-name secure_renewals

# Get connection string
az postgres flexible-server show-connection-string \
  --server-name secure-renewals-db \
  --database-name secure_renewals \
  --admin-user adminuser
```

---

## Comparison: Old vs New Repo

| Metric | Old Repo | New Repo | Improvement |
|--------|----------|----------|-------------|
| **Total Files** | 250+ | ~50-100 | 50-60% fewer |
| **Total Size** | 50+ MB | 2-5 MB | 80-90% smaller |
| **Clone Time** | 30-60s | 5-10s | 5-6x faster |
| **CI/CD Time** | 3-5 min | 1-2 min | 50-60% faster |
| **Deployment Size** | 50 MB | 2-5 MB | 80-90% smaller |

---

## Troubleshooting

### Issue: Missing dependencies

**Solution:** Ensure you copied both `pyproject.toml` and `uv.lock` from root and backend directories.

### Issue: Frontend build fails

**Solution:** 
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Issue: Database migrations fail

**Solution:**
```bash
cd backend
uv run alembic stamp head
uv run alembic revision --autogenerate -m "Initial migration"
uv run alembic upgrade head
```

### Issue: CORS errors

**Solution:** Update `ALLOWED_ORIGINS` in backend `.env`:
```
ALLOWED_ORIGINS=http://localhost:5173,https://your-azure-app.azurewebsites.net
```

---

## Additional Resources

- [AZURE_DEPLOYMENT_FILES.md](AZURE_DEPLOYMENT_FILES.md) - Detailed file categorization
- [Azure App Service Documentation](https://docs.microsoft.com/azure/app-service/)
- [FastAPI Deployment Guide](https://fastapi.tiangolo.com/deployment/)
- [Vite Production Build Guide](https://vitejs.dev/guide/build.html)

---

## Support

If you encounter issues:

1. Check the [Verification Steps](#verification-steps)
2. Review the [Troubleshooting](#troubleshooting) section
3. Ensure all environment variables are correctly set
4. Check that your Azure resources are properly configured

---

*Last Updated: January 2026*
*Purpose: Guide for creating a lean, production-ready repository*
