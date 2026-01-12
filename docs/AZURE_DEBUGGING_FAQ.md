# Azure Debugging with GitHub - FAQ

**Common questions about using GitHub agents/runners to debug Azure deployments**

---

## General Questions

### Q: Is there any agent available on GitHub that I can connect to Azure to debug my app deployment?

**A: Yes! Multiple options are available:**

1. **GitHub Actions Workflow** (⭐ Easiest)
   - Pre-built workflow: `.github/workflows/azure-debug.yml`
   - No installation needed
   - 6 debug actions: check-status, view-logs, restart-app, run-diagnostics, test-connection, ssh-session
   - [How to use →](USING_AZURE_DEBUG_WORKFLOW.md)

2. **Self-Hosted GitHub Runner on Azure VM** (⭐ Most Powerful)
   - Persistent GitHub Actions runner on Azure
   - Direct access to Azure resources
   - Full debugging capabilities
   - [Setup guide →](AZURE_SELF_HOSTED_RUNNER_SETUP.md)

3. **GitHub Codespaces** (⭐ Cloud-based)
   - Azure CLI pre-installed
   - Run debug commands from browser
   - 60 hours/month free

4. **Azure Portal SSH** (⭐ Quick Access)
   - Instant SSH to app container
   - No GitHub setup needed
   - Direct file access

**Quick Start:** Go to **Actions** → **Azure Debug & Diagnostics** → **Run workflow**

---

## Setup Questions

### Q: What do I need to configure before using the Azure debug workflow?

**A: Four GitHub Secrets:**

1. `AZURE_CREDENTIALS` - Service principal (JSON)
2. `AZURE_WEBAPP_NAME` - Your app name
3. `AZURE_RESOURCE_GROUP` - Resource group
4. `AZURE_SUBSCRIPTION_ID` - Subscription ID

**How to get AZURE_CREDENTIALS:**
```bash
az ad sp create-for-rbac \
  --name "github-actions" \
  --role contributor \
  --scopes /subscriptions/{sub-id}/resourceGroups/{rg} \
  --sdk-auth
```

Copy the JSON output to GitHub Secrets.

### Q: How do I add secrets to GitHub?

**A: Steps:**
1. Go to repository on GitHub
2. Click **Settings** tab
3. Click **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Add name and value
6. Click **Add secret**

### Q: Do I need to install anything locally?

**A: No!** The GitHub Actions workflow runs in the cloud. Everything is pre-installed.

For self-hosted runners, you need to set up an Azure VM once (one-time setup).

---

## Workflow Questions

### Q: How do I view my app logs?

**A: Two methods:**

**Method 1: GitHub Actions** (Recommended)
1. Go to **Actions** → **Azure Debug & Diagnostics**
2. Click **Run workflow**
3. Select action: **view-logs**
4. Click **Run workflow**
5. View logs in workflow output

**Method 2: Azure Portal**
1. Go to Azure Portal → Your App Service
2. Click **SSH** → **Go**
3. Run: `cat /home/LogFiles/application.log`

### Q: How do I restart my app?

**A: GitHub Actions method:**
1. Go to **Actions** → **Azure Debug & Diagnostics**
2. Select action: **restart-app**
3. Workflow will:
   - Show current status
   - Restart the app
   - Wait 30 seconds
   - Show new status
   - Test health endpoint

### Q: Can I run custom commands on my Azure app?

**A: Yes! Use SSH session:**

1. Go to **Actions** → **Azure Debug & Diagnostics**
2. Select action: **ssh-session**
3. Wait for connection details (shows SSH URL)
4. Connect via SSH or web browser
5. Run Azure CLI commands:
   ```bash
   # View logs
   az webapp log tail --name <app> --resource-group <rg>
   
   # SSH into app
   az webapp ssh --name <app> --resource-group <rg>
   
   # Run migrations
   az webapp ssh --name <app> --resource-group <rg> \
     --command "cd /home/site/wwwroot && alembic upgrade head"
   ```

Session lasts 30 minutes.

---

## Troubleshooting Questions

### Q: My app returns 500 error. How do I debug?

**A: Follow this sequence:**

1. **Check logs** (view-logs action)
   - Look for Python exceptions
   - Check for "ModuleNotFoundError"
   - Look for database errors

2. **Run diagnostics** (run-diagnostics action)
   - Check if DATABASE_URL is set
   - Verify deployment status
   - Check app metrics

3. **SSH session** (ssh-session action)
   - Connect interactively
   - Test database connection
   - Check file permissions
   - View environment variables

### Q: Database connection fails. What should I check?

**A: Checklist:**

