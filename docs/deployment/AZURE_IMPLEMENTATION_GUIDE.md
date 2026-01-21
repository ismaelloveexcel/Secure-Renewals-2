# Azure Implementation Guide - Step-by-Step

**Target**: Azure Deployment HR Portal  
**Source**: Secure-Renewals-2 Repository  
**Timeline**: 6 weeks (with 1 developer + 1 DevOps)  
**Cost**: $45-80/month (optimized)

---

## 📋 Pre-Deployment Checklist

Before starting, ensure you have:

- [ ] Azure subscription with Owner or Contributor role
- [ ] Azure CLI installed (`az --version`)
- [ ] Git installed
- [ ] Node.js 18+ installed
- [ ] Python 3.11+ installed
- [ ] Access to employee data (CSV format)
- [ ] Domain name (optional, for custom domain)
- [ ] SSL certificate (optional, Azure provides free)

---

## 🚀 PHASE 1: Azure Infrastructure Setup (Week 1, Day 1-2)

### Step 1.1: Login to Azure

```bash
# Login to Azure
az login

# List subscriptions
az account list --output table

# Set active subscription
az account set --subscription "<your-subscription-id>"

# Verify
az account show
```

### Step 1.2: Create Resource Group

```bash
# Choose a region close to your users
# For UAE: "uaenorth" or "uaecentral"
# For general: "eastus", "westeurope", "southeastasia"

az group create \
  --name hr-portal-rg \
  --location uaenorth \
  --tags Environment=Production Application=HR-Portal
```

### Step 1.3: Create PostgreSQL Database

```bash
# Create PostgreSQL flexible server
az postgres flexible-server create \
  --resource-group hr-portal-rg \
  --name hr-portal-db \
  --location uaenorth \
  --admin-user hradmin \
  --admin-password 'YourSecurePassword123!' \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --version 16 \
  --storage-size 32 \
  --public-access 0.0.0.0 \
  --tags Application=HR-Portal

# Create database
az postgres flexible-server db create \
  --resource-group hr-portal-rg \
  --server-name hr-portal-db \
  --database-name hrportal

# Get connection string
echo "postgresql+asyncpg://hradmin:YourSecurePassword123!@hr-portal-db.postgres.database.azure.com:5432/hrportal?ssl=require"
```

### Step 1.4: Create Storage Account (for documents)

```bash
# Create storage account
az storage account create \
  --name hrportalstorage \
  --resource-group hr-portal-rg \
  --location uaenorth \
  --sku Standard_LRS \
  --kind StorageV2 \
  --access-tier Hot

# Create container for documents
az storage container create \
  --name documents \
  --account-name hrportalstorage \
  --auth-mode login

# Get connection string
az storage account show-connection-string \
  --name hrportalstorage \
  --resource-group hr-portal-rg
```

### Step 1.5: Create Key Vault (for secrets)

```bash
# Create Key Vault
az keyvault create \
  --name hr-portal-kv \
  --resource-group hr-portal-rg \
  --location uaenorth

# Add secrets
az keyvault secret set \
  --vault-name hr-portal-kv \
  --name DatabaseURL \
  --value "postgresql+asyncpg://hradmin:YourSecurePassword123!@hr-portal-db.postgres.database.azure.com:5432/hrportal?ssl=require"

az keyvault secret set \
  --vault-name hr-portal-kv \
  --name JWTSecretKey \
  --value "$(openssl rand -hex 32)"

az keyvault secret set \
  --vault-name hr-portal-kv \
  --name StorageConnectionString \
  --value "<from-previous-step>"
```

### Step 1.6: Create App Service Plan

```bash
# Create App Service plan (Linux)
az appservice plan create \
  --name hr-portal-plan \
  --resource-group hr-portal-rg \
  --location uaenorth \
  --is-linux \
  --sku B1 \
  --tags Application=HR-Portal
```

---

## 🔧 PHASE 2: Backend Deployment (Week 1, Day 3-5)

