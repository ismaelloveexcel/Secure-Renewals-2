# VSCode Deployment Checklist

Use this checklist when deploying the Secure Renewals HR Portal from Visual Studio Code.

## ✅ Pre-Deployment Setup

### Initial Environment Setup

- [ ] **Install Prerequisites**
  - [ ] Visual Studio Code (latest version)
  - [ ] Python 3.11 or higher (`python --version`)
  - [ ] Node.js 18 or higher (`node --version`)
  - [ ] UV package manager (`pip install uv`)
  - [ ] PostgreSQL database access
  - [ ] Git (`git --version`)

- [ ] **Clone Repository**
  ```bash
  git clone https://github.com/ismaelloveexcel/Secure-Renewals-2.git
  cd Secure-Renewals-2
  ```

- [ ] **Open in VSCode**
  ```bash
  code .
  # Or open the workspace file:
  code secure-renewals.code-workspace
  ```

- [ ] **Install VSCode Extensions**
  - [ ] Click "Install All" when prompted
  - [ ] Or manually: `Ctrl+Shift+P` → "Extensions: Show Recommended Extensions"
  - [ ] Verify all 15+ recommended extensions are installed

### Backend Setup

- [ ] **Install Backend Dependencies**
  - [ ] Option A: `Ctrl+Shift+P` → "Tasks: Run Task" → "Install Backend Dependencies"
  - [ ] Option B: `cd backend && uv sync`
  - [ ] Verify `.venv` directory created

- [ ] **Configure Backend Environment**
  - [ ] Copy: `cp backend/.env.example backend/.env`
  - [ ] Set `DATABASE_URL` with your PostgreSQL connection string
  - [ ] Set `AUTH_SECRET_KEY` (generate with `openssl rand -hex 32`)
  - [ ] Set `ALLOWED_ORIGINS` (include frontend URLs)
  - [ ] Set authentication variables if using Azure AD/OAuth
  - [ ] Review all environment variables

- [ ] **Initialize Database**
  - [ ] Option A: `Ctrl+Shift+P` → "Tasks: Run Task" → "Database Migrations: Upgrade"
  - [ ] Option B: `cd backend && uv run alembic upgrade head`
  - [ ] Verify no errors in terminal
  - [ ] Check database tables created

### Frontend Setup

- [ ] **Install Frontend Dependencies**
  - [ ] Option A: `Ctrl+Shift+P` → "Tasks: Run Task" → "Install Frontend Dependencies"
  - [ ] Option B: `cd frontend && npm install`
  - [ ] Verify `node_modules` directory created
  - [ ] Check for any dependency warnings

- [ ] **Configure Frontend Environment**
  - [ ] Create `frontend/.env`
  - [ ] Set `VITE_API_BASE_URL` to backend URL
  - [ ] For local dev: `http://localhost:8000/api`
  - [ ] For production: your backend domain + `/api`

## ✅ Local Development Testing

### Start Application Locally

- [ ] **Start Full Application**
  - [ ] Press `Ctrl+Shift+B` (default build task)
  - [ ] Or: `Ctrl+Shift+P` → "Tasks: Run Task" → "Start Full Application"
  - [ ] Verify backend starts on port 8000 (or 5001)
  - [ ] Verify frontend starts on port 5000

- [ ] **Verify Backend**
  - [ ] Open http://localhost:8000/health
  - [ ] Should see: `{"status": "healthy"}`
  - [ ] Open http://localhost:8000/docs
  - [ ] Swagger UI should load
  - [ ] Check no console errors

- [ ] **Verify Frontend**
  - [ ] Open http://localhost:5000
  - [ ] Application should load
  - [ ] Check browser console for errors
  - [ ] Verify login page appears

- [ ] **Test Basic Functionality**
  - [ ] Try logging in (create test user if needed)
  - [ ] Navigate through main screens
  - [ ] Create a test renewal request
  - [ ] Verify API calls work (check Network tab)

### Test API Endpoints

- [ ] **Use REST Client in VSCode**
  - [ ] Open `.vscode/api-tests.http`
  - [ ] Test health check endpoint
  - [ ] Test login endpoint
  - [ ] Store auth token in file
  - [ ] Test authenticated endpoints
  - [ ] Verify responses are correct

### Debug Testing

- [ ] **Test Backend Debugging**
  - [ ] Set breakpoint in Python file
  - [ ] Press `F5` → select "Backend: FastAPI"
  - [ ] Make API request
  - [ ] Verify breakpoint hits
  - [ ] Inspect variables
  - [ ] Step through code

- [ ] **Test Frontend Debugging**
  - [ ] Set breakpoint in TypeScript file
  - [ ] Press `F5` → select "Frontend: Launch Chrome"
  - [ ] Interact with UI
  - [ ] Verify breakpoint hits in VSCode
  - [ ] Check Chrome DevTools integration

