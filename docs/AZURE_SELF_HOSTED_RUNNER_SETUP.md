# Setting Up Self-Hosted GitHub Runner on Azure VM

This guide shows you how to set up a GitHub Actions self-hosted runner on an Azure Virtual Machine. This is useful when you need persistent connection to Azure for debugging deployments.

## Why Use a Self-Hosted Runner on Azure?

**Benefits:**
- ✅ Direct network access to Azure resources (no egress charges)
- ✅ Faster deployments (reduced latency, same region)
- ✅ Pre-configured environment (Azure CLI, tools always ready)
- ✅ Persistent debugging environment
- ✅ Can access private Azure resources (VNets, private endpoints)
- ✅ No concurrent job limits (run as many as VM can handle)

**Use Cases:**
- Debugging production issues in Azure
- Running database migrations
- Accessing private Azure resources
- Continuous deployment pipelines
- Heavy build workloads

---

## Step 1: Create Azure VM

### Option A: Using Azure CLI (Recommended)

```bash
# Login to Azure
az login

# Set variables (customize these)
RESOURCE_GROUP="github-runner-rg"
VM_NAME="github-runner-vm"
LOCATION="eastus"  # Use same region as your app
VM_SIZE="Standard_B2s"  # 2 vCPU, 4GB RAM - suitable for most workloads

# Create resource group
az group create --name $RESOURCE_GROUP --location $LOCATION

# Create VM
az vm create \
  --resource-group $RESOURCE_GROUP \
  --name $VM_NAME \
  --image Ubuntu2204 \
  --size $VM_SIZE \
  --admin-username azureuser \
  --generate-ssh-keys \
  --public-ip-sku Standard \
  --nsg-rule SSH

# Get the public IP address
PUBLIC_IP=$(az vm list-ip-addresses \
  --resource-group $RESOURCE_GROUP \
  --name $VM_NAME \
  --query "[0].virtualMachine.network.publicIpAddresses[0].ipAddress" \
  --output tsv)

echo "VM created! Connect with: ssh azureuser@$PUBLIC_IP"
```

### Option B: Using Azure Portal