### Step 2.1: Clone Repository Locally

```bash
# Clone the repository
git clone https://github.com/ismaelloveexcel/Secure-Renewals-2.git
cd Secure-Renewals-2
```

### Step 2.2: Create Backend Web App

```bash
# Create web app for backend
az webapp create \
  --resource-group hr-portal-rg \
  --plan hr-portal-plan \
  --name hr-portal-api \
  --runtime "PYTHON:3.11" \
  --tags Application=HR-Portal

# Enable logging
az webapp log config \
  --resource-group hr-portal-rg \
  --name hr-portal-api \
  --application-logging filesystem \
  --detailed-error-messages true \
  --failed-request-tracing true \
  --level verbose
```

### Step 2.3: Configure Backend Environment Variables

```bash
# Set environment variables from Key Vault
az webapp config appsettings set \
  --resource-group hr-portal-rg \
  --name hr-portal-api \
  --settings \
    DATABASE_URL="@Microsoft.KeyVault(SecretUri=https://hr-portal-kv.vault.azure.net/secrets/DatabaseURL/)" \
    AUTH_SECRET_KEY="@Microsoft.KeyVault(SecretUri=https://hr-portal-kv.vault.azure.net/secrets/JWTSecretKey/)" \
    AZURE_STORAGE_CONNECTION_STRING="@Microsoft.KeyVault(SecretUri=https://hr-portal-kv.vault.azure.net/secrets/StorageConnectionString/)" \
    AZURE_STORAGE_CONTAINER_NAME="documents" \
    ALLOWED_ORIGINS="https://hr-portal-web.azurewebsites.net,https://yourdomain.com" \
    JWT_ALGORITHM="HS256" \
    ACCESS_TOKEN_EXPIRE_MINUTES="480" \
    PYTHONUNBUFFERED="1"

# Grant Key Vault access to App Service
WEBAPP_IDENTITY=$(az webapp identity assign \
  --resource-group hr-portal-rg \
  --name hr-portal-api \
  --query principalId \
  --output tsv)

az keyvault set-policy \
  --name hr-portal-kv \
  --object-id $WEBAPP_IDENTITY \
  --secret-permissions get list
```

### Step 2.4: Configure Startup Command

```bash
# Set startup command for FastAPI
az webapp config set \
  --resource-group hr-portal-rg \
  --name hr-portal-api \
  --startup-file "python -m uvicorn app.main:app --host 0.0.0.0 --port 8000"
```

### Step 2.5: Deploy Backend Code

**Option A: Using Azure CLI**
```bash
cd backend

# Create deployment package
zip -r deploy.zip . -x "*.pyc" -x "__pycache__/*"

# Deploy
az webapp deploy \
  --resource-group hr-portal-rg \
  --name hr-portal-api \
  --src-path deploy.zip \
  --type zip
```

**Option B: Using GitHub Actions (Recommended)**

Create `.github/workflows/deploy-backend.yml`:

```yaml
name: Deploy Backend to Azure

on:
  push:
    branches: [main]
    paths:
      - 'backend/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}
      
      - name: Deploy to Azure Web App
        uses: azure/webapps-deploy@v2
        with:
          app-name: hr-portal-api
          package: ./backend
```

### Step 2.6: Run Database Migrations

```bash
# SSH into App Service
az webapp ssh --resource-group hr-portal-rg --name hr-portal-api

# Inside the app container:
cd /home/site/wwwroot
python -m pip install alembic
python -m alembic upgrade head

# Exit SSH
exit
```

**Alternative: Run migrations locally**
```bash
# Set database URL
export DATABASE_URL="postgresql+asyncpg://hradmin:YourSecurePassword123!@hr-portal-db.postgres.database.azure.com:5432/hrportal?ssl=require"

cd backend
alembic upgrade head
```

### Step 2.7: Import Employee Data

