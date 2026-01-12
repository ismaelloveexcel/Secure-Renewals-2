# Using GitHub Actions to Debug Azure Deployments

This guide shows you how to use the new Azure debugging workflow.

## Prerequisites

You need to configure these GitHub Secrets (one-time setup):

1. Go to: **Repository** → **Settings** → **Secrets and variables** → **Actions**
2. Add these secrets:

| Secret Name | Description | How to Get |
|------------|-------------|------------|
| `AZURE_CREDENTIALS` | Service principal JSON | Run: `az ad sp create-for-rbac --name "github-actions" --role contributor --scopes /subscriptions/{sub-id}/resourceGroups/{rg} --sdk-auth` |
| `AZURE_WEBAPP_NAME` | Your Azure App Service name | Example: `secure-renewals-app` |
| `AZURE_RESOURCE_GROUP` | Your Azure resource group | Example: `secure-renewals-rg` |
| `AZURE_SUBSCRIPTION_ID` | Your Azure subscription ID | Run: `az account show --query id -o tsv` |

## Using the Azure Debug Workflow

### Step 1: Navigate to Actions

1. Go to your repository on GitHub
2. Click the **Actions** tab
3. Find **Azure Debug & Diagnostics** in the left sidebar

### Step 2: Run Workflow with Debug Action

Click **Run workflow**, then select one of these actions:

#### Option 1: Check Status
**What it does:** Shows app status, configuration, runtime settings

**Use when:** 
- You want to verify app is running
- Need to check environment variables
- Want to see app configuration

**Output:**
- App name, state, location
- Application settings (non-sensitive)
- Python version and runtime config

#### Option 2: View Logs
**What it does:** Downloads and displays application logs

**Use when:**
- App is returning errors
- Need to debug runtime issues
- Want to see recent activity

**Output:**
- Last 100 lines from each log file
- Live log stream
- Error messages and exceptions

#### Option 3: Restart App
**What it does:** Restarts the Azure App Service

**Use when:**
- App is stuck or unresponsive
- After configuration changes
- Need to apply new environment variables

**Output:**
- Status before restart
- Status after restart
- Health check results

#### Option 4: Run Diagnostics
**What it does:** Comprehensive diagnostic scan

**Use when:**
- Full troubleshooting needed
- Investigating performance issues
- Need complete app overview

**Output:**
- Deployment history
- Network configuration
- App Service Plan details
- SSL/TLS certificates
- Database connectivity check
- Recent errors

#### Option 5: Test Connection
**What it does:** Tests connectivity to your app

**Use when:**
- App is not responding
- Need to verify endpoints
- Testing SSL certificates

**Output:**
- HTTP status codes for all endpoints
- DNS resolution
- SSL certificate validity

#### Option 6: SSH Session (Interactive)
**What it does:** Opens an interactive SSH session via browser

**Use when:**
- Need to run custom commands
- Manual debugging required
- Testing database connections

**How it works:**
1. Workflow starts and shows SSH/Web URL
2. Connect via SSH or web browser
3. Run Azure CLI commands interactively
4. Session lasts 30 minutes

**Example commands to run:**
```bash
# Login to Azure
az login

# View live logs
az webapp log tail --name <app-name> --resource-group <rg>

# SSH into the app
az webapp ssh --name <app-name> --resource-group <rg>

# Run migrations
az webapp ssh --name <app-name> --resource-group <rg> \
  --command "cd /home/site/wwwroot && alembic upgrade head"
```

### Step 3: View Results

1. Click on the running workflow
2. Click on the job name
3. Expand the step you're interested in
4. View the output

### Step 4: Download Logs (Optional)

If logs were collected, they're available as artifacts:

1. Scroll to bottom of workflow run
2. Find **Artifacts** section
3. Download `azure-debug-logs-<run-number>`

## Common Scenarios

### Scenario 1: App Returns 500 Error

**Steps:**
1. Run workflow → Select "view-logs"
2. Look for Python exceptions or errors
3. Run workflow → Select "run-diagnostics"
4. Check database connectivity
5. If needed, run "ssh-session" to investigate further

### Scenario 2: App Won't Start After Deployment

**Steps:**
1. Run workflow → Select "check-status"
2. Verify environment variables are set
3. Run workflow → Select "view-logs"
4. Look for startup errors
5. Fix issues and restart with "restart-app"

### Scenario 3: Database Connection Issues

**Steps:**
1. Run workflow → Select "run-diagnostics"
2. Check if DATABASE_URL is configured
3. Run workflow → Select "ssh-session"
4. Test database connection manually:
   ```bash
   az webapp ssh --name <app-name> --resource-group <rg>
   # Inside container:
   python -c "import psycopg2; conn = psycopg2.connect('your-db-url'); print('OK')"
   ```

### Scenario 4: Need to Run Database Migration

**Steps:**
1. Run workflow → Select "ssh-session"
2. Wait for SSH connection details
3. Connect and run:
   ```bash
   az webapp ssh --name <app-name> --resource-group <rg>
   # Inside container:
   cd /home/site/wwwroot
   alembic upgrade head
   ```

## Alternative: Direct Azure Portal SSH

If you prefer not to use GitHub Actions:

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to your App Service
3. Click **SSH** in the left menu
4. Click **Go** to open web SSH
5. Run commands directly in the container

## Troubleshooting the Debug Workflow

### Issue: "AZURE_CREDENTIALS not found"

**Solution:** Add Azure credentials to GitHub Secrets (see Prerequisites above)

### Issue: "Workflow failed to authenticate"

**Solution:** 
1. Verify your service principal has correct permissions
2. Regenerate credentials:
   ```bash
   az ad sp create-for-rbac --name "github-actions" --role contributor \
     --scopes /subscriptions/{sub-id}/resourceGroups/{rg} --sdk-auth
   ```
3. Update GitHub Secret with new JSON

### Issue: "Cannot find app or resource group"

**Solution:** 
1. Verify `AZURE_WEBAPP_NAME` and `AZURE_RESOURCE_GROUP` secrets
2. Check spelling and case sensitivity
3. Verify app exists: `az webapp show --name <name> --resource-group <rg>`

## Benefits Over Manual Debugging

| Manual Method | With GitHub Actions |
|---------------|---------------------|
| Install Azure CLI locally | ✅ Pre-installed in workflow |
| Remember complex commands | ✅ Pre-scripted actions |
| Login each time | ✅ Automatic authentication |
| Copy/paste credentials | ✅ Secure secrets |
| Terminal only | ✅ Web-based results |
| No log retention | ✅ 7-day artifact storage |

## Next Steps

- See [Full Azure Debugging Guide](AZURE_DEBUGGING_GUIDE.md) for more methods
- Check [Quick Reference](AZURE_DEBUGGING_QUICK_REFERENCE.md) for common commands
- Review [Deployment Alternatives](DEPLOYMENT_ALTERNATIVES_GUIDE.md) for other options

---

**Questions?** Open an issue or check the main [README](../README.md) for more help.