## ✅ Build for Production

### Frontend Build

- [ ] **Build Frontend**
  - [ ] `Ctrl+Shift+P` → "Tasks: Run Task" → "Build Frontend"
  - [ ] Or: `cd frontend && npm run build`
  - [ ] Verify build completes successfully
  - [ ] Check `backend/static/` directory created
  - [ ] Verify assets in `backend/static/assets/`

- [ ] **Test Production Build Locally**
  - [ ] Stop frontend dev server
  - [ ] Start backend only
  - [ ] Open http://localhost:8000
  - [ ] Verify static files serve correctly
  - [ ] Test all routes work

### Code Quality Checks

- [ ] **Backend Type Checking**
  - [ ] `Ctrl+Shift+P` → "Tasks: Run Task" → "Lint Backend (Type Check)"
  - [ ] Or: `cd backend && uv run mypy app`
  - [ ] Fix any type errors

- [ ] **Frontend Type Checking**
  - [ ] `Ctrl+Shift+P` → "Tasks: Run Task" → "Lint Frontend (Type Check)"
  - [ ] Or: `cd frontend && npm run lint`
  - [ ] Fix any TypeScript errors

- [ ] **Run Tests** (if available)
  - [ ] Backend: `cd backend && uv run pytest`
  - [ ] Frontend: `cd frontend && npm test`
  - [ ] All tests should pass

## ✅ Deployment Options

### Option 1: Azure App Service

- [ ] **Install Azure CLI**
  - [ ] Download: https://learn.microsoft.com/en-us/cli/azure/install-azure-cli
  - [ ] Login: `az login`
  - [ ] Verify: `az account show`

- [ ] **Configure Deployment Script**
  - [ ] Edit `deploy_to_azure.sh`
  - [ ] Set `RESOURCE_GROUP` name
  - [ ] Set `APP_SERVICE_PLAN` name
  - [ ] Set `WEBAPP_NAME` (must be globally unique)
  - [ ] Set `LOCATION` (e.g., "eastus")
  - [ ] Review other variables

- [ ] **Run Deployment**
  - [ ] Option A: `Ctrl+Shift+P` → "Tasks: Run Task" → "Deploy to Azure"
  - [ ] Option B: `bash deploy_to_azure.sh`
  - [ ] Wait for completion (may take 5-10 minutes)
  - [ ] Note the deployment URL

- [ ] **Configure Azure App Settings**
  - [ ] In Azure Portal, go to your Web App
  - [ ] Configuration → Application settings
  - [ ] Add all environment variables from `backend/.env`
  - [ ] Save changes
  - [ ] Restart app

- [ ] **Run Database Migrations on Azure**
  - [ ] SSH into app: `az webapp ssh --resource-group <rg> --name <app>`
  - [ ] Run: `cd /home/site/wwwroot/backend && alembic upgrade head`
  - [ ] Exit SSH

- [ ] **Verify Azure Deployment**
  - [ ] Open app URL: `https://<webapp-name>.azurewebsites.net`
  - [ ] Check health endpoint
  - [ ] Test login
  - [ ] Verify all functionality

### Option 2: Replit

- [ ] **Import to Replit**
  - [ ] Go to https://replit.com
  - [ ] Click "Create" → "Import from GitHub"
  - [ ] Enter: `ismaelloveexcel/Secure-Renewals-2`
  - [ ] Wait for import

- [ ] **Configure Replit Secrets**
  - [ ] Click "Secrets" tab (lock icon)
  - [ ] Add `DATABASE_URL`
  - [ ] Add `AUTH_SECRET_KEY`
  - [ ] Add all other environment variables
  - [ ] Save secrets

- [ ] **Set Custom Domain** (optional)
  - [ ] Settings → Custom Domains
  - [ ] Add your company domain
  - [ ] Follow DNS configuration steps

- [ ] **Deploy**
  - [ ] Click "Run" button
  - [ ] Wait for services to start
  - [ ] Note the deployment URL

- [ ] **Verify Replit Deployment**
  - [ ] Open app URL
  - [ ] Frontend: Port 80 (external)
  - [ ] Backend: Port 3000 (external)
  - [ ] Test all functionality

### Option 3: Manual Server Deployment

- [ ] **Server Prerequisites**
  - [ ] Ubuntu/Debian server with SSH access
  - [ ] Python 3.11+ installed
  - [ ] Node.js 18+ installed
  - [ ] PostgreSQL installed
  - [ ] Nginx installed

- [ ] **Copy Files to Server**
  ```bash
  # Build frontend first
  cd frontend && npm run build
  
  # Copy to server
  scp -r . user@server:/var/www/secure-renewals/
  ```