1. **Verify DATABASE_URL is set:**
   ```bash
   # In workflow
   az webapp config appsettings list \
     --name <app> --resource-group <rg> | grep DATABASE_URL
   ```

2. **Check firewall rules:**
   ```bash
   az postgres server firewall-rule list \
     --resource-group <rg> --server-name <server>
   ```

3. **Allow Azure services:**
   ```bash
   az postgres server firewall-rule create \
     --resource-group <rg> \
     --server-name <server> \
     --name AllowAllAzureIPs \
     --start-ip-address 0.0.0.0 \
     --end-ip-address 0.0.0.0
   ```

4. **Test connection from app:**
   ```bash
   az webapp ssh --name <app> --resource-group <rg> \
     --command "python -c 'import psycopg2; conn = psycopg2.connect(\"<url>\"); print(\"OK\")'"
   ```

### Q: My static files (CSS/JS) aren't loading. How do I fix this?

**A: Debug steps:**

1. **Check if files exist:**
   ```bash
   az webapp ssh --name <app> --resource-group <rg> \
     --command "ls -la /home/site/wwwroot/static"
   ```

2. **Check app configuration:**
   ```bash
   az webapp config appsettings list \
     --name <app> --resource-group <rg> \
     --query "[?name=='STATIC_ROOT']"
   ```

3. **Verify nginx/gunicorn config:**
   - SSH to app
   - Check `/etc/nginx/sites-enabled/default`
   - Look for static file serving rules

### Q: Workflow says "AZURE_CREDENTIALS not found". What does this mean?

**A: GitHub Secret not configured.**

1. Generate credentials:
   ```bash
   az ad sp create-for-rbac --name "github-actions" \
     --role contributor \
     --scopes /subscriptions/{sub-id}/resourceGroups/{rg} \
     --sdk-auth
   ```

2. Copy the entire JSON output

3. Add to GitHub:
   - Go to **Settings** → **Secrets and variables** → **Actions**
   - Click **New repository secret**
   - Name: `AZURE_CREDENTIALS`
   - Value: Paste JSON
   - Click **Add secret**

### Q: Authentication fails even with correct credentials. Why?

**A: Possible causes:**

1. **Service principal expired** - Regenerate credentials
2. **Insufficient permissions** - Grant "Contributor" role
3. **Wrong subscription** - Verify subscription ID
4. **JSON formatting** - Ensure no extra spaces in secret

**Solution:**
```bash
# Delete old service principal
az ad sp delete --id <app-id>

# Create new one
az ad sp create-for-rbac --name "github-actions-new" \
  --role contributor \
  --scopes /subscriptions/{sub-id}/resourceGroups/{rg} \
  --sdk-auth

# Update GitHub Secret with new JSON
```

---

## Self-Hosted Runner Questions

### Q: Why would I want a self-hosted runner on Azure?

**A: Benefits:**
- ✅ Direct network access (private VNets)
- ✅ No egress charges (same region)
- ✅ Faster deployments (lower latency)
- ✅ Persistent environment
- ✅ Pre-configured tools
- ✅ Can access private Azure resources

**Use when:**
- Need to access private Azure resources
- Running frequent deployments
- Need custom tools installed
- Have security requirements

### Q: How much does a self-hosted runner cost?

**A: VM costs only:**

| VM Size | Cost/Month | Use Case |
|---------|------------|----------|
| B2s (2 vCPU, 4GB) | ~$30 | **Recommended** |
| B2ms (2 vCPU, 8GB) | ~$60 | Heavy builds |
| B4ms (4 vCPU, 16GB) | ~$120 | Multiple jobs |

**Save 60% with auto-shutdown** (off at night/weekends):
```bash
az vm auto-shutdown --resource-group <rg> --name <vm> --time 1900
```

### Q: How long does it take to set up a self-hosted runner?

**A: About 30 minutes:**
- 5 min - Create Azure VM
- 10 min - Install dependencies
- 5 min - Install GitHub runner
- 5 min - Configure Azure authentication
- 5 min - Test

[Full setup guide →](AZURE_SELF_HOSTED_RUNNER_SETUP.md)

---

## Comparison Questions

### Q: Should I use GitHub Actions workflow or self-hosted runner?

**A: Comparison:**

| Feature | GitHub Actions | Self-Hosted Runner |
|---------|----------------|-------------------|
| **Setup time** | None (ready now) | 30 minutes |
| **Cost** | Free | ~$30/month |
| **Speed** | Moderate | Fast (same region) |
| **Access** | Public Azure only | Public + private |
| **Maintenance** | None | Occasional updates |
| **Best for** | Quick debugging | Production pipelines |

