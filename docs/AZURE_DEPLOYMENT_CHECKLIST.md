# Azure Deployment Checklist

Use this checklist to track your deployment progress.

## Pre-Deployment

- [ ] Azure account with active subscription
- [ ] Access to Azure Portal or Azure Cloud Shell
- [ ] Repository cloned locally or in Cloud Shell
- [ ] Decided on deployment method:
  - [ ] Option 1: Automated Script
  - [ ] Option 2: GitHub Actions CI/CD
  - [ ] Option 3: Docker Containers

## Configuration

- [ ] Edited `deploy_to_azure.sh` with:
  - [ ] Resource group name
  - [ ] App service plan name
  - [ ] Web app name (globally unique)
  - [ ] Azure region/location
  - [ ] SKU tiers (B1 for dev, P1V2 for prod)

- [ ] Prepared required information:
  - [ ] SMTP server details (for email notifications)
  - [ ] Custom domain (if applicable)
  - [ ] SSL certificate (if using custom domain)

## Deployment Execution

- [ ] Ran deployment script successfully
- [ ] **SAVED** generated database password securely
- [ ] **SAVED** generated auth secret key securely
- [ ] Verified resource group created in Azure Portal
- [ ] Verified PostgreSQL database created
- [ ] Verified App Service created
- [ ] Web app accessible at: `https://[webapp-name].azurewebsites.net`

## Post-Deployment Configuration

### Database Setup
- [ ] SSH into app service
- [ ] Navigated to `/home/site/wwwroot/backend`
- [ ] Ran `alembic upgrade head` successfully
- [ ] Created admin user in database
- [ ] Verified database connectivity

### Application Configuration
- [ ] Configured SMTP settings in Azure App Settings:
  - [ ] SMTP_HOST
  - [ ] SMTP_PORT
  - [ ] SMTP_USER
  - [ ] SMTP_PASSWORD
  - [ ] SMTP_FROM_EMAIL
  - [ ] SMTP_FROM_NAME
  - [ ] APP_BASE_URL

- [ ] Updated ALLOWED_ORIGINS if using custom domain

### Optional: Custom Domain
- [ ] Added custom domain to App Service
- [ ] Updated DNS records
- [ ] Configured SSL certificate
- [ ] Enabled HTTPS-only traffic

### Optional: GitHub Actions CI/CD
- [ ] Downloaded publish profile from Azure
- [ ] Added `AZURE_WEBAPP_PUBLISH_PROFILE` to GitHub Secrets
- [ ] Verified workflow file exists at `.github/workflows/azure-deploy.yml`
- [ ] Triggered test deployment
- [ ] Confirmed successful deployment in Actions tab

### Optional: Monitoring
- [ ] Created Application Insights resource
- [ ] Linked to Web App
- [ ] Configured alerts for:
  - [ ] High CPU usage
  - [ ] High memory usage
  - [ ] HTTP 5xx errors
  - [ ] Slow response times

### Optional: Backup
- [ ] Created storage account for backups
- [ ] Configured automated backup schedule
- [ ] Tested backup restoration

## Verification

### Application Health
- [ ] Accessed web app URL
- [ ] API health endpoint responding: `/api/health`
- [ ] API documentation accessible: `/docs`
- [ ] Frontend loading correctly
- [ ] Login page displayed

### Functionality Testing
- [ ] Admin login works with created credentials
- [ ] First-time password change enforced
- [ ] Employee list accessible (after login)
- [ ] Can create new employee record
- [ ] Can upload documents
- [ ] Email notifications working (if configured)
- [ ] Compliance alerts displaying

### Performance
- [ ] Application loads in < 3 seconds
- [ ] API responses in < 500ms
- [ ] No console errors in browser
- [ ] Database queries performing well

### Security
- [ ] HTTPS enabled (SSL certificate valid)
- [ ] HTTP redirects to HTTPS
- [ ] CORS configured correctly
- [ ] Authentication required for protected endpoints
- [ ] Database firewall rules configured
- [ ] Sensitive data not exposed in logs

## Documentation

- [ ] Updated internal documentation with:
  - [ ] Application URL
  - [ ] Admin credentials (stored securely)
  - [ ] Database connection details
  - [ ] Deployment process notes
  
- [ ] Shared with team:
  - [ ] Application URL
  - [ ] HR User Guide link
  - [ ] Support contact information

## Handover

- [ ] Trained HR team on portal usage
- [ ] Provided access credentials
- [ ] Shared troubleshooting guide
- [ ] Set up support process
- [ ] Documented monitoring procedures
- [ ] Scheduled regular maintenance

## Monitoring & Maintenance

### Daily
- [ ] Check application health
- [ ] Review error logs
- [ ] Monitor user activity

### Weekly
- [ ] Review performance metrics
- [ ] Check backup status
- [ ] Review security alerts

### Monthly
- [ ] Review Azure costs
- [ ] Update dependencies (if needed)
- [ ] Review access logs
- [ ] Database maintenance (vacuum, reindex)

## Rollback Plan

In case of issues:

1. **Application Issues**
   ```bash
   # Redeploy previous version via GitHub
   git revert [commit-hash]
   git push origin main
   ```

2. **Database Issues**
   ```bash
   # Restore from backup
   az postgres server restore \
       --resource-group secure-renewals-rg \
       --name secure-renewals-db-server \
       --restore-point-in-time "2024-01-10T00:00:00Z" \
       --source-server secure-renewals-db-server
   ```

3. **Configuration Issues**
   - Revert App Settings in Azure Portal
   - Restart application

## Support Contacts

| Issue Type | Contact |
|------------|---------|
| Azure Infrastructure | Azure Support Portal |
| Application Bugs | Development Team |
| HR/Business Logic | HR Manager |
| Security Concerns | IT Security Team |

---

## Status

**Deployment Date**: _______________  
**Deployed By**: _______________  
**Environment**: ☐ Development  ☐ Staging  ☐ Production  
**Status**: ☐ In Progress  ☐ Complete  ☐ Issues  

**Notes**:
```
[Add any deployment-specific notes here]
```

---

**Reference Documentation**: [docs/AZURE_DEPLOYMENT_GUIDE.md](AZURE_DEPLOYMENT_GUIDE.md)