```bash
# Copy employee CSV to server
az webapp deploy \
  --resource-group hr-portal-rg \
  --name hr-portal-api \
  --src-path ../Employees-Employee-Database-Github.csv \
  --type static \
  --target-path /home/site/wwwroot/employees.csv

# SSH into app
az webapp ssh --resource-group hr-portal-rg --name hr-portal-api

# Run import script
cd /home/site/wwwroot
python scripts/import_employees.py employees.csv

# Exit
exit
```

### Step 2.8: Test Backend API

```bash
# Get API URL
API_URL=$(az webapp show \
  --resource-group hr-portal-rg \
  --name hr-portal-api \
  --query defaultHostName \
  --output tsv)

echo "API URL: https://$API_URL"

# Test health endpoint
curl https://$API_URL/api/health

# Test docs
open https://$API_URL/docs
```

---

## 🎨 PHASE 3: Frontend Deployment (Week 2, Day 1-3)

### Step 3.1: Create Static Web App

```bash
# Create Static Web App
az staticwebapp create \
  --name hr-portal-web \
  --resource-group hr-portal-rg \
  --location eastus2 \
  --tags Application=HR-Portal

# Get deployment token
DEPLOYMENT_TOKEN=$(az staticwebapp secrets list \
  --name hr-portal-web \
  --resource-group hr-portal-rg \
  --query properties.apiKey \
  --output tsv)

echo "Deployment Token: $DEPLOYMENT_TOKEN"
```

### Step 3.2: Configure Frontend Environment

```bash
cd frontend

# Create production .env
cat > .env.production <<EOF
VITE_API_BASE_URL=https://hr-portal-api.azurewebsites.net/api
EOF
```

### Step 3.3: Build Frontend

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Test build locally
npm run preview
```

### Step 3.4: Deploy Frontend

**Option A: Using Azure CLI**
```bash
# Install Static Web Apps CLI
npm install -g @azure/static-web-apps-cli

# Deploy
swa deploy \
  --app-location ./dist \
  --deployment-token $DEPLOYMENT_TOKEN
```

**Option B: Using GitHub Actions (Recommended)**

Create `.github/workflows/deploy-frontend.yml`:

```yaml
name: Deploy Frontend to Azure Static Web Apps

on:
  push:
    branches: [main]
    paths:
      - 'frontend/**'

jobs:
  build_and_deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Build
        run: |
          cd frontend
          npm ci
          npm run build
      
      - name: Deploy
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          action: "upload"
          app_location: "/frontend"
          output_location: "dist"
```

### Step 3.5: Test Frontend

```bash
# Get Static Web App URL
FRONTEND_URL=$(az staticwebapp show \
  --name hr-portal-web \
  --resource-group hr-portal-rg \
  --query defaultHostname \
  --output tsv)

echo "Frontend URL: https://$FRONTEND_URL"

# Open in browser
open https://$FRONTEND_URL
```

---

## 🔐 PHASE 4: Security Hardening (Week 2, Day 4-5)

### Step 4.1: Enable HTTPS Only

```bash
# Enforce HTTPS
az webapp update \
  --resource-group hr-portal-rg \
  --name hr-portal-api \
  --https-only true
```

### Step 4.2: Configure Custom Domain (Optional)

```bash
# Add custom domain
az webapp config hostname add \
  --resource-group hr-portal-rg \
  --webapp-name hr-portal-api \
  --hostname api.yourdomain.com

# Enable HTTPS for custom domain
az webapp config ssl bind \
  --resource-group hr-portal-rg \
  --name hr-portal-api \
  --certificate-thumbprint <thumbprint> \
  --ssl-type SNI
```

### Step 4.3: Enable Application Insights

```bash
# Create Application Insights
az monitor app-insights component create \
  --app hr-portal-insights \
  --location uaenorth \
  --resource-group hr-portal-rg \
  --application-type web

# Get instrumentation key
INSTRUMENTATION_KEY=$(az monitor app-insights component show \
  --app hr-portal-insights \
  --resource-group hr-portal-rg \
  --query instrumentationKey \
  --output tsv)

