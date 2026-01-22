# Azure Migration Quick Reference

**From**: Secure-Renewals-2 Repository  
**To**: Azure Deployment HR Portal  
**Time**: 6 weeks  
**Cost**: ~$50-80/month

---

## 📋 Files to Copy Directly

### Backend Files (Copy As-Is)

```
✅ CRITICAL - Copy Immediately:
├── backend/app/models/employee.py              → Employee master table
├── backend/app/models/employee_profile.py      → Self-service profile
├── backend/app/models/employee_compliance.py   → UAE compliance tracking
├── backend/app/models/employee_bank.py         → WPS bank details
├── backend/app/models/employee_document.py     → Document registry
├── backend/app/models/audit_log.py             → Audit trail
├── backend/app/routers/auth.py                 → Authentication API
├── backend/app/routers/employees.py            → Employee CRUD API
├── backend/app/routers/employee_compliance.py  → Compliance API
├── backend/app/routers/admin.py                → Admin dashboard API
└── backend/alembic/versions/*.py               → Database migrations

⭐ HIGH PRIORITY - Copy Next:
├── backend/app/models/attendance.py            → Attendance tracking
├── backend/app/models/renewal.py               → Contract renewals
├── backend/app/routers/attendance.py           → Attendance API
├── backend/app/routers/employee_documents.py   → Document upload API
└── backend/app/services/compliance_service.py  → Compliance logic

🔄 MEDIUM PRIORITY - Copy Later:
├── backend/app/models/recruitment.py           → ATS system
├── backend/app/models/passes.py                → Access passes
├── backend/app/routers/recruitment.py          → Recruitment API
├── backend/app/routers/onboarding.py           → Onboarding API
└── backend/app/routers/passes.py               → Pass generation API
```

### Frontend Files (Copy As-Is)

```
✅ CRITICAL - Copy Immediately:
├── frontend/src/components/Admin/              → Admin dashboard
├── frontend/src/components/EmployeeProfile/    → Self-service profile
├── frontend/src/services/api.ts                → API client
└── frontend/src/App.tsx                        → Main app

⭐ HIGH PRIORITY - Copy Next:
├── frontend/src/components/Compliance/         → Compliance alerts
└── frontend/src/components/ManagerPass/        → Manager dashboard

🔄 MEDIUM PRIORITY - Copy Later:
├── frontend/src/components/Recruitment/        → ATS interface
└── frontend/src/components/BasePass/           → Pass generation UI
```

### Configuration Files

```
✅ Copy & Modify:
├── backend/.env.example                        → Environment template
├── frontend/vite.config.ts                     → Frontend build config
├── docker-compose.yml                          → Local dev (optional)
└── backend/alembic.ini                         → Migration config
```

### Documentation

```
✅ Copy Directly:
├── docs/user-guides/HR_USER_GUIDE.md          → HR training
├── docs/hr-management/HR_IMPLEMENTATION_PLAN.md → HR process guide
└── docs/README.md                              → Doc index
```

---

## 🔧 Environment Variables

### Backend (.env)

```env
# Database (Azure PostgreSQL)
DATABASE_URL=postgresql+asyncpg://hradmin:PASSWORD@hr-portal-db.postgres.database.azure.com:5432/hrportal?ssl=require

# Authentication
AUTH_SECRET_KEY=<generate-with-openssl-rand-hex-32>
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480

# Azure Storage
AZURE_STORAGE_CONNECTION_STRING=<from-azure-portal>
AZURE_STORAGE_CONTAINER_NAME=documents

# CORS (update with your frontend URL)
ALLOWED_ORIGINS=https://hr-portal-web.azurewebsites.net

# Optional: Azure Services
AZURE_FORM_RECOGNIZER_ENDPOINT=<from-azure-portal>
AZURE_FORM_RECOGNIZER_KEY=<from-azure-portal>
APPLICATIONINSIGHTS_CONNECTION_STRING=<from-azure-portal>
```

### Frontend (.env.production)

```env
VITE_API_BASE_URL=https://hr-portal-api.azurewebsites.net/api
```

---

## 🚀 One-Command Deployment

### 1. Prerequisites