**Recommendation:**
- Start with **GitHub Actions workflow**
- Upgrade to **self-hosted runner** if you need:
  - Private network access
  - Faster deployments
  - Persistent environment

### Q: What's the difference between ssh-session action and Azure Portal SSH?

**A: Comparison:**

| Method | Where | Authentication | Use Case |
|--------|-------|----------------|----------|
| **ssh-session (GitHub)** | GitHub Actions | Service principal | Automated debugging, CI/CD |
| **Azure Portal SSH** | Azure Portal | Portal login | Quick manual checks |

Both give you shell access to run commands.

**ssh-session advantages:**
- Scriptable/automatable
- Can be triggered by workflow
- Logs saved as artifacts

**Azure Portal SSH advantages:**
- Instant (no workflow run)
- No GitHub secrets needed
- Familiar portal interface

---

## Advanced Questions

### Q: Can I debug multiple apps/environments?

**A: Yes! Use environment-specific secrets:**

1. Create secrets for each environment:
   - `AZURE_CREDENTIALS_DEV`
   - `AZURE_CREDENTIALS_STAGING`
   - `AZURE_CREDENTIALS_PROD`

2. Update workflow with input parameter:
   ```yaml
   on:
     workflow_dispatch:
       inputs:
         environment:
           type: choice
           options: [dev, staging, prod]
   ```

3. Use conditional secrets:
   ```yaml
   - name: Azure Login
     uses: azure/login@v1
     with:
       creds: ${{ secrets[format('AZURE_CREDENTIALS_{0}', github.event.inputs.environment)] }}
   ```

### Q: Can I schedule automatic health checks?

**A: Yes! Use scheduled workflows:**

```yaml
name: Daily Health Check

on:
  schedule:
    - cron: '0 */4 * * *'  # Every 4 hours

jobs:
  health-check:
    runs-on: ubuntu-latest
    steps:
      - uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}
      
      - name: Check App Health
        run: |
          STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://${{ secrets.AZURE_WEBAPP_NAME }}.azurewebsites.net/api/health)
          if [ $STATUS -ne 200 ]; then
            echo "Health check failed: $STATUS"
            exit 1
          fi
```

### Q: Can I get notified when debugging finds issues?

**A: Yes! Add notification steps:**

**Slack notification:**
```yaml
- name: Notify Slack on Failure
  if: failure()
  uses: slackapi/slack-github-action@v1
  with:
    payload: |
      {
        "text": "Azure app health check failed!"
      }
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

**Email notification:**
```yaml
- name: Send Email on Failure
  if: failure()
  uses: dawidd6/action-send-mail@v3
  with:
    server_address: smtp.gmail.com
    server_port: 465
    username: ${{ secrets.EMAIL_USERNAME }}
    password: ${{ secrets.EMAIL_PASSWORD }}
    subject: Azure Deployment Issue
    body: Check failed - see logs
    to: admin@example.com
```

---

## Security Questions

### Q: Is it safe to store Azure credentials in GitHub Secrets?

**A: Yes! GitHub Secrets are:**
- Encrypted at rest
- Not visible in logs
- Only accessible to workflows
- Can be scoped to environments
- Support approval workflows

**Best practices:**
1. Use service principals (not your personal account)
2. Grant minimum required permissions
3. Use environment protection rules
4. Rotate credentials regularly
5. Enable audit logging

### Q: What permissions does the service principal need?

**A: Minimum required:**

**For debugging only:**
- Reader role on App Service
- Log Reader role

**For deployment:**
- Contributor role on Resource Group

**For full automation:**
- Contributor role on Subscription

**Grant minimal permissions:**
```bash
# Reader only (debug only)
az role assignment create \
  --assignee <sp-id> \
  --role Reader \
  --scope /subscriptions/{sub}/resourceGroups/{rg}

# Contributor (deploy + debug)
az role assignment create \
  --assignee <sp-id> \
  --role Contributor \
  --scope /subscriptions/{sub}/resourceGroups/{rg}
```

---

## More Questions?

- **Full Guide:** [Azure Debugging Guide](AZURE_DEBUGGING_GUIDE.md)
- **Quick Start:** [Using Azure Debug Workflow](USING_AZURE_DEBUG_WORKFLOW.md)
- **Self-Hosted Setup:** [Self-Hosted Runner Setup](AZURE_SELF_HOSTED_RUNNER_SETUP.md)
- **Quick Reference:** [Azure Debugging Quick Reference](AZURE_DEBUGGING_QUICK_REFERENCE.md)

**Still have questions?** Open an issue on GitHub!
