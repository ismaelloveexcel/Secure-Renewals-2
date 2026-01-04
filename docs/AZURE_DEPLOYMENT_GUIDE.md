# Azure Deployment Guide for Secure Renewals HR Portal

> 📦 Complete guide to deploying the HR Portal on Microsoft Azure with automated CI/CD

---

## 📋 Table of Contents

- [Azure Deployment Options Comparison](#-azure-deployment-options-comparison)
- [Recommended Option: Azure App Service](#-recommended-option-azure-app-service)
- [Alternative: Azure Container Apps](#-alternative-azure-container-apps)
- [GitHub Actions Automated Deployment](#-github-actions-automated-deployment)
- [Manual Deployment Steps](#-manual-deployment-steps)
- [Environment Variables & Secrets](#-environment-variables--secrets)
- [Database Setup (Azure PostgreSQL)](#-database-setup-azure-postgresql)
- [Custom Domain & SSL](#-custom-domain--ssl)
- [Monitoring & Logging](#-monitoring--logging)
- [Cost Estimation](#-cost-estimation)
- [Troubleshooting](#-troubleshooting)

---

## 🔍 Azure Deployment Options Comparison

| Feature | Azure App Service | Azure Container Apps | Azure Kubernetes (AKS) |
|---------|-------------------|---------------------|------------------------|
| **Best For** | Web apps, APIs | Microservices, containers | Large-scale enterprise |
| **Complexity** | ⭐ Low | ⭐⭐ Medium | ⭐⭐⭐ High |
| **Cost** | 💰 Low-Medium | 💰 Low-Medium | 💰💰 Medium-High |
| **Scaling** | Auto-scale | Auto-scale + KEDA | Full Kubernetes |
| **Container Support** | Optional | Required | Required |
| **Setup Time** | 15-30 min | 30-60 min | 2-4 hours |
| **Management Overhead** | Minimal | Low | Significant |
| **CI/CD Integration** | Excellent | Good | Good |

### Our Recommendation

**🏆 Azure App Service** is the best option for this HR Portal because:

1. **Simplicity**: Deploy directly from GitHub without containerization
2. **Cost-effective**: B1 tier (~$13/month) is sufficient for most HR teams
3. **Built-in features**: SSL, custom domains, scaling, monitoring included
4. **Easy CI/CD**: Native GitHub Actions integration
5. **Zero container knowledge needed**: Deploy Python/Node.js apps directly

**When to choose Azure Container Apps instead:**
- You need microservices architecture
- You have existing Docker expertise
- You want Dapr integration for distributed systems

---

## 🚀 Recommended Option: Azure App Service

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      Azure Resource Group                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐    ┌──────────────────┐                   │
│  │  App Service     │    │  App Service     │                   │
│  │  (Backend API)   │───▶│  (Frontend)      │                   │
│  │  Python 3.11     │    │  Node.js 20      │                   │
│  │  FastAPI         │    │  Static Files    │                   │
│  └────────┬─────────┘    └──────────────────┘                   │
│           │                                                      │
│           ▼                                                      │
│  ┌──────────────────┐    ┌──────────────────┐                   │
│  │  Azure Database  │    │  Application     │                   │
│  │  for PostgreSQL  │    │  Insights        │                   │
│  │  Flexible Server │    │  (Monitoring)    │                   │
│  └──────────────────┘    └──────────────────┘                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Quick Start (One-Click Setup)

1. **Fork this repository** to your GitHub account
2. **Enable GitHub Actions** in your fork
3. **Create Azure resources** using our automated script (see below)
4. **Configure GitHub Secrets** (see Environment Variables section)
5. **Push to main branch** - deployment happens automatically!

---

## 🐳 Alternative: Azure Container Apps

If you prefer containerized deployments, Azure Container Apps offers:

- **Serverless containers**: Pay only for what you use
- **KEDA-based scaling**: Scale to zero when idle
- **Dapr integration**: Built-in service discovery and state management

See [Container Deployment](#container-deployment-optional) section for Docker setup.

---

## ⚙️ GitHub Actions Automated Deployment

### Workflow Overview

The repository includes two deployment workflows:

| Workflow | File | Trigger | Purpose |
|----------|------|---------|---------|
| **Backend Deploy** | `.github/workflows/deploy-backend.yml` | Push to main | Deploy FastAPI to Azure |
| **Frontend Deploy** | `.github/workflows/deploy-frontend.yml` | Push to main | Deploy React to Azure |

### Setting Up GitHub Secrets

Navigate to your repository: **Settings → Secrets and variables → Actions**

Add these secrets:

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `AZURE_CREDENTIALS` | Azure service principal JSON | See step 1 below |
| `AZURE_WEBAPP_NAME_BACKEND` | Backend app name | e.g., `secure-renewals-api` |
| `AZURE_WEBAPP_NAME_FRONTEND` | Frontend app name | e.g., `secure-renewals-app` |
| `DATABASE_URL` | PostgreSQL connection string | From Azure Portal |
| `AUTH_SECRET_KEY` | JWT signing key | Generate with `openssl rand -hex 32` |

### Step 1: Create Azure Service Principal

Run this in Azure Cloud Shell (https://shell.azure.com):

```bash
# Login (if not already in Cloud Shell)
az login

# Create service principal and output credentials
az ad sp create-for-rbac \
  --name "secure-renewals-github" \
  --role contributor \
  --scopes /subscriptions/{subscription-id}/resourceGroups/secure-renewals-rg \
  --sdk-auth

# Copy the JSON output → GitHub Secret: AZURE_CREDENTIALS
```

The output looks like:
```json
{
  "clientId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "clientSecret": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "subscriptionId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "tenantId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
}
```

### Step 2: Create Azure Resources

First, clone the repository:

```bash
# In Azure Cloud Shell or local terminal with Azure CLI
git clone https://github.com/ismaelloveexcel/Secure-Renewals-2.git
cd Secure-Renewals-2
```

Then run the setup script:

```bash
chmod +x scripts/azure-setup.sh
./scripts/azure-setup.sh
```

Or create resources manually:

```bash
# Variables
RESOURCE_GROUP="secure-renewals-rg"
LOCATION="eastus"
APP_SERVICE_PLAN="secure-renewals-plan"
BACKEND_APP="secure-renewals-api"
FRONTEND_APP="secure-renewals-app"

# Create resource group
az group create --name $RESOURCE_GROUP --location $LOCATION

# Create App Service plan (B1 tier for production)
az appservice plan create \
  --name $APP_SERVICE_PLAN \
  --resource-group $RESOURCE_GROUP \
  --sku B1 \
  --is-linux

# Create backend web app (Python)
az webapp create \
  --resource-group $RESOURCE_GROUP \
  --plan $APP_SERVICE_PLAN \
  --name $BACKEND_APP \
  --runtime "PYTHON|3.11"

# Create frontend web app (Node.js for static build)
az webapp create \
  --resource-group $RESOURCE_GROUP \
  --plan $APP_SERVICE_PLAN \
  --name $FRONTEND_APP \
  --runtime "NODE|20-lts"
```

---

## 📝 Manual Deployment Steps

If you prefer manual deployment over GitHub Actions:

### Backend Deployment

```bash
# 1. Navigate to backend
cd backend

# 2. Create deployment package
zip -r ../backend.zip . -x "*.pyc" -x "__pycache__/*" -x ".venv/*"

# 3. Deploy to Azure
az webapp deployment source config-zip \
  --resource-group secure-renewals-rg \
  --name secure-renewals-api \
  --src ../backend.zip

# 4. Set startup command
az webapp config set \
  --resource-group secure-renewals-rg \
  --name secure-renewals-api \
  --startup-file "gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app --bind 0.0.0.0:8000"

# 5. Run database migrations
az webapp ssh --resource-group secure-renewals-rg --name secure-renewals-api
# Then run: alembic upgrade head
```

### Frontend Deployment

```bash
# 1. Navigate to frontend
cd frontend

# 2. Build the application
npm install
npm run build

# 3. Create deployment package
cd dist
zip -r ../../frontend.zip .

# 4. Deploy to Azure
az webapp deployment source config-zip \
  --resource-group secure-renewals-rg \
  --name secure-renewals-app \
  --src ../../frontend.zip
```

---

## 🔐 Environment Variables & Secrets

### Backend Environment Variables

Set these in Azure Portal: **App Service → Configuration → Application settings**

```env
# Database
DATABASE_URL=postgresql+asyncpg://user:password@server.postgres.database.azure.com:5432/dbname

# Authentication
AUTH_SECRET_KEY=your-256-bit-secret-key
AUTH_ISSUER=https://login.microsoftonline.com/{tenant-id}/v2.0
AUTH_AUDIENCE=api://secure-renewals
AUTH_JWKS_URL=https://login.microsoftonline.com/{tenant-id}/discovery/v2.0/keys

# CORS
ALLOWED_ORIGINS=https://secure-renewals-app.azurewebsites.net

# Application
APP_ENV=production
LOG_LEVEL=INFO
```

Or set via Azure CLI:

```bash
az webapp config appsettings set \
  --resource-group secure-renewals-rg \
  --name secure-renewals-api \
  --settings \
    DATABASE_URL="postgresql+asyncpg://..." \
    AUTH_SECRET_KEY="your-secret" \
    ALLOWED_ORIGINS="https://secure-renewals-app.azurewebsites.net"
```

### Frontend Environment Variables

```env
VITE_API_BASE_URL=https://secure-renewals-api.azurewebsites.net/api
```

---

## 🗄️ Database Setup (Azure PostgreSQL)

### Create Azure Database for PostgreSQL

```bash
# Variables
RESOURCE_GROUP="secure-renewals-rg"
PG_SERVER="secure-renewals-db"
PG_ADMIN="secureadmin"
PG_PASSWORD="YourSecurePassword123!"
DATABASE="secure_renewals"

# Create PostgreSQL Flexible Server
az postgres flexible-server create \
  --resource-group $RESOURCE_GROUP \
  --name $PG_SERVER \
  --admin-user $PG_ADMIN \
  --admin-password $PG_PASSWORD \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --storage-size 32 \
  --version 15

# Create database
az postgres flexible-server db create \
  --resource-group $RESOURCE_GROUP \
  --server-name $PG_SERVER \
  --database-name $DATABASE

# Allow Azure services
az postgres flexible-server firewall-rule create \
  --resource-group $RESOURCE_GROUP \
  --name $PG_SERVER \
  --rule-name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0
```

### Connection String Format

```
postgresql+asyncpg://secureadmin:YourSecurePassword123!@secure-renewals-db.postgres.database.azure.com:5432/secure_renewals?sslmode=require
```

---

## 🌐 Custom Domain & SSL

### Add Custom Domain

```bash
# Add custom domain
az webapp config hostname add \
  --resource-group secure-renewals-rg \
  --webapp-name secure-renewals-app \
  --hostname hr.yourcompany.com

# Create managed SSL certificate (free!)
az webapp config ssl create \
  --resource-group secure-renewals-rg \
  --name secure-renewals-app \
  --hostname hr.yourcompany.com

# Bind SSL certificate
az webapp config ssl bind \
  --resource-group secure-renewals-rg \
  --name secure-renewals-app \
  --certificate-thumbprint <thumbprint> \
  --ssl-type SNI
```

### DNS Configuration

Add these DNS records at your domain registrar:

| Type | Name | Value |
|------|------|-------|
| CNAME | hr | secure-renewals-app.azurewebsites.net |
| TXT | asuid.hr | (verification token from Azure) |

---

## 📊 Monitoring & Logging

### Enable Application Insights

```bash
# Create Application Insights
az monitor app-insights component create \
  --app secure-renewals-insights \
  --location eastus \
  --resource-group secure-renewals-rg

# Link to web app
az webapp config appsettings set \
  --resource-group secure-renewals-rg \
  --name secure-renewals-api \
  --settings APPLICATIONINSIGHTS_CONNECTION_STRING="InstrumentationKey=..."
```

### View Logs

```bash
# Stream live logs
az webapp log tail \
  --resource-group secure-renewals-rg \
  --name secure-renewals-api

# Download logs
az webapp log download \
  --resource-group secure-renewals-rg \
  --name secure-renewals-api
```

---

## 💰 Cost Estimation

### Monthly Cost Breakdown (Production)

| Resource | SKU | Estimated Cost |
|----------|-----|----------------|
| App Service Plan (x2 apps) | B1 | ~$13/month |
| PostgreSQL Flexible Server | B1ms | ~$15/month |
| Application Insights | Basic | ~$5/month |
| **Total** | | **~$33/month** |

### Development/Testing (Lower Cost)

| Resource | SKU | Estimated Cost |
|----------|-----|----------------|
| App Service Plan | F1 (Free) | $0/month |
| PostgreSQL Flexible Server | B1ms | ~$15/month |
| **Total** | | **~$15/month** |

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Application Not Starting

```bash
# Check logs
az webapp log tail --resource-group secure-renewals-rg --name secure-renewals-api

# Verify startup command
az webapp config show --resource-group secure-renewals-rg --name secure-renewals-api --query "linuxFxVersion"
```

#### 2. Database Connection Failed

- Verify firewall rules allow Azure services
- Check connection string format (use `asyncpg` driver)
- Ensure SSL mode is set to `require`

#### 3. CORS Errors

- Add frontend URL to `ALLOWED_ORIGINS` setting
- Include both `http://` and `https://` if testing locally

#### 4. Deployment Failed

- Check GitHub Actions logs for errors
- Verify Azure credentials are correctly configured
- Ensure publish profile is up to date

### Getting Help

1. Check [Azure App Service documentation](https://docs.microsoft.com/azure/app-service/)
2. Review GitHub Actions workflow logs
3. Open an issue in this repository

---

## 📚 Additional Resources

- [Azure App Service Documentation](https://docs.microsoft.com/azure/app-service/)
- [GitHub Actions for Azure](https://github.com/Azure/actions)
- [FastAPI Deployment Guide](https://fastapi.tiangolo.com/deployment/)
- [Azure PostgreSQL Documentation](https://docs.microsoft.com/azure/postgresql/)

---

<p align="center">
  <strong>Secure Renewals HR Portal - Azure Deployment</strong><br>
  Built with ❤️ for HR teams
</p>