```bash
# Install Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Login
az login

# Set subscription
az account set --subscription "<your-subscription-id>"
```

### 2. Deploy Infrastructure (5 minutes)

```bash
# Set variables
RESOURCE_GROUP="hr-portal-rg"
LOCATION="uaenorth"
DB_NAME="hr-portal-db"
API_NAME="hr-portal-api"
WEB_NAME="hr-portal-web"

# Create everything
az group create --name $RESOURCE_GROUP --location $LOCATION

az postgres flexible-server create \
  --resource-group $RESOURCE_GROUP \
  --name $DB_NAME \
  --location $LOCATION \
  --admin-user hradmin \
  --admin-password 'SecurePass123!' \
  --sku-name Standard_B1ms \
  --storage-size 32

az appservice plan create \
  --name "${RESOURCE_GROUP}-plan" \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --is-linux \
  --sku B1

az webapp create \
  --resource-group $RESOURCE_GROUP \
  --plan "${RESOURCE_GROUP}-plan" \
  --name $API_NAME \
  --runtime "PYTHON:3.11"

az staticwebapp create \
  --name $WEB_NAME \
  --resource-group $RESOURCE_GROUP \
  --location eastus2
```

### 3. Deploy Code (10 minutes)

```bash
# Backend
cd backend
zip -r deploy.zip .
az webapp deploy --resource-group $RESOURCE_GROUP --name $API_NAME --src-path deploy.zip --type zip

# Frontend
cd ../frontend
npm install && npm run build
npx @azure/static-web-apps-cli deploy --app-location ./dist
```

### 4. Run Migrations (2 minutes)

```bash
export DATABASE_URL="postgresql+asyncpg://hradmin:SecurePass123!@${DB_NAME}.postgres.database.azure.com:5432/postgres?ssl=require"
cd backend
alembic upgrade head
```

### 5. Import Employees (1 minute)

```bash
python scripts/import_employees.py ../Employees-Employee-Database-Github.csv
```

**Total Time: ~18 minutes** ✅

---

## 📊 Database Tables Priority

### Migrate in This Order

**Phase 1 (Week 1)** - Foundation:
1. ✅ `employees` - Master table with authentication
2. ✅ `employee_profiles` - Self-service data
3. ✅ `employee_compliance` - UAE visa/EID tracking
4. ✅ `audit_logs` - Compliance trail

**Phase 2 (Week 2)** - Core Operations:
5. ✅ `employee_bank` - WPS bank details
6. ✅ `employee_documents` - Document registry
7. ✅ `attendance` - Clock in/out
8. ✅ `renewals` - Contract tracking

**Phase 3 (Week 3-4)** - Advanced:
9. ⭐ `recruitment_requests` - Job openings
10. ⭐ `candidates` - Applicant tracking
11. ⭐ `passes` - Access passes
12. ⭐ `onboarding_tokens` - Invite system

**Phase 4 (Week 5-6)** - Optional:
13. 🔄 `performance` - Performance reviews
14. 🔄 `templates` - Document templates
15. 🔄 `nominations` - EOY awards
16. 🔄 `insurance_census` - Insurance tracking

---

## 🎯 Feature Priority Matrix

| Feature | Complexity | Impact | Priority | Timeline |
|---------|-----------|---------|----------|----------|
| Employee Master + Auth | Medium | ⭐⭐⭐⭐⭐ | CRITICAL | Week 1 |
| Compliance Tracking | Medium | ⭐⭐⭐⭐⭐ | CRITICAL | Week 1 |
| Admin Dashboard | High | ⭐⭐⭐⭐⭐ | CRITICAL | Week 1-2 |
| Self-Service Profile | Medium | ⭐⭐⭐⭐ | HIGH | Week 2 |
| Document Management | Medium | ⭐⭐⭐⭐ | HIGH | Week 2 |
| Attendance Tracking | Medium | ⭐⭐⭐⭐ | HIGH | Week 3 |
| Bank Details | Low | ⭐⭐⭐⭐ | HIGH | Week 3 |
| Recruitment (ATS) | High | ⭐⭐⭐ | MEDIUM | Week 4-5 |
| Pass Generation | Low | ⭐⭐⭐ | MEDIUM | Week 5 |
| Onboarding | Medium | ⭐⭐⭐ | MEDIUM | Week 5 |
| Leave Management | Medium | ⭐⭐⭐ | MEDIUM | Week 6 |
| Performance Reviews | Medium | ⭐⭐ | LOW | Post-launch |
| Templates | Low | ⭐⭐ | LOW | Post-launch |

