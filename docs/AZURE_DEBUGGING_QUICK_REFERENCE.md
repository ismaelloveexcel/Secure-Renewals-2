# Azure Debugging Quick Reference

**Quick answer:** Yes! Multiple GitHub agents/runners available for Azure debugging.

---

## 🚀 Fastest Options (< 5 minutes)

### Option 1: GitHub Actions Workflow (Recommended)
**No setup required if you have Azure credentials!**

1. Go to: **Actions** → **Azure Debug & Diagnostics**
2. Click **Run workflow**
3. Select action:
   - `check-status` - View app status and config
   - `view-logs` - Download and view logs
   - `restart-app` - Restart the app
   - `run-diagnostics` - Full diagnostic scan
   - `test-connection` - Test connectivity
   - `ssh-session` - Interactive SSH session (30 min)
4. View results

**Setup Required Secrets:**
- `AZURE_CREDENTIALS` - Service principal JSON
- `AZURE_WEBAPP_NAME` - Your app name
- `AZURE_RESOURCE_GROUP` - Resource group name

[Full Guide →](AZURE_DEBUGGING_GUIDE.md#option-1-github-actions-with-azure-cli-automated)

### Option 2: Azure Portal SSH
**Instant access, zero setup!**

1. Go to Azure Portal
2. Navigate to your App Service
3. Click **SSH** in left menu
4. Click **Go**

[Full Guide →](AZURE_DEBUGGING_GUIDE.md#option-4-azure-app-service-ssh-access)

---

## 🔧 Common Debug Commands

### View Logs
```bash
# In GitHub Actions workflow
az webapp log tail --name <app-name> --resource-group <rg>

# Download logs
az webapp log download --name <app-name> --resource-group <rg> --log-file logs.zip
```

### Check App Status
```bash
az webapp show --name <app-name> --resource-group <rg> --query "{name:name, state:state}"
```

### Restart App
```bash
az webapp restart --name <app-name> --resource-group <rg>
```

### SSH to App
```bash
az webapp ssh --name <app-name> --resource-group <rg>
```

### Run Migration in App
```bash
az webapp ssh --name <app-name> --resource-group <rg> \
  --command "cd /home/site/wwwroot && alembic upgrade head"
```

---

## 🐛 Troubleshooting Scenarios

### App Returns 500 Error
```yaml
# Use workflow: azure-debug.yml
# Select: run-diagnostics
# Then: view-logs
```

Look for:
- Python exceptions
- Missing environment variables
- Database connection errors

### Database Connection Fails
```bash
# Check if DATABASE_URL is set
az webapp config appsettings list --name <app-name> --resource-group <rg> | grep DATABASE_URL

# Test from app container
az webapp ssh --name <app-name> --resource-group <rg> --command "env | grep DATABASE"
```

### Static Files Not Loading
```bash
# SSH into app
az webapp ssh --name <app-name> --resource-group <rg>

# Check static files exist
ls -la /home/site/wwwroot/static

# Check nginx config
cat /etc/nginx/sites-enabled/default | grep static
```

---

## 📚 Complete Documentation

- **[Full Azure Debugging Guide](AZURE_DEBUGGING_GUIDE.md)** - All methods with examples
- **[Deployment Guide](DEPLOYMENT_ALTERNATIVES_GUIDE.md)** - Other deployment options
- **[Main README](../README.md#-deployment)** - Project overview

---

## 🔐 Setup Service Principal (One-Time)

```bash
# Login
az login

# Create service principal
az ad sp create-for-rbac \
  --name "github-actions-secure-renewals" \
  --role contributor \
  --scopes /subscriptions/{subscription-id}/resourceGroups/{resource-group} \
  --sdk-auth
```

Copy the JSON output to GitHub Secrets as `AZURE_CREDENTIALS`.

---

## 🎯 Which Option Should I Use?

| Scenario | Recommended Option |
|----------|-------------------|
| Quick status check | GitHub Actions → check-status |
| View recent errors | GitHub Actions → view-logs |
| Restart crashed app | GitHub Actions → restart-app |
| Interactive debugging | GitHub Actions → ssh-session |
| Direct file access | Azure Portal SSH |
| Run migrations | Azure Portal SSH or GitHub Actions |
| Production monitoring | Self-hosted runner on Azure VM |

---

**Need help?** See the [Full Debugging Guide](AZURE_DEBUGGING_GUIDE.md) for detailed instructions.