- [ ] **Setup Backend Service**
  - [ ] Create systemd service file
  - [ ] Copy service to `/etc/systemd/system/`
  - [ ] Enable service: `systemctl enable secure-renewals`
  - [ ] Start service: `systemctl start secure-renewals`

- [ ] **Configure Nginx**
  - [ ] Create nginx config in `/etc/nginx/sites-available/`
  - [ ] Enable site: `ln -s /etc/nginx/sites-available/secure-renewals /etc/nginx/sites-enabled/`
  - [ ] Test config: `nginx -t`
  - [ ] Reload nginx: `systemctl reload nginx`

- [ ] **Setup SSL**
  - [ ] Install certbot
  - [ ] Run: `certbot --nginx -d yourdomain.com`
  - [ ] Verify HTTPS works

## ✅ Post-Deployment Verification

### Functional Testing

- [ ] **Authentication**
  - [ ] Login works
  - [ ] Logout works
  - [ ] Password change works
  - [ ] Role-based access works

- [ ] **Core Features**
  - [ ] Can view employees
  - [ ] Can create renewals
  - [ ] Can approve renewals (if admin)
  - [ ] Can view audit logs

- [ ] **API Testing**
  - [ ] All endpoints respond
  - [ ] Authentication required where needed
  - [ ] Error handling works
  - [ ] Validation works

### Security Checks

- [ ] **Environment Variables**
  - [ ] No secrets in code
  - [ ] `.env` files not committed
  - [ ] Production keys different from dev

- [ ] **HTTPS**
  - [ ] SSL certificate valid
  - [ ] No mixed content warnings
  - [ ] Force HTTPS redirect works

- [ ] **CORS**
  - [ ] Frontend domain allowed
  - [ ] No open CORS (`*`)
  - [ ] Appropriate origins configured

- [ ] **Database**
  - [ ] Strong database password
  - [ ] Database not publicly accessible
  - [ ] Connection encrypted

### Performance Checks

- [ ] **Load Time**
  - [ ] Homepage loads in < 3 seconds
  - [ ] API responses < 500ms
  - [ ] No console errors

- [ ] **Resources**
  - [ ] Images optimized
  - [ ] CSS/JS minified
  - [ ] No unnecessary requests

## ✅ Monitoring & Maintenance

### Setup Monitoring

- [ ] **Application Monitoring**
  - [ ] Setup error tracking (Sentry, etc.)
  - [ ] Setup uptime monitoring
  - [ ] Setup performance monitoring

- [ ] **Logs**
  - [ ] Configure log rotation
  - [ ] Setup log aggregation
  - [ ] Set log retention policy

### Backup Strategy

- [ ] **Database Backups**
  - [ ] Schedule daily backups
  - [ ] Test restore process
  - [ ] Store backups securely

- [ ] **Code Backups**
  - [ ] Git repository backed up
  - [ ] Tagged release versions
  - [ ] Documented deployment process

### Update Plan

- [ ] **Dependency Updates**
  - [ ] Schedule monthly dependency reviews
  - [ ] Test updates in staging first
  - [ ] Document update process

- [ ] **Database Migrations**
  - [ ] Test migrations in staging
  - [ ] Backup before production migration
  - [ ] Plan rollback strategy

## ✅ Documentation

### Update Documentation

- [ ] **Deployment Notes**
  - [ ] Document actual deployment steps taken
  - [ ] Note any issues encountered
  - [ ] Record solutions to problems

- [ ] **Access Information**
  - [ ] Document URLs (frontend, backend, admin)
  - [ ] Document admin accounts
  - [ ] Document SSH/server access

- [ ] **Runbooks**
  - [ ] Create incident response plan
  - [ ] Document common issues
  - [ ] Create rollback procedure

### Team Handover

- [ ] **Share Access**
  - [ ] Share deployment URLs with team
  - [ ] Provide admin credentials securely
  - [ ] Grant necessary permissions

- [ ] **Training**
  - [ ] Walk through deployed app
  - [ ] Show monitoring dashboards
  - [ ] Demonstrate common operations

---

## 🎉 Deployment Complete!

Your Secure Renewals HR Portal is now deployed and running!

### Quick Reference

**Local Development:**
```bash
code .                    # Open in VSCode
Ctrl+Shift+B             # Start development
F5                       # Debug
```

**Production URLs:**
- Frontend: [Your Domain]
- Backend API: [Your Domain]/api
- API Docs: [Your Domain]/docs

**Support:**
- [VSCode Quick Start](VSCODE_QUICK_START.md)
- [VSCode Deployment Guide](VSCODE_DEPLOYMENT_GUIDE.md)
- [Main README](../README.md)

---

**Need Help?** Check the troubleshooting sections in the deployment guides or open an issue on GitHub.
