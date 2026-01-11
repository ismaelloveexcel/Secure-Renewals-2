# New Repository Creation - Quick Checklist

> **TL;DR:** Use the automated script or follow this checklist to create a lean production repository.

---

## 🎯 Goal

Create a new repository with **only** essential files for Azure deployment:
- **From:** 250+ files, 50+ MB
- **To:** 50-100 files, 2-5 MB
- **Result:** 80-90% size reduction

---

## ✅ Option 1: Automated Script (RECOMMENDED)

### Linux/macOS
```bash
./scripts/create_new_repo.sh
```

### Windows
```batch
scripts\create_new_repo.bat
```

**The script does everything for you!** ✨

---

## ✅ Option 2: Manual Checklist

### Step 1: Prepare Target Directory
- [ ] Create new directory: `mkdir ../secure-renewals-production`
- [ ] Navigate to it: `cd ../secure-renewals-production`

### Step 2: Copy Essential Files
- [ ] Copy `backend/` folder
- [ ] Copy `frontend/` folder
- [ ] Copy `.streamlit/` folder
- [ ] Copy `.gitignore`
- [ ] Copy `pyproject.toml`
- [ ] Copy `uv.lock`
- [ ] Copy `deploy_to_azure.sh`

### Step 3: Clean Up
- [ ] Remove `frontend/node_modules` (if present)
- [ ] Remove `frontend/dist` (if present)
- [ ] Remove `backend/static` (if present)
- [ ] Remove all `__pycache__` directories
- [ ] Remove all `.pyc` files

### Step 4: Initialize Git
- [ ] Run `git init`
- [ ] Run `git add .`
- [ ] Run `git commit -m "Initial commit - production files only"`

### Step 5: Create README
- [ ] Create minimal `README.md` with setup instructions
- [ ] Add to git: `git add README.md && git commit -m "Add README"`

---

## ✅ Verification Checklist

After creation, verify:

### File Structure
- [ ] `backend/` folder exists
- [ ] `frontend/` folder exists
- [ ] `.streamlit/` folder exists
- [ ] `.gitignore` exists
- [ ] `pyproject.toml` exists
- [ ] `uv.lock` exists
- [ ] `deploy_to_azure.sh` exists
- [ ] `README.md` exists

### Exclusions (should NOT exist)
- [ ] `docs/` folder does NOT exist
- [ ] `attached_assets/` folder does NOT exist
- [ ] `scripts/` folder does NOT exist
- [ ] `.github/` folder does NOT exist
- [ ] `.vscode/` folder does NOT exist
- [ ] `.devcontainer/` folder does NOT exist
- [ ] `CONTRIBUTING.md` does NOT exist
- [ ] `SECURITY.md` does NOT exist

### Test Backend Setup
- [ ] `cd backend`
- [ ] `cp .env.example .env`
- [ ] Edit `.env` with your database settings
- [ ] `uv sync` (installs dependencies)
- [ ] `uv run alembic upgrade head` (runs migrations)
- [ ] `uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`
- [ ] Visit http://localhost:8000/docs (API documentation loads)

### Test Frontend Setup
- [ ] `cd frontend`
- [ ] `npm install`
- [ ] `echo "VITE_API_BASE_URL=http://localhost:8000/api" > .env`
- [ ] `npm run dev`
- [ ] Visit http://localhost:5173 (app loads)

### Test Production Build
- [ ] `cd frontend`
- [ ] `npm run build`
- [ ] Check that `backend/static/` folder was created
- [ ] Check that `backend/static/assets/` contains JS/CSS files

---

## ✅ GitHub Setup Checklist

### Create New Repository on GitHub
- [ ] Go to https://github.com/new
- [ ] Repository name: `secure-renewals-production` (or your choice)
- [ ] Description: "Production deployment of Secure Renewals HR Portal"
- [ ] Visibility: Private (recommended)
- [ ] Do NOT initialize with README (you already have one)
- [ ] Click "Create repository"

### Push to GitHub
```bash
cd ../secure-renewals-production
git remote add origin https://github.com/YOUR_USERNAME/secure-renewals-production.git
git branch -M main
git push -u origin main
```

- [ ] Push completed successfully
- [ ] Verify files on GitHub.com

### Configure Repository Settings
- [ ] Settings → Secrets → Actions → Add secrets:
  - [ ] `DATABASE_URL`
  - [ ] `AUTH_ISSUER`
  - [ ] `AUTH_AUDIENCE`
  - [ ] `AUTH_JWKS_URL`
  - [ ] `ALLOWED_ORIGINS`
  - [ ] `AZURE_WEBAPP_PUBLISH_PROFILE` (if using Azure)