---

## 🔐 Security Checklist

### Azure Infrastructure

- [ ] Enable HTTPS only on App Service
- [ ] Configure Azure Key Vault for secrets
- [ ] Restrict database access to App Service IPs only
- [ ] Enable Azure Application Gateway WAF (optional, adds $35/mo)
- [ ] Configure Network Security Groups
- [ ] Enable Azure Monitor alerts
- [ ] Configure automated backups
- [ ] Enable geo-redundancy for database (adds $12/mo)

### Application Security

- [ ] JWT secret stored in Key Vault
- [ ] Database password stored in Key Vault
- [ ] CORS configured with allowed origins only
- [ ] Rate limiting enabled (already in code)
- [ ] Input validation with Pydantic (already in code)
- [ ] SQL injection protection (SQLAlchemy ORM)
- [ ] Audit logging enabled (already in code)

### Compliance

- [ ] SSL/TLS certificates configured
- [ ] Data encryption at rest (Azure default)
- [ ] Data encryption in transit (SSL)
- [ ] UAE data residency (use uaenorth region)
- [ ] GDPR compliance (data retention policies)
- [ ] Audit trail for all actions

---

## 📈 Testing Checklist

### Pre-Launch

**Backend API**:
- [ ] Health endpoint responds (`/api/health`)
- [ ] Login works with test user
- [ ] Employee list returns data
- [ ] Compliance alerts show correctly
- [ ] Document upload works
- [ ] Database connection stable
- [ ] Response time < 500ms

**Frontend**:
- [ ] Login page loads
- [ ] Authentication flow works
- [ ] Admin dashboard renders
- [ ] Employee list displays
- [ ] Compliance alerts show
- [ ] Profile page works
- [ ] Mobile responsive

**Integration**:
- [ ] API calls succeed
- [ ] CORS configured correctly
- [ ] File uploads work
- [ ] Database queries execute
- [ ] Error handling works

### Load Testing

```bash
# Test with 100 concurrent users
ab -n 10000 -c 100 -H "Authorization: Bearer <token>" \
  https://hr-portal-api.azurewebsites.net/api/employees
```

**Targets**:
- Requests per second: > 100
- Average response time: < 500ms
- Failed requests: 0%

---

## 💰 Cost Calculator

### Monthly Costs (Production)

| Service | SKU | Cost | Total |
|---------|-----|------|-------|
| **Compute** |
| App Service | B1 (1 core, 1.75GB RAM) | $13.14 | $13.14 |
| App Service Plan | Linux | Included | $0 |
| **Database** |
| PostgreSQL | B1ms (1 vCore, 2GB RAM) | $11.50 | $11.50 |
| Backup Storage | 7 days retention | $1 | $1 |
| **Storage** |
| Blob Storage | 100 GB (LRS) | $2.05 | $2.05 |
| **Security** |
| Key Vault | 10K operations | $0.03 | $0.03 |
| **Monitoring** |
| Application Insights | 5 GB/month | $10 | $10 |
| Azure Monitor | Included | $0 | $0 |
| **Frontend** |
| Static Web Apps | Free tier | $0 | $0 |
| **Total** | | | **$37.72/month** |

### With Optimizations

| Optimization | Savings | New Total |
|--------------|---------|-----------|
| Reserved instance (1 year) | -30% ($10/mo) | $27.72 |
| Auto-scale to zero off-hours | -20% ($7/mo) | $20.72 |
| **Optimized Total** | | **~$20-30/month** |

### Scaling Costs

| Employees | Cost | Tier |
|-----------|------|------|
| 50-100 | $20-30/mo | B1 + optimizations |
| 100-500 | $60-80/mo | S1 App Service, B2s database |
| 500-1000 | $120-150/mo | P1 tier, autoscaling |
| 1000+ | $250-350/mo | Premium tier, multi-region |

