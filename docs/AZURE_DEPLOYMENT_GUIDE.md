# Azure Deployment Guide - Secure Renewals HR Portal

Complete guide for deploying the Secure Renewals HR Portal to Microsoft Azure.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Deployment Options](#deployment-options)
- [Option 1: Automated Script Deployment](#option-1-automated-script-deployment)
- [Option 2: GitHub Actions CI/CD](#option-2-github-actions-cicd)
- [Option 3: Docker Container Deployment](#option-3-docker-container-deployment)
- [Post-Deployment Configuration](#post-deployment-configuration)
- [Monitoring and Maintenance](#monitoring-and-maintenance)
- [Troubleshooting](#troubleshooting)

---

## Overview

The Secure Renewals HR Portal is a full-stack application consisting of:

- **Backend**: FastAPI (Python 3.11+) API server
- **Frontend**: React 18 + TypeScript Single Page Application (SPA)
- **Database**: PostgreSQL 15
- **Authentication**: JWT-based employee authentication

**Estimated Deployment Time**: 20-30 minutes  
**Monthly Cost Estimate**: $50-150 USD (depending on SKU and usage)

---

## Prerequisites

### Required Accounts
- Microsoft Azure account with active subscription
- GitHub account (for CI/CD option)

### Required Tools
Choose one:
- **Option A**: Azure Cloud Shell (no installation needed)
  - Access at: https://shell.azure.com
  - Pre-installed: Azure CLI, Git, Docker

- **Option B**: Local installation
  - Azure CLI: https://aka.ms/azure-cli
  - Git
  - (Optional) Docker Desktop

### Required Permissions
- Contributor or Owner role on Azure subscription
- Ability to create:
  - Resource Groups
  - App Service Plans
  - Web Apps
  - PostgreSQL Databases

---

## Deployment Options

### Quick Comparison

| Method | Complexity | Time | Best For |
|--------|-----------|------|----------|
| **Automated Script** | Low | 15 min | First-time deployment, testing |
| **GitHub Actions** | Medium | 20 min | Production, continuous deployment |
| **Docker Containers** | Medium | 25 min | Multi-environment, scalability |

---

## Option 1: Automated Script Deployment

### Step 1: Prepare

1. **Open Azure Cloud Shell**
   ```bash
   # Go to: https://shell.azure.com
   # Select "Bash" environment
   ```

2. **Clone the repository**
   ```bash
   git clone https://github.com/ismaelloveexcel/Secure-Renewals-2.git
   cd Secure-Renewals-2
   ```

### Step 2: Configure

Edit the deployment script:
```bash
nano deploy_to_azure.sh
```

**Required configurations:**
```bash
RESOURCE_GROUP="secure-renewals-rg"          # Your resource group name
APP_SERVICE_PLAN="secure-renewals-plan"      # Your app service plan name
WEBAPP_NAME="secure-renewals-app"            # Your web app name (must be globally unique)
LOCATION="eastus"                             # Azure region
```

**Optional configurations:**
```bash
APP_SKU="B1"           # B1 (Basic) or P1V2 (Premium) for production
DB_SKU="GP_Gen5_2"     # Database performance tier
```

### Step 3: Deploy

Make the script executable and run:
```bash
chmod +x deploy_to_azure.sh
./deploy_to_azure.sh
```

The script will:
1. ✅ Create resource group
2. ✅ Provision PostgreSQL database
3. ✅ Create App Service plan
4. ✅ Create and configure Web App
5. ✅ Set environment variables
6. ✅ Configure startup commands

**Expected Output:**
```
============================================================================
🎉 DEPLOYMENT COMPLETE!
============================================================================

Your application is deployed at:
🌐 https://secure-renewals-app.azurewebsites.net

IMPORTANT - Save these credentials:
Database Server: secure-renewals-db-server.postgres.database.azure.com
Database Password: [GENERATED_PASSWORD]
Auth Secret Key: [GENERATED_KEY]
```

⚠️ **IMPORTANT**: Save the generated passwords and keys securely!

### Step 4: Run Database Migrations

SSH into your app:
```bash
az webapp ssh --resource-group secure-renewals-rg --name secure-renewals-app
```

Run migrations:
```bash
cd /home/site/wwwroot/backend
alembic upgrade head
```

### Step 5: Create Admin User

Connect to PostgreSQL:
```bash
psql "host=secure-renewals-db-server.postgres.database.azure.com port=5432 dbname=secure_renewals user=dbadmin@secure-renewals-db-server password=[YOUR_PASSWORD] sslmode=require"
```

Create admin user:
```sql
INSERT INTO employees (employee_id, full_name, email, role, hashed_password, date_of_birth)
VALUES ('ADMIN001', 'Admin User', 'admin@baynunah.ae', 'admin', 'will_change_on_first_login', '19900101');
```

---

## Option 2: GitHub Actions CI/CD

### Step 1: Set Up Azure Resources

Run the deployment script first (Option 1, Steps 1-3) to create resources.

### Step 2: Get Publish Profile

Download the publish profile:
```bash
az webapp deployment list-publishing-profiles \
    --name secure-renewals-app \
    --resource-group secure-renewals-rg \
    --xml > publish-profile.xml
```

### Step 3: Configure GitHub Secrets

1. Go to your GitHub repository
2. Navigate to: **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add the following secrets:

| Secret Name | Value |
|-------------|-------|
| `AZURE_WEBAPP_PUBLISH_PROFILE` | Contents of `publish-profile.xml` |

### Step 4: Enable GitHub Actions

The workflow file is already included at:
```
.github/workflows/azure-deploy.yml
```

**Workflow Configuration:**
```yaml
name: Deploy to Azure App Service

on:
  push:
    branches:
      - main
  workflow_dispatch:
```

### Step 5: Trigger Deployment

**Option A**: Push to main branch
```bash
git add .
git commit -m "Deploy to Azure"
git push origin main
```

**Option B**: Manual trigger
1. Go to **Actions** tab in GitHub
2. Select **Deploy to Azure App Service** workflow
3. Click **Run workflow**

**Monitor Progress:**
- Check the Actions tab for deployment status
- View logs for each step
- Deployment typically takes 5-10 minutes

---

## Option 3: Docker Container Deployment

### Step 1: Build Docker Image

```bash
# Build the Docker image
docker build -t secure-renewals:latest .

# Test locally
docker-compose up
```

### Step 2: Create Azure Container Registry

```bash
# Create ACR
az acr create \
    --resource-group secure-renewals-rg \
    --name securerenewalscr \
    --sku Basic

# Login to ACR
az acr login --name securerenewalscr
```

### Step 3: Push Image to ACR

```bash
# Tag image
docker tag secure-renewals:latest securerenewalscr.azurecr.io/secure-renewals:latest

# Push to ACR
docker push securerenewalscr.azurecr.io/secure-renewals:latest
```

### Step 4: Deploy to Azure App Service

```bash
# Enable ACR for App Service
az webapp config container set \
    --name secure-renewals-app \
    --resource-group secure-renewals-rg \
    --docker-custom-image-name securerenewalscr.azurecr.io/secure-renewals:latest \
    --docker-registry-server-url https://securerenewalscr.azurecr.io

# Configure continuous deployment
az webapp deployment container config \
    --name secure-renewals-app \
    --resource-group secure-renewals-rg \
    --enable-cd true
```

---

## Post-Deployment Configuration

### 1. Configure SMTP Email Settings

Navigate to Azure Portal → App Service → Configuration:

```bash
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=hr@baynunah.ae
SMTP_PASSWORD=[your-email-password]
SMTP_FROM_EMAIL=hr@baynunah.ae
SMTP_FROM_NAME=Baynunah HR
SMTP_USE_TLS=true
APP_BASE_URL=https://secure-renewals-app.azurewebsites.net
```

### 2. Configure Custom Domain (Optional)

```bash
# Add custom domain
az webapp config hostname add \
    --webapp-name secure-renewals-app \
    --resource-group secure-renewals-rg \
    --hostname hr.baynunah.ae

# Configure SSL
az webapp config ssl bind \
    --name secure-renewals-app \
    --resource-group secure-renewals-rg \
    --certificate-thumbprint [thumbprint] \
    --ssl-type SNI
```

### 3. Enable Application Insights (Monitoring)

```bash
# Create Application Insights
az monitor app-insights component create \
    --app secure-renewals-insights \
    --location eastus \
    --resource-group secure-renewals-rg

# Link to Web App
az webapp config appsettings set \
    --resource-group secure-renewals-rg \
    --name secure-renewals-app \
    --settings APPLICATIONINSIGHTS_CONNECTION_STRING="[connection-string]"
```

### 4. Configure Backup (Production)

```bash
# Create storage account
az storage account create \
    --name securerenewalsbkp \
    --resource-group secure-renewals-rg \
    --location eastus \
    --sku Standard_LRS

# Configure backup
az webapp config backup update \
    --resource-group secure-renewals-rg \
    --webapp-name secure-renewals-app \
    --container-url [storage-sas-url] \
    --frequency 1d \
    --retain-one true \
    --retention 30
```

---

## Monitoring and Maintenance

### Application Logs

**View real-time logs:**
```bash
az webapp log tail \
    --name secure-renewals-app \
    --resource-group secure-renewals-rg
```

**Download logs:**
```bash
az webapp log download \
    --name secure-renewals-app \
    --resource-group secure-renewals-rg \
    --log-file logs.zip
```

### Performance Monitoring

1. **Azure Portal**:
   - Navigate to: App Service → Monitoring → Metrics
   - Key metrics: CPU, Memory, Response Time, HTTP Errors

2. **Application Insights** (if enabled):
   - Real-time performance monitoring
   - Request tracking
   - Failure analysis
   - User analytics

### Database Maintenance

**Backup database:**
```bash
# Automated backups are enabled by default
# Manual backup:
az postgres db export \
    --resource-group secure-renewals-rg \
    --server-name secure-renewals-db-server \
    --name secure_renewals \
    --output-type BACPAC
```

**Scale database:**
```bash
# Scale up
az postgres server update \
    --resource-group secure-renewals-rg \
    --name secure-renewals-db-server \
    --sku-name GP_Gen5_4  # 4 vCores
```

---

## Troubleshooting

### Common Issues

#### 1. Application Won't Start

**Symptoms**: 502 Bad Gateway, Application Error

**Solutions**:
```bash
# Check application logs
az webapp log tail --name secure-renewals-app --resource-group secure-renewals-rg

# Common causes:
# - Missing environment variables
# - Database connection failed
# - Python package installation failed

# Restart app
az webapp restart --name secure-renewals-app --resource-group secure-renewals-rg
```

#### 2. Database Connection Failed

**Symptoms**: "Connection refused" or "Authentication failed"

**Solutions**:
```bash
# Check firewall rules
az postgres server firewall-rule list \
    --resource-group secure-renewals-rg \
    --server-name secure-renewals-db-server

# Add firewall rule for your IP
az postgres server firewall-rule create \
    --resource-group secure-renewals-rg \
    --server-name secure-renewals-db-server \
    --name AllowMyIP \
    --start-ip-address [YOUR_IP] \
    --end-ip-address [YOUR_IP]

# Verify connection string format:
# postgresql+asyncpg://user@server:password@server.postgres.database.azure.com:5432/dbname?ssl=require
```

#### 3. Frontend Not Loading

**Symptoms**: Blank page, 404 errors for assets

**Solutions**:
```bash
# SSH into app
az webapp ssh --resource-group secure-renewals-rg --name secure-renewals-app

# Check if frontend is built
ls -la /home/site/wwwroot/backend/static/

# Rebuild frontend manually
cd /home/site/wwwroot/frontend
npm install
npm run build
mkdir -p ../backend/static
cp -r dist/* ../backend/static/
```

#### 4. Slow Performance

**Solutions**:
```bash
# Scale up App Service Plan
az appservice plan update \
    --name secure-renewals-plan \
    --resource-group secure-renewals-rg \
    --sku P1V2

# Scale out (add instances)
az appservice plan update \
    --name secure-renewals-plan \
    --resource-group secure-renewals-rg \
    --number-of-workers 2
```

#### 5. Authentication Issues

**Symptoms**: Token errors, unauthorized access

**Solutions**:
```bash
# Verify AUTH_SECRET_KEY is set
az webapp config appsettings list \
    --name secure-renewals-app \
    --resource-group secure-renewals-rg \
    | grep AUTH_SECRET_KEY

# Generate new key if needed
NEW_KEY=$(openssl rand -base64 32)
az webapp config appsettings set \
    --resource-group secure-renewals-rg \
    --name secure-renewals-app \
    --settings AUTH_SECRET_KEY="$NEW_KEY"
```

### Getting Help

1. **Azure Portal**:
   - App Service → Diagnose and solve problems
   - Auto-diagnosis for common issues

2. **Application Logs**:
   ```bash
   az webapp log download \
       --name secure-renewals-app \
       --resource-group secure-renewals-rg
   ```

3. **Azure Support**:
   - Portal → Help + support → New support request

---

## Cost Optimization

### Development/Testing Environment
```bash
# Use Basic tier
APP_SKU="B1"    # ~$13/month
DB_SKU="B_Gen5_1"  # ~$25/month
Total: ~$40/month
```

### Production Environment
```bash
# Use Premium tier with auto-scaling
APP_SKU="P1V2"      # ~$75/month
DB_SKU="GP_Gen5_2"  # ~$100/month
Total: ~$175/month
```

### Cost-Saving Tips
1. Use **Dev/Test pricing** for non-production
2. Configure **auto-shutdown** for dev environments
3. Use **reserved instances** for production (save up to 72%)
4. Monitor with **Azure Cost Management**

---

## Security Checklist

- [ ] Change default admin password on first login
- [ ] Configure custom domain with SSL
- [ ] Enable HTTPS-only traffic
- [ ] Set up IP restrictions (if needed)
- [ ] Enable Azure AD authentication (optional)
- [ ] Configure database firewall rules
- [ ] Enable Application Insights for monitoring
- [ ] Set up automated backups
- [ ] Review and rotate secrets regularly
- [ ] Enable diagnostic logging

---

## Next Steps

1. ✅ Deploy application using one of the methods above
2. ✅ Run database migrations
3. ✅ Create admin user
4. ✅ Configure SMTP settings
5. ✅ Test application functionality
6. ✅ Set up monitoring and alerts
7. ✅ Configure custom domain (optional)
8. ✅ Share portal URL with HR team

---

## Additional Resources

- [Azure App Service Documentation](https://docs.microsoft.com/azure/app-service/)
- [Azure Database for PostgreSQL](https://docs.microsoft.com/azure/postgresql/)
- [FastAPI Deployment Guide](https://fastapi.tiangolo.com/deployment/)
- [React Production Build](https://react.dev/learn/start-a-new-react-project#deploying-to-production)

---

**Need Help?** Contact your Azure administrator or refer to the [CONTRIBUTING.md](../CONTRIBUTING.md) guide.