### Branch Protection
- [ ] Settings → Branches → Add rule
- [ ] Branch name pattern: `main`
- [ ] Require pull request reviews before merging
- [ ] Require status checks to pass
- [ ] Save changes

---

## ✅ Azure Deployment Checklist

### Prerequisites
- [ ] Azure account created
- [ ] Azure CLI installed: `az --version`
- [ ] Logged in: `az login`

### Create Azure Resources

#### Resource Group
```bash
az group create --name secure-renewals-rg --location eastus
```
- [ ] Resource group created

#### App Service Plan
```bash
az appservice plan create \
  --name secure-renewals-plan \
  --resource-group secure-renewals-rg \
  --sku B1 \
  --is-linux
```
- [ ] App Service plan created

#### Web App
```bash
az webapp create \
  --name secure-renewals-app \
  --resource-group secure-renewals-rg \
  --plan secure-renewals-plan \
  --runtime "PYTHON:3.11"
```
- [ ] Web app created

#### PostgreSQL Database
```bash
az postgres flexible-server create \
  --name secure-renewals-db \
  --resource-group secure-renewals-rg \
  --location eastus \
  --admin-user adminuser \
  --admin-password "YourStrongPassword123!" \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --version 14
```
- [ ] PostgreSQL server created

```bash
az postgres flexible-server db create \
  --resource-group secure-renewals-rg \
  --server-name secure-renewals-db \
  --database-name secure_renewals
```
- [ ] Database created

### Configure Web App
```bash
az webapp config appsettings set \
  --name secure-renewals-app \
  --resource-group secure-renewals-rg \
  --settings DATABASE_URL="your-connection-string" \
             AUTH_ISSUER="your-issuer" \
             AUTH_AUDIENCE="your-audience" \
             AUTH_JWKS_URL="your-jwks-url" \
             ALLOWED_ORIGINS="https://secure-renewals-app.azurewebsites.net"
```
- [ ] Environment variables configured

### Deploy Application
```bash
cd ../secure-renewals-production
./deploy_to_azure.sh
```
- [ ] Application deployed successfully
- [ ] Visit https://secure-renewals-app.azurewebsites.net
- [ ] Application loads correctly

---

## ✅ Post-Deployment Checklist

### Functionality Tests
- [ ] Login page loads
- [ ] Can login with test credentials
- [ ] API endpoints respond correctly
- [ ] Database connections work
- [ ] Authentication works
- [ ] All main features work

### Performance Tests
- [ ] Page load time < 3 seconds
- [ ] API response time < 500ms
- [ ] No console errors
- [ ] No failed network requests

### Security Tests
- [ ] HTTPS enabled
- [ ] CORS configured correctly
- [ ] Authentication required for protected routes
- [ ] Environment variables not exposed in code
- [ ] Database credentials secure

---

## 📊 Size Comparison

| Metric | Old Repo | New Repo | Improvement |
|--------|----------|----------|-------------|
| **Files** | 250+ | 50-100 | 50-60% fewer |
| **Size** | 50+ MB | 2-5 MB | 80-90% smaller |
| **Clone Time** | 30-60s | 5-10s | 5-6x faster |
| **Deploy Time** | 3-5 min | 1-2 min | 50-60% faster |

---

## 🆘 Troubleshooting

### Script fails with "Permission denied"
```bash
chmod +x scripts/create_new_repo.sh
```

### Git not found
Install git:
- **macOS:** `brew install git`
- **Ubuntu:** `sudo apt-get install git`
- **Windows:** Download from https://git-scm.com/

### uv not found
Install uv:
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### Node/npm not found
Install Node.js:
- Download from https://nodejs.org/ (LTS version)

### Database connection fails
- Check `DATABASE_URL` format: `postgresql+asyncpg://user:pass@host:5432/dbname`
- Verify database server is running
- Check firewall rules allow connection

### Build fails
```bash
# Clean and rebuild
cd frontend
rm -rf node_modules package-lock.json dist
npm install
npm run build
```

---

## 📚 Additional Resources

- [NEW_REPO_CREATION_GUIDE.md](NEW_REPO_CREATION_GUIDE.md) - Complete step-by-step guide
- [AZURE_DEPLOYMENT_FILES.md](AZURE_DEPLOYMENT_FILES.md) - Detailed file categorization
- [Azure App Service Docs](https://docs.microsoft.com/azure/app-service/)
- [FastAPI Deployment Guide](https://fastapi.tiangolo.com/deployment/)

---

## ✨ Success Criteria

You're done when:
- ✅ New repository created with only essential files
- ✅ Repository size reduced by 80-90%
- ✅ Local development environment works
- ✅ Pushed to GitHub successfully
- ✅ Azure deployment successful (if applicable)
- ✅ Application accessible and functional

---

*Last Updated: January 2026*