---

## 🚨 Troubleshooting Quick Fixes

### Issue: "Can't connect to database"

```bash
# Check firewall rules
az postgres flexible-server firewall-rule list \
  --resource-group hr-portal-rg \
  --name hr-portal-db

# Add your IP
az postgres flexible-server firewall-rule create \
  --resource-group hr-portal-rg \
  --name hr-portal-db \
  --rule-name "AllowMyIP" \
  --start-ip-address <your-ip> \
  --end-ip-address <your-ip>
```

### Issue: "502 Bad Gateway"

```bash
# Check logs
az webapp log tail --resource-group hr-portal-rg --name hr-portal-api

# Restart app
az webapp restart --resource-group hr-portal-rg --name hr-portal-api
```

### Issue: "Slow API response"

```bash
# Check database CPU
az monitor metrics list \
  --resource $(az postgres flexible-server show --resource-group hr-portal-rg --name hr-portal-db --query id -o tsv) \
  --metric cpu_percent

# Upgrade if needed
az postgres flexible-server update \
  --resource-group hr-portal-rg \
  --name hr-portal-db \
  --sku-name Standard_B2s
```

### Issue: "Frontend can't reach API"

```bash
# Check CORS settings
az webapp config appsettings list \
  --resource-group hr-portal-rg \
  --name hr-portal-api \
  --query "[?name=='ALLOWED_ORIGINS']"

# Update CORS
az webapp config appsettings set \
  --resource-group hr-portal-rg \
  --name hr-portal-api \
  --settings ALLOWED_ORIGINS="https://hr-portal-web.azurewebsites.net,https://yourdomain.com"
```

---

## 📞 Support Resources

### Repository
- 📖 [Full Analysis](../AZURE_DEPLOYMENT_ANALYSIS.md)
- 🚀 [Implementation Guide](./AZURE_IMPLEMENTATION_GUIDE.md)
- 👥 [HR User Guide](../user-guides/HR_USER_GUIDE.md)
- 🏢 [HR Implementation Plan](../hr-management/HR_IMPLEMENTATION_PLAN.md)

### Azure Documentation
- [App Service](https://docs.microsoft.com/azure/app-service/)
- [PostgreSQL](https://docs.microsoft.com/azure/postgresql/)
- [Static Web Apps](https://docs.microsoft.com/azure/static-web-apps/)
- [Azure CLI](https://docs.microsoft.com/cli/azure/)

### Get Help
- GitHub Issues: https://github.com/ismaelloveexcel/Secure-Renewals-2/issues
- Azure Support: https://portal.azure.com/#create/Microsoft.Support

---

## ✅ Final Checklist

### Pre-Deployment
- [ ] Azure subscription ready
- [ ] Azure CLI installed and logged in
- [ ] Repository cloned locally
- [ ] Employee data CSV ready
- [ ] Domain name registered (optional)

### Infrastructure
- [ ] Resource group created
- [ ] PostgreSQL database provisioned
- [ ] App Service created
- [ ] Static Web App created
- [ ] Storage account created
- [ ] Key Vault configured

### Deployment
- [ ] Backend deployed and running
- [ ] Frontend deployed and accessible
- [ ] Database migrations completed
- [ ] Employees imported
- [ ] Environment variables configured
- [ ] Secrets stored in Key Vault

### Security
- [ ] HTTPS enforced
- [ ] Firewall rules configured
- [ ] CORS settings correct
- [ ] Key Vault access configured
- [ ] Backups enabled

### Testing
- [ ] Login works
- [ ] API responds
- [ ] Frontend loads
- [ ] All features tested
- [ ] Load testing passed
- [ ] Security testing passed

### Go-Live
- [ ] Monitoring enabled
- [ ] Alerts configured
- [ ] Training completed
- [ ] Documentation shared
- [ ] Support process established

---

**🎉 Ready to Go Live!**

Estimated setup time: **1 day** (with this guide)  
Monthly cost: **$20-40** (optimized)  
Maintenance: **<2 hours/month**

---

*Last Updated: January 2026*
