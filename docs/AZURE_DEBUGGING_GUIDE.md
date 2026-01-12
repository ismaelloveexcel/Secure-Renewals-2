# Azure Debugging Guide for GitHub Actions

**For:** Secure Renewals HR Portal  
**Purpose:** Debug Azure App Service deployments using GitHub Actions and Azure tools  
**Last Updated:** January 2025

---

## 🎯 Quick Answer: Yes, Multiple Options Available!

GitHub provides several ways to connect to Azure for debugging app deployment:

1. **GitHub Actions with Azure CLI** - Run commands directly from workflows
2. **GitHub Actions with SSH/Debug Access** - Interactive debugging during workflow runs
3. **Self-Hosted Runners on Azure** - Run GitHub Actions directly on your Azure VMs
4. **Azure App Service SSH** - Direct SSH access to your deployed app
5. **GitHub Codespaces** - Cloud development environment with Azure CLI pre-installed

---

## 📋 Table of Contents

- [Option 1: GitHub Actions with Azure CLI (Automated)](#option-1-github-actions-with-azure-cli-automated)
- [Option 2: GitHub Actions Debug Session (Interactive)](#option-2-github-actions-debug-session-interactive)
- [Option 3: Self-Hosted Runner on Azure VM](#option-3-self-hosted-runner-on-azure-vm)
- [Option 4: Azure App Service SSH Access](#option-4-azure-app-service-ssh-access)
- [Option 5: GitHub Codespaces with Azure CLI](#option-5-github-codespaces-with-azure-cli)
- [Troubleshooting Common Issues](#troubleshooting-common-issues)

---

## Option 1: GitHub Actions with Azure CLI (Automated)

**Best for:** Automated debugging commands, log retrieval, status checks

### Prerequisites

- Azure subscription
- Azure credentials configured in GitHub repository secrets

### Setup Azure Credentials

1. **Create Azure Service Principal:**

```bash
# Login to Azure
az login

# Create service principal with contributor role
az ad sp create-for-rbac \
  --name "github-actions-secure-renewals" \
  --role contributor \
  --scopes /subscriptions/{subscription-id}/resourceGroups/{resource-group} \
  --sdk-auth
```

2. **Add to GitHub Secrets:**
   - Go to: Repository → Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `AZURE_CREDENTIALS`
   - Value: Paste the JSON output from above

### Create Debug Workflow

Create `.github/workflows/azure-debug.yml`:

```yaml
name: Azure Debug & Diagnostics

on:
  workflow_dispatch:
    inputs:
      debug_action:
        description: 'Debug action to perform'
        required: true
        type: choice
        options:
          - 'check-status'
          - 'view-logs'
          - 'restart-app'
          - 'run-diagnostics'
          - 'ssh-session'

jobs:
  azure-debug:
    name: Debug Azure Deployment
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4
      
      - name: Azure Login
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}
      
      - name: Check App Status
        if: github.event.inputs.debug_action == 'check-status'
        run: |
          echo "=== Azure App Service Status ==="
          az webapp show \
            --name ${{ secrets.AZURE_WEBAPP_NAME }} \
            --resource-group ${{ secrets.AZURE_RESOURCE_GROUP }} \
            --query "{name:name, state:state, hostNames:hostNames, outboundIpAddresses:outboundIpAddresses}" \
            --output table
          
          echo ""
          echo "=== Application Settings ==="
          az webapp config appsettings list \
            --name ${{ secrets.AZURE_WEBAPP_NAME }} \
            --resource-group ${{ secrets.AZURE_RESOURCE_GROUP }} \
            --output table
      
      - name: View Application Logs
        if: github.event.inputs.debug_action == 'view-logs'
        run: |
          echo "=== Downloading Latest Logs ==="
          az webapp log download \
            --name ${{ secrets.AZURE_WEBAPP_NAME }} \
            --resource-group ${{ secrets.AZURE_RESOURCE_GROUP }} \
            --log-file app-logs.zip
          
          echo ""
          echo "=== Extracting and Displaying Logs ==="
          unzip -q app-logs.zip
          find . -name "*.log" -type f -exec echo "=== {} ===" \; -exec tail -50 {} \;
      
      - name: Restart Application
        if: github.event.inputs.debug_action == 'restart-app'
        run: |
          echo "=== Restarting Azure App Service ==="
          az webapp restart \
            --name ${{ secrets.AZURE_WEBAPP_NAME }} \
            --resource-group ${{ secrets.AZURE_RESOURCE_GROUP }}
          
          echo "Waiting 30 seconds for app to start..."
          sleep 30
          
          echo "=== Checking New Status ==="
          az webapp show \
            --name ${{ secrets.AZURE_WEBAPP_NAME }} \
            --resource-group ${{ secrets.AZURE_RESOURCE_GROUP }} \
            --query "{name:name, state:state}" \
            --output table
      
      - name: Run Diagnostics
        if: github.event.inputs.debug_action == 'run-diagnostics'
        run: |
          echo "=== Running Azure Diagnostics ==="
          
          echo "1. Check deployment status:"
          az webapp deployment list-publishing-profiles \
            --name ${{ secrets.AZURE_WEBAPP_NAME }} \
            --resource-group ${{ secrets.AZURE_RESOURCE_GROUP }}
          
          echo ""
          echo "2. Check deployment history:"
          az webapp deployment list \
            --name ${{ secrets.AZURE_WEBAPP_NAME }} \
            --resource-group ${{ secrets.AZURE_RESOURCE_GROUP }}
          
          echo ""
          echo "3. Check app metrics:"
          az monitor metrics list \
            --resource /subscriptions/${{ secrets.AZURE_SUBSCRIPTION_ID }}/resourceGroups/${{ secrets.AZURE_RESOURCE_GROUP }}/providers/Microsoft.Web/sites/${{ secrets.AZURE_WEBAPP_NAME }} \
            --metric "Requests" "Http5xx" "ResponseTime" \
            --start-time $(date -u -d '1 hour ago' '+%Y-%m-%dT%H:%M:%SZ') \
            --end-time $(date -u '+%Y-%m-%dT%H:%M:%SZ')
      
      - name: Setup SSH Debug Session
        if: github.event.inputs.debug_action == 'ssh-session'
        uses: mxschmitt/action-tmate@v3
        with:
          limit-access-to-actor: true
        timeout-minutes: 30

      - name: Upload Logs as Artifact
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: azure-debug-logs
          path: |
            *.log
            *.zip
          retention-days: 7
```

### Usage

1. Go to: Repository → Actions → Azure Debug & Diagnostics
2. Click "Run workflow"
3. Select debug action (check-status, view-logs, restart-app, etc.)
4. Click "Run workflow"
5. View results in the workflow logs

---

## Option 2: GitHub Actions Debug Session (Interactive)

**Best for:** Interactive troubleshooting, running custom commands, real-time debugging

### Using tmate for SSH Access

The workflow above includes SSH access via `action-tmate`. When you select "ssh-session":

1. **Trigger the workflow** with "ssh-session" option
2. **Wait for the tmate step** - it will show connection details:
   ```
   SSH: ssh <session-id>@<tmate-server>
   Web: https://tmate.io/t/<session-id>
   ```
3. **Connect via SSH or Web:**
   - **SSH:** `ssh <session-id>@<tmate-server>`
   - **Web:** Open the URL in your browser for web-based terminal
4. **Run commands interactively:**
   ```bash
   # Login to Azure
   az login --service-principal -u $ARM_CLIENT_ID -p $ARM_CLIENT_SECRET --tenant $ARM_TENANT_ID
   
   # Check app status
   az webapp show --name <app-name> --resource-group <rg> --output table
   
   # View live logs
   az webapp log tail --name <app-name> --resource-group <rg>
   
   # SSH into the app
   az webapp ssh --name <app-name> --resource-group <rg>
   
   # Run database migrations
   az webapp ssh --name <app-name> --resource-group <rg> --command "cd /home/site/wwwroot && alembic upgrade head"
   ```
5. **Session timeout:** 30 minutes (configurable)

### Alternative: GitHub Actions Debug Mode

Add this step to any workflow for debugging:

```yaml
- name: Setup Debug Session
  if: ${{ failure() }}  # Only on failure
  uses: mxschmitt/action-tmate@v3
  with:
    limit-access-to-actor: true
  timeout-minutes: 15
```

---

## Option 3: Self-Hosted Runner on Azure VM

**Best for:** Direct access to Azure resources, reduced latency, persistent debugging environment

### Setup Self-Hosted Runner on Azure VM

#### 1. Create Azure VM

```bash
# Create resource group (if not exists)
az group create --name secure-renewals-runners --location eastus

# Create VM for GitHub runner
az vm create \
  --resource-group secure-renewals-runners \
  --name github-runner-vm \
  --image Ubuntu2204 \
  --size Standard_B2s \
  --admin-username azureuser \
  --generate-ssh-keys \
  --public-ip-sku Standard

# Get public IP
az vm list-ip-addresses --resource-group secure-renewals-runners --name github-runner-vm --output table
```

#### 2. Connect to VM

```bash
# SSH to the VM
ssh azureuser@<public-ip>
```

#### 3. Install GitHub Actions Runner

```bash
# Create a folder
mkdir actions-runner && cd actions-runner

# Download the latest runner package
curl -o actions-runner-linux-x64-2.311.0.tar.gz -L https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-linux-x64-2.311.0.tar.gz

# Extract the installer
tar xzf ./actions-runner-linux-x64-2.311.0.tar.gz

# Configure the runner (you'll need a token from GitHub)
# Get token from: Repository → Settings → Actions → Runners → New self-hosted runner
./config.sh --url https://github.com/ismaelloveexcel/Secure-Renewals-2 --token <YOUR-TOKEN>

# Install as a service
sudo ./svc.sh install
sudo ./svc.sh start
```

#### 4. Install Azure CLI on the Runner

```bash
# Install Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Verify installation
az --version

# Login (use service principal for automation)
az login --service-principal -u <app-id> -p <password> --tenant <tenant-id>
```

#### 5. Update Workflows to Use Self-Hosted Runner

Modify your deployment workflow:

```yaml
jobs:
  deploy:
    runs-on: self-hosted  # Instead of ubuntu-latest
    steps:
      # Your deployment steps
      - name: Deploy to Azure
        run: |
          az webapp up --name ${{ secrets.AZURE_WEBAPP_NAME }} \
            --resource-group ${{ secrets.AZURE_RESOURCE_GROUP }}
```

### Benefits of Self-Hosted Runner on Azure

- ✅ **Direct network access** to Azure resources
- ✅ **No egress charges** (VM to Azure services is free within same region)
- ✅ **Pre-configured environment** with Azure CLI
- ✅ **Faster deployments** (reduced latency)
- ✅ **Persistent storage** for caching

---

## Option 4: Azure App Service SSH Access

**Best for:** Direct debugging of deployed application, viewing live logs, running commands in app container

### Enable SSH on Azure App Service

#### 1. Verify SSH is Enabled

```bash
az webapp show \
  --name <app-name> \
  --resource-group <resource-group> \
  --query "siteConfig.linuxFxVersion"
```

#### 2. Open SSH Session

**Method A: Azure Portal**
1. Go to Azure Portal → App Services → Your App
2. Click "SSH" in the left menu
3. Click "Go" to open web-based SSH

**Method B: Azure CLI**
```bash
# SSH directly from command line
az webapp ssh \
  --name <app-name> \
  --resource-group <resource-group>
```

**Method C: From GitHub Actions Workflow**
```yaml
- name: SSH to Azure App
  run: |
    az webapp ssh \
      --name ${{ secrets.AZURE_WEBAPP_NAME }} \
      --resource-group ${{ secrets.AZURE_RESOURCE_GROUP }} \
      --command "ls -la /home/site/wwwroot && cat /home/LogFiles/application.log"
```

#### 3. Common Debug Commands

```bash
# Check application files
ls -la /home/site/wwwroot

# View application logs
cat /home/LogFiles/application.log
tail -f /home/LogFiles/application.log

# Check Python version
python --version

# Check installed packages
pip list

# Run database migrations
cd /home/site/wwwroot
alembic upgrade head

# Test API endpoint
curl http://localhost:8000/api/health

# Check environment variables
env | grep -i database
env | grep -i auth

# Restart application
touch /home/site/wwwroot/restart.txt
```

---

## Option 5: GitHub Codespaces with Azure CLI

**Best for:** Cloud-based development and debugging without local setup

### Setup

1. **Create Codespace:**
   - Go to repository on GitHub
   - Click "Code" → "Codespaces" → "Create codespace on main"

2. **Azure CLI is Pre-installed** in Codespaces

3. **Login to Azure:**
   ```bash
   # Interactive login
   az login
   
   # Or use service principal
   az login --service-principal \
     -u <app-id> \
     -p <password> \
     --tenant <tenant-id>
   ```

4. **Debug from Codespaces:**
   ```bash
   # Check app status
   az webapp show --name <app-name> --resource-group <rg>
   
   # View logs
   az webapp log tail --name <app-name> --resource-group <rg>
   
   # Deploy directly
   cd backend
   az webapp up --name <app-name> --resource-group <rg>
   ```

### Configure Codespace Secrets

Add Azure credentials to Codespace secrets:
1. Go to GitHub Settings → Codespaces
2. Add secrets: `AZURE_SUBSCRIPTION_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`, `AZURE_TENANT_ID`

---

## Troubleshooting Common Issues

### Issue 1: Deployment Succeeds but App Returns 500 Error

**Debug Steps:**

```yaml
- name: Debug 500 Error
  run: |
    # 1. Check application logs
    az webapp log tail --name ${{ secrets.AZURE_WEBAPP_NAME }} --resource-group ${{ secrets.AZURE_RESOURCE_GROUP }}
    
    # 2. Check environment variables
    az webapp config appsettings list --name ${{ secrets.AZURE_WEBAPP_NAME }} --resource-group ${{ secrets.AZURE_RESOURCE_GROUP }}
    
    # 3. Verify startup command
    az webapp config show --name ${{ secrets.AZURE_WEBAPP_NAME }} --resource-group ${{ secrets.AZURE_RESOURCE_GROUP }} --query "appCommandLine"
    
    # 4. Check if app is running
    curl -I https://${{ secrets.AZURE_WEBAPP_NAME }}.azurewebsites.net
```

### Issue 2: Database Connection Fails

**Debug Steps:**

```bash
# Test database connectivity from Azure
az webapp ssh --name <app-name> --resource-group <rg> --command "
  python -c 'import psycopg2; 
  conn = psycopg2.connect(\"<connection-string>\"); 
  print(\"Connection successful\"); 
  conn.close()'
"

# Check firewall rules
az postgres server firewall-rule list \
  --resource-group <rg> \
  --server-name <server-name>

# Add Azure services to firewall
az postgres server firewall-rule create \
  --resource-group <rg> \
  --server-name <server-name> \
  --name AllowAllAzureIPs \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0
```

### Issue 3: Static Files Not Loading

**Debug Steps:**

```bash
# SSH and check static files
az webapp ssh --name <app-name> --resource-group <rg> --command "
  ls -la /home/site/wwwroot/static
  cat /home/site/wwwroot/app/main.py | grep -A 5 'static'
"

# Check app settings for static file serving
az webapp config appsettings list \
  --name <app-name> \
  --resource-group <rg> \
  --query "[?name=='STATIC_ROOT' || name=='STATICFILES_DIRS']"
```

### Issue 4: Slow Response Times

**Debug Steps:**

```yaml
- name: Performance Diagnostics
  run: |
    # Check app metrics
    az monitor metrics list \
      --resource /subscriptions/${{ secrets.AZURE_SUBSCRIPTION_ID }}/resourceGroups/${{ secrets.AZURE_RESOURCE_GROUP }}/providers/Microsoft.Web/sites/${{ secrets.AZURE_WEBAPP_NAME }} \
      --metric "AverageResponseTime" "CpuTime" "MemoryWorkingSet" \
      --start-time $(date -u -d '1 hour ago' '+%Y-%m-%dT%H:%M:%SZ')
    
    # Check if app needs scaling
    az appservice plan show \
      --name <plan-name> \
      --resource-group <rg> \
      --query "{sku:sku, numberOfWorkers:numberOfWorkers}"
```

---

## Complete Debugging Workflow Example

Here's a complete workflow that combines all debugging capabilities:

```yaml
name: Azure Deployment with Debug Support

on:
  push:
    branches: [main]
  workflow_dispatch:
    inputs:
      enable_debug:
        description: 'Enable interactive debugging'
        required: false
        type: boolean
        default: false

jobs:
  deploy-and-debug:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Azure Login
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}
      
      - name: Deploy to Azure
        uses: azure/webapps-deploy@v3
        with:
          app-name: ${{ secrets.AZURE_WEBAPP_NAME }}
          publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
          package: backend/app
      
      - name: Wait for Deployment
        run: sleep 30
      
      - name: Health Check
        id: health_check
        continue-on-error: true
        run: |
          RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://${{ secrets.AZURE_WEBAPP_NAME }}.azurewebsites.net/api/health)
          echo "HTTP Status: $RESPONSE"
          if [ $RESPONSE -ne 200 ]; then
            echo "health_check_failed=true" >> $GITHUB_OUTPUT
            exit 1
          fi
      
      - name: Auto-Debug on Failure
        if: failure() && steps.health_check.outputs.health_check_failed == 'true'
        run: |
          echo "=== Health check failed. Collecting diagnostics... ==="
          
          # Download logs
          az webapp log download \
            --name ${{ secrets.AZURE_WEBAPP_NAME }} \
            --resource-group ${{ secrets.AZURE_RESOURCE_GROUP }} \
            --log-file debug-logs.zip
          
          # Show recent errors
          unzip -q debug-logs.zip
          find . -name "*.log" -type f -exec grep -i "error\|exception\|fail" {} \; | tail -100
      
      - name: Interactive Debug Session
        if: failure() && github.event.inputs.enable_debug == 'true'
        uses: mxschmitt/action-tmate@v3
        with:
          limit-access-to-actor: true
        timeout-minutes: 30
      
      - name: Upload Debug Artifacts
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: azure-deployment-logs
          path: |
            *.zip
            *.log
          retention-days: 7
```

---

## Summary

| Method | Use Case | Setup Time | Skill Level |
|--------|----------|------------|-------------|
| **Azure CLI in Actions** | Automated checks | 15 min | Beginner |
| **tmate SSH Session** | Interactive debugging | 5 min | Intermediate |
| **Self-Hosted Runner** | Persistent debugging | 30 min | Advanced |
| **Azure App SSH** | Live app debugging | Instant | Beginner |
| **GitHub Codespaces** | Cloud development | Instant | Beginner |

### Recommended Approach

1. **Start with:** Azure CLI in GitHub Actions for automated diagnostics
2. **Add:** tmate for interactive debugging when needed
3. **Consider:** Self-hosted runner on Azure VM for production environments
4. **Use:** Azure App SSH for quick checks and manual interventions

---

## Additional Resources

- [GitHub Actions Azure Documentation](https://docs.github.com/en/actions/deployment/deploying-to-your-cloud-provider/deploying-to-azure)
- [Azure CLI Documentation](https://docs.microsoft.com/en-us/cli/azure/)
- [Self-Hosted Runners Documentation](https://docs.github.com/en/actions/hosting-your-own-runners)
- [Azure App Service SSH](https://docs.microsoft.com/en-us/azure/app-service/configure-linux-open-ssh-session)
- [action-tmate Documentation](https://github.com/mxschmitt/action-tmate)

---

**Questions or Issues?** Check the [Main README](../README.md) or open an issue on GitHub.