1. Go to [Azure Portal](https://portal.azure.com)
2. Click **Create a resource** → **Virtual machine**
3. Configure:
   - **Resource group:** Create new "github-runner-rg"
   - **Name:** github-runner-vm
   - **Region:** Same as your app (e.g., East US)
   - **Image:** Ubuntu 22.04 LTS
   - **Size:** Standard_B2s (2 vCPUs, 4 GB RAM)
   - **Authentication:** SSH public key
   - **Inbound ports:** SSH (22)
4. Click **Review + create** → **Create**
5. Wait for deployment, then note the public IP

---

## Step 2: Connect to VM and Install Dependencies

```bash
# SSH to the VM
ssh azureuser@<PUBLIC_IP>

# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y curl git build-essential

# Install Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Verify Azure CLI installation
az --version

# Install Docker (optional, for container builds)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker azureuser

# Install Python 3.11 (if needed for your app)
sudo apt install -y software-properties-common
sudo add-apt-repository -y ppa:deadsnakes/ppa
sudo apt update
sudo apt install -y python3.11 python3.11-venv python3.11-dev

# Install Node.js 18 (if needed for your app)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installations
python3.11 --version
node --version
docker --version
```

---

## Step 3: Get GitHub Runner Token

### For Repository Runner:

1. Go to your repository on GitHub
2. Navigate to: **Settings** → **Actions** → **Runners**
3. Click **New self-hosted runner**
4. Select **Linux** as the operating system
5. Copy the token shown (looks like: `A************...`)

### For Organization Runner (if you want to share across repos):

1. Go to your organization on GitHub
2. Navigate to: **Settings** → **Actions** → **Runners**
3. Click **New runner** → **New self-hosted runner**
4. Select **Linux**
5. Copy the token

---

## Step 4: Install GitHub Actions Runner

```bash
# Create a folder for the runner
mkdir ~/actions-runner && cd ~/actions-runner

# Download the latest runner package
# Check for latest version: https://github.com/actions/runner/releases
RUNNER_VERSION="2.311.0"  # Update this to the latest version
curl -o actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz \
  -L https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz

# Extract the installer
tar xzf ./actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz

# Configure the runner
# For repository runner:
./config.sh --url https://github.com/ismaelloveexcel/Secure-Renewals-2 --token <YOUR-TOKEN>

# Or for organization runner:
# ./config.sh --url https://github.com/<YOUR-ORG> --token <YOUR-TOKEN>

# When prompted:
# - Runner name: azure-runner-01 (or any name you prefer)
# - Runner group: Default
# - Work folder: _work (default)
# - Run as service: yes

# The config script will ask several questions:
# 1. Enter the name of the runner group: [press Enter for default]
# 2. Enter the name of runner: azure-runner-01
# 3. Enter any additional labels: azure,self-hosted
# 4. Enter name of work folder: [press Enter for _work]
```

---

## Step 5: Install Runner as a Service

```bash
# Install the service
sudo ./svc.sh install

# Start the service
sudo ./svc.sh start

# Check status
sudo ./svc.sh status

# Enable to start on boot
sudo systemctl enable actions.runner.*

# View logs
sudo journalctl -u actions.runner.* -f
```

---

## Step 6: Configure Azure Authentication on Runner

### Option A: Service Principal (Recommended for automation)

```bash
# Login to Azure as the runner
az login --service-principal \
  -u <APP_ID> \
  -p <PASSWORD_OR_CERT> \
  --tenant <TENANT_ID>

# Or save credentials to environment variables
# Add to /home/azureuser/.bashrc or create a service file:
export AZURE_CLIENT_ID="<app-id>"
export AZURE_CLIENT_SECRET="<password>"
export AZURE_TENANT_ID="<tenant-id>"
export AZURE_SUBSCRIPTION_ID="<subscription-id>"
```

### Option B: Managed Identity (Most Secure)

```bash
# Assign managed identity to VM (from your local machine)
az vm identity assign \
  --resource-group $RESOURCE_GROUP \
  --name $VM_NAME

# Grant permissions to the managed identity
IDENTITY_ID=$(az vm show \
  --resource-group $RESOURCE_GROUP \
  --name $VM_NAME \
  --query "identity.principalId" -o tsv)

az role assignment create \
  --assignee $IDENTITY_ID \
  --role Contributor \
  --scope /subscriptions/<subscription-id>/resourceGroups/<your-app-rg>

# Test authentication (on the VM)
az login --identity
az account show
```

---

## Step 7: Update GitHub Workflows to Use Self-Hosted Runner

Modify your workflows to use the self-hosted runner:

```yaml
# .github/workflows/azure-deploy-self-hosted.yml
name: Deploy to Azure (Self-Hosted)

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    name: Deploy to Azure App Service
    runs-on: self-hosted  # ← Changed from ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Login to Azure (using VM's managed identity)
        run: az login --identity
      
      - name: Set up Python
        run: |
          python3.11 -m venv venv
          source venv/bin/activate
          pip install -r backend/requirements.txt
      
      - name: Run Database Migrations
        run: |
          source venv/bin/activate
          cd backend
          alembic upgrade head
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
      
      - name: Deploy to Azure App Service
        run: |
          cd backend
          az webapp up \
            --name ${{ secrets.AZURE_WEBAPP_NAME }} \
            --resource-group ${{ secrets.AZURE_RESOURCE_GROUP }} \
            --runtime "PYTHON:3.11"
      
      - name: Restart App Service
        run: |
          az webapp restart \
            --name ${{ secrets.AZURE_WEBAPP_NAME }} \
            --resource-group ${{ secrets.AZURE_RESOURCE_GROUP }}
      
      - name: Run Health Check
        run: |
          sleep 30
          curl -f https://${{ secrets.AZURE_WEBAPP_NAME }}.azurewebsites.net/api/health
```

---

## Step 8: Test the Runner

### Create a test workflow:

```yaml
# .github/workflows/test-self-hosted-runner.yml
name: Test Self-Hosted Runner

on:
  workflow_dispatch:

jobs:
  test:
    runs-on: self-hosted
    steps:
      - name: Check System Info
        run: |
          echo "=== System Information ==="
          uname -a
          echo ""
          echo "=== Azure CLI Version ==="
          az --version
          echo ""
          echo "=== Python Version ==="
          python3.11 --version
          echo ""
          echo "=== Node Version ==="
          node --version
          echo ""
          echo "=== Docker Version ==="
          docker --version
          echo ""
          echo "=== Current User ==="
          whoami
          echo ""
          echo "=== Azure Account ==="
          az account show
```

Push this workflow and run it manually to verify everything works.

---

## Step 9: Debugging with Self-Hosted Runner

Now you can debug Azure deployments directly:

### Example 1: View Live Logs

```yaml
- name: View Azure App Logs
  runs-on: self-hosted
  steps:
    - name: Stream logs
      run: |
        az webapp log tail \
          --name ${{ secrets.AZURE_WEBAPP_NAME }} \
          --resource-group ${{ secrets.AZURE_RESOURCE_GROUP }}
```

### Example 2: SSH into App

```yaml
- name: SSH to App and Debug
  runs-on: self-hosted
  steps:
    - name: Execute commands in app container
      run: |
        az webapp ssh \
          --name ${{ secrets.AZURE_WEBAPP_NAME }} \
          --resource-group ${{ secrets.AZURE_RESOURCE_GROUP }} \
          --command "ls -la /home/site/wwwroot && python --version"
```

### Example 3: Database Operations

```yaml
- name: Run Database Commands
  runs-on: self-hosted
  steps:
    - name: Connect and query
      run: |
        az webapp ssh \
          --name ${{ secrets.AZURE_WEBAPP_NAME }} \
          --resource-group ${{ secrets.AZURE_RESOURCE_GROUP }} \
          --command "cd /home/site/wwwroot && python -c 'import psycopg2; print(\"DB OK\")'"
```

---

## Maintenance & Management

### View Runner Status

```bash
# On the VM
sudo ./svc.sh status

# View logs
sudo journalctl -u actions.runner.* -n 100 -f
```

### Stop/Start Runner

```bash
# Stop
sudo ./svc.sh stop

# Start
sudo ./svc.sh start

# Restart
sudo ./svc.sh restart
```

### Update Runner

```bash
cd ~/actions-runner
sudo ./svc.sh stop
sudo ./svc.sh uninstall

# Download new version (check https://github.com/actions/runner/releases for latest)
RUNNER_VERSION="2.312.0"  # Example: Update to newer version
curl -o actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz \
  -L https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz

tar xzf ./actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz

sudo ./svc.sh install
sudo ./svc.sh start
```

### Remove Runner

```bash
# On the VM
cd ~/actions-runner
sudo ./svc.sh stop
sudo ./svc.sh uninstall
./config.sh remove --token <REMOVAL-TOKEN>

# Delete VM (from your local machine)
az vm delete --resource-group $RESOURCE_GROUP --name $VM_NAME --yes
az group delete --name $RESOURCE_GROUP --yes
```

---

## Cost Optimization

### VM Sizing

| VM Size | vCPU | RAM | Cost/Month | Use Case |
|---------|------|-----|------------|----------|
| **B1s** | 1 | 1 GB | ~$8 | Testing only |
| **B2s** | 2 | 4 GB | ~$30 | **Recommended** for most cases |
| **B2ms** | 2 | 8 GB | ~$60 | Heavy builds |
| **B4ms** | 4 | 16 GB | ~$120 | Multiple concurrent jobs |

### Auto-Shutdown (Save costs)

```bash
# Configure auto-shutdown at night (saves ~60% cost)
az vm auto-shutdown \
  --resource-group $RESOURCE_GROUP \
  --name $VM_NAME \
  --time 1900 \
  --timezone "UTC"
```

### Deallocate when not needed

```bash
# Deallocate (no compute charges, only storage ~$5/month)
az vm deallocate --resource-group $RESOURCE_GROUP --name $VM_NAME

# Start when needed
az vm start --resource-group $RESOURCE_GROUP --name $VM_NAME
```

---

## Troubleshooting

### Runner not showing in GitHub

**Check:**
1. Runner service status: `sudo ./svc.sh status`
2. Runner logs: `sudo journalctl -u actions.runner.* -f`
3. Network connectivity: `curl https://github.com`

### Authentication issues

**Check:**
1. Azure login: `az account show`
2. If using managed identity: Verify role assignment
3. If using service principal: Verify credentials

### Workflow stuck on "Waiting for a runner"

**Check:**
1. Runner is online in GitHub Settings
2. Runner labels match workflow `runs-on: self-hosted`
3. Runner has capacity (not running other jobs)

---

## Security Best Practices

1. **Use Managed Identity** instead of service principal when possible
2. **Restrict Network Access** - Configure NSG rules to limit SSH access
3. **Enable Azure Defender** for VM security monitoring
4. **Regular Updates** - Keep the VM and runner updated
5. **Separate Runners** - Don't use the same runner for different security levels
6. **Audit Logs** - Enable Azure Monitor for runner activity

---

## Summary

You now have a GitHub Actions self-hosted runner on Azure that:
- ✅ Can debug your Azure deployments directly
- ✅ Has fast access to Azure resources
- ✅ Can run any Azure CLI commands
- ✅ Persists between workflow runs
- ✅ Costs ~$30/month (or less with auto-shutdown)

## Next Steps

- Create debug workflows using `runs-on: self-hosted`
- Set up auto-shutdown to save costs
- Configure managed identity for secure authentication
- Add more runners for different environments (dev, staging, prod)

---

**Related Documentation:**
- [Azure Debugging Guide](AZURE_DEBUGGING_GUIDE.md)
- [Using Azure Debug Workflow](USING_AZURE_DEBUG_WORKFLOW.md)
- [Azure Debugging Quick Reference](AZURE_DEBUGGING_QUICK_REFERENCE.md)