# Configure backend to use App Insights
az webapp config appsettings set \
  --resource-group hr-portal-rg \
  --name hr-portal-api \
  --settings \
    APPLICATIONINSIGHTS_CONNECTION_STRING="InstrumentationKey=$INSTRUMENTATION_KEY"
```

### Step 4.4: Configure Network Security

```bash
# Restrict database access to App Service only
WEBAPP_OUTBOUND_IPS=$(az webapp show \
  --resource-group hr-portal-rg \
  --name hr-portal-api \
  --query outboundIpAddresses \
  --output tsv)

# Add firewall rules for each IP
for ip in ${WEBAPP_OUTBOUND_IPS//,/ }; do
  az postgres flexible-server firewall-rule create \
    --resource-group hr-portal-rg \
    --name hr-portal-db \
    --rule-name "Allow-AppService-$ip" \
    --start-ip-address $ip \
    --end-ip-address $ip
done
```

### Step 4.5: Enable Backup

```bash
# Configure automated backups for database
az postgres flexible-server backup create \
  --resource-group hr-portal-rg \
  --name hr-portal-db \
  --backup-name "daily-backup-$(date +%Y%m%d)"

# Schedule daily backups (via Azure Portal or ARM template)
```

---

## 📊 PHASE 5: Monitoring & Alerts (Week 3, Day 1)

### Step 5.1: Create Monitoring Dashboard

```bash
# Create Azure Dashboard (via Portal)
# Add tiles for:
# - App Service metrics (CPU, Memory, Response Time)
# - Database metrics (Connections, CPU, Storage)
# - Application Insights (Requests, Failures, Performance)
```

### Step 5.2: Configure Alerts

```bash
# Alert on high error rate
az monitor metrics alert create \
  --name "High-Error-Rate" \
  --resource-group hr-portal-rg \
  --scopes $(az webapp show --resource-group hr-portal-rg --name hr-portal-api --query id -o tsv) \
  --condition "avg Http5xx > 10" \
  --window-size 5m \
  --evaluation-frequency 1m \
  --action <action-group-id>

# Alert on high response time
az monitor metrics alert create \
  --name "High-Response-Time" \
  --resource-group hr-portal-rg \
  --scopes $(az webapp show --resource-group hr-portal-rg --name hr-portal-api --query id -o tsv) \
  --condition "avg ResponseTime > 2000" \
  --window-size 5m \
  --evaluation-frequency 1m \
  --action <action-group-id>

# Alert on database CPU
az monitor metrics alert create \
  --name "High-Database-CPU" \
  --resource-group hr-portal-rg \
  --scopes $(az postgres flexible-server show --resource-group hr-portal-rg --name hr-portal-db --query id -o tsv) \
  --condition "avg cpu_percent > 80" \
  --window-size 5m \
  --evaluation-frequency 1m \
  --action <action-group-id>
```

---

## 🧪 PHASE 6: Testing (Week 3, Day 2-5)

### Step 6.1: Functional Testing

Test each module:

**Authentication**:
```bash
# Test login
curl -X POST https://hr-portal-api.azurewebsites.net/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"employee_id": "ADMIN001", "password": "01011990"}'

# Expected: JWT token returned
```

**Employee Management**:
```bash
# List employees (with token)
curl https://hr-portal-api.azurewebsites.net/api/employees \
  -H "Authorization: Bearer <token>"

# Expected: Employee list returned
```

**Compliance Alerts**:
```bash
# Get compliance alerts
curl https://hr-portal-api.azurewebsites.net/api/compliance/alerts \
  -H "Authorization: Bearer <token>"

# Expected: Alert list with urgency levels
```

### Step 6.2: Load Testing

```bash
# Install Apache Bench
sudo apt-get install apache2-utils

# Test API performance
ab -n 1000 -c 10 -H "Authorization: Bearer <token>" \
  https://hr-portal-api.azurewebsites.net/api/employees

# Expected: 
# - Requests per second > 100
# - Average response time < 500ms
# - Failed requests = 0
```

### Step 6.3: Security Testing

```bash
# Test HTTPS enforcement
curl -I http://hr-portal-api.azurewebsites.net
# Expected: 301 redirect to HTTPS

# Test authentication
curl https://hr-portal-api.azurewebsites.net/api/employees
# Expected: 401 Unauthorized

# Test CORS
curl -H "Origin: https://malicious-site.com" \
  https://hr-portal-api.azurewebsites.net/api/employees
# Expected: CORS error
```

---

## 👥 PHASE 7: User Training (Week 4)

### Step 7.1: HR Staff Training

**Training Materials**:
- Share HR User Guide: `docs/user-guides/HR_USER_GUIDE.md`
- Admin Dashboard walkthrough
- Compliance alert management
- Employee import process
- Document management

**Training Session Agenda** (2 hours):
1. Introduction to the portal (15 min)
2. Admin dashboard tour (30 min)
3. Employee management (20 min)
4. Compliance tracking (20 min)
5. Document upload/management (15 min)
6. Recruitment module (15 min)
7. Q&A (5 min)

### Step 7.2: Employee Training

**Training Materials**:
- Quick start guide (create simplified version)
- Video tutorial (screen recording)
- FAQ document

**Communication Plan**:
1. **Week 1**: Announcement email with portal URL
2. **Week 2**: Training sessions (in-person or virtual)
3. **Week 3**: Email reminders with quick start guide
4. **Week 4**: Follow-up support sessions

---

## 🚀 PHASE 8: Go-Live (Week 5-6)

### Step 8.1: Pre-Launch Checklist

- [ ] All employees imported successfully
- [ ] Authentication tested with sample users (all roles)
- [ ] Compliance data imported and alerts configured
- [ ] Documents uploaded to Azure Blob Storage
- [ ] All API endpoints tested and responding < 500ms
- [ ] Frontend loads in < 2 seconds
- [ ] Mobile responsiveness verified
- [ ] SSL certificate valid and HTTPS enforced
- [ ] Monitoring dashboard configured
- [ ] Alerts configured and tested
- [ ] Backup strategy implemented and tested
- [ ] Recovery procedure documented and tested
- [ ] User training completed
- [ ] Support email/channel set up

### Step 8.2: Soft Launch (Week 5)

**Day 1-2**: HR team only
- HR staff use the portal exclusively
- Report any issues immediately
- Document workarounds if needed

**Day 3-4**: Pilot group (10-20 employees)
- Select tech-savvy employees
- Monitor usage and gather feedback
- Fix critical issues

**Day 5**: Review and adjust
- Address feedback
- Update documentation
- Prepare for full rollout

### Step 8.3: Full Launch (Week 6)

**Monday**: Announcement
- Send company-wide email
- Share quick start guide
- Provide support contact

**Tuesday-Friday**: Support & Monitoring
- Monitor error logs hourly
- Respond to support requests within 2 hours
- Track adoption metrics
- Collect user feedback

**Week 2**: Review & Optimize
- Analyze usage patterns
- Identify pain points
- Implement quick wins
- Plan Phase 2 features

### Step 8.4: Post-Launch Metrics

Track these metrics:

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Employee adoption | 80% in 30 days | Active users / Total employees |
| Login success rate | > 95% | Successful logins / Total attempts |
| Profile completion | > 70% | Profiles completed / Total employees |
| Support tickets | < 10/week after month 1 | Support system |
| User satisfaction | > 4.0/5.0 | Survey (monthly) |
| API response time | < 500ms (p95) | Application Insights |
| API error rate | < 1% | Application Insights |
| System uptime | > 99.5% | Azure Monitor |

---

## 💰 Cost Optimization Tips

### Immediate Savings

1. **Use Reserved Instances**:
```bash
# Purchase 1-year reserved capacity (save 30%)
az reservations reservation-order calculate \
  --sku-name Standard_B1ms \
  --location uaenorth \
  --term P1Y
```

2. **Auto-Scaling**:
```bash
# Scale down during non-business hours
az monitor autoscale create \
  --resource-group hr-portal-rg \
  --resource hr-portal-api \
  --resource-type Microsoft.Web/serverfarms \
  --name autoscale-hr-portal \
  --min-count 1 \
  --max-count 3 \
  --count 1

# Scale up during business hours (8 AM - 6 PM)
az monitor autoscale rule create \
  --autoscale-name autoscale-hr-portal \
  --resource-group hr-portal-rg \
  --condition "CpuPercentage > 70 avg 5m" \
  --scale out 1
```

3. **Storage Tiering**:
```bash
# Move old documents to Cool tier (after 90 days)
az storage account management-policy create \
  --account-name hrportalstorage \
  --resource-group hr-portal-rg \
  --policy @lifecycle-policy.json
```

`lifecycle-policy.json`:
```json
{
  "rules": [
    {
      "enabled": true,
      "name": "move-to-cool",
      "type": "Lifecycle",
      "definition": {
        "actions": {
          "baseBlob": {
            "tierToCool": {
              "daysAfterModificationGreaterThan": 90
            }
          }
        },
        "filters": {
          "blobTypes": ["blockBlob"]
        }
      }
    }
  ]
}
```

---

## 🆘 Troubleshooting

### Issue: Database Connection Timeout

**Symptoms**: Backend logs show "connection timeout" errors

**Solution**:
```bash
# Check firewall rules
az postgres flexible-server firewall-rule list \
  --resource-group hr-portal-rg \
  --name hr-portal-db

# Add missing IP
az postgres flexible-server firewall-rule create \
  --resource-group hr-portal-rg \
  --name hr-portal-db \
  --rule-name "Allow-MyIP" \
  --start-ip-address <your-ip> \
  --end-ip-address <your-ip>
```

### Issue: 502 Bad Gateway

**Symptoms**: Frontend shows 502 error when accessing API

**Solution**:
```bash
# Check App Service logs
az webapp log tail \
  --resource-group hr-portal-rg \
  --name hr-portal-api

# Restart App Service
az webapp restart \
  --resource-group hr-portal-rg \
  --name hr-portal-api
```

### Issue: Slow API Response

**Symptoms**: API response time > 2 seconds

**Solution**:
```bash
# Check database performance
az postgres flexible-server show \
  --resource-group hr-portal-rg \
  --name hr-portal-db \
  --query "{CPU: cpuPercent, Memory: memoryPercent, Storage: storagePercent}"

# Upgrade database tier if needed
az postgres flexible-server update \
  --resource-group hr-portal-rg \
  --name hr-portal-db \
  --sku-name Standard_B2s
```

---

## 📞 Support & Resources

### Azure Documentation
- [App Service](https://docs.microsoft.com/azure/app-service/)
- [PostgreSQL](https://docs.microsoft.com/azure/postgresql/)
- [Static Web Apps](https://docs.microsoft.com/azure/static-web-apps/)
- [Key Vault](https://docs.microsoft.com/azure/key-vault/)

### Repository Documentation
- HR User Guide: `docs/user-guides/HR_USER_GUIDE.md`
- System Architecture: `app_architecture.json`
- API Documentation: Visit `/docs` endpoint on backend

### Get Help
- **Issues**: https://github.com/ismaelloveexcel/Secure-Renewals-2/issues
- **Discussions**: https://github.com/ismaelloveexcel/Secure-Renewals-2/discussions
- **Azure Support**: https://azure.microsoft.com/support/

---

## ✅ Success! You're Live

Congratulations! Your HR Portal is now live on Azure. 🎉

**Next Steps**:
1. Monitor usage for first 2 weeks
2. Collect user feedback
3. Plan Phase 2 features (based on feedback)
4. Consider adding:
   - Power BI dashboards
   - Azure AD integration
   - Mobile app (optional)
   - Automated workflows with Logic Apps

---

**End of Implementation Guide**

Last Updated: January 2026
