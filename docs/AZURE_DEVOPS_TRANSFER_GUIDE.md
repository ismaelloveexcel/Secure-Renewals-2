# Azure DevOps Transfer Guide

This guide explains how to transfer the Secure Renewals HR Portal from GitHub to Azure DevOps.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Step 1: Create Azure DevOps Organization and Project](#step-1-create-azure-devops-organization-and-project)
- [Step 2: Import Repository to Azure Repos](#step-2-import-repository-to-azure-repos)
- [Step 3: Set Up Azure Pipelines](#step-3-set-up-azure-pipelines)
- [Step 4: Configure Service Connections](#step-4-configure-service-connections)
- [Step 5: Set Up Variables and Secrets](#step-5-set-up-variables-and-secrets)
- [Step 6: Create Azure Pipeline YAML Files](#step-6-create-azure-pipeline-yaml-files)
- [Step 7: Configure Branch Policies](#step-7-configure-branch-policies)
- [Step 8: Set Up Boards (Optional)](#step-8-set-up-boards-optional)
- [Migration Checklist](#migration-checklist)
- [GitHub vs Azure DevOps Comparison](#github-vs-azure-devops-comparison)
- [Troubleshooting](#troubleshooting)

---

## Overview

### What is Azure DevOps?

Azure DevOps is Microsoft's integrated platform for:
- **Azure Repos** - Git repositories (like GitHub)
- **Azure Pipelines** - CI/CD (like GitHub Actions)
- **Azure Boards** - Project management (like GitHub Issues/Projects)
- **Azure Artifacts** - Package management (like GitHub Packages)
- **Azure Test Plans** - Testing management

### Why Transfer to Azure DevOps?

- Integrated Microsoft ecosystem (Azure Portal, Entra ID, Microsoft 365)
- Enhanced security and compliance features
- Advanced pipeline capabilities for enterprise
- Unified billing with Azure subscription
- Better integration with Azure services

---

## Prerequisites

Before starting the transfer:

1. **Azure DevOps Account**
   - Sign up at: https://dev.azure.com
   - Use your Microsoft work/school account

2. **Azure Subscription** (for deployments)
   - Required for Azure App Service, Static Web Apps, etc.
   - Get it at: https://portal.azure.com

3. **Git Installed Locally**
   - Verify: `git --version`

4. **Access to Current GitHub Repository**
   - Read access to clone the repository
   - Admin access if you need to set up mirroring

---

## Step 1: Create Azure DevOps Organization and Project

### 1.1 Create Organization

1. Go to https://dev.azure.com
2. Click **"New organization"**
3. Choose organization name (e.g., `your-company-name`)
4. Select region closest to your team
5. Click **"Continue"**

### 1.2 Create Project

1. Click **"New Project"**
2. Enter project details:
   - **Name:** `Secure-Renewals`
   - **Description:** `HR Portal for managing employee contract renewals`
   - **Visibility:** Private (recommended for internal apps)
   - **Version control:** Git
   - **Work item process:** Agile (or Scrum/Basic)
3. Click **"Create"**

---

## Step 2: Import Repository to Azure Repos

### Option A: Import Directly from GitHub (Recommended)

1. In your Azure DevOps project, go to **Repos** → **Files**
2. Click **"Import a repository"**
3. Enter:
   - **Source type:** Git
   - **Clone URL:** `https://github.com/ismaelloveexcel/Secure-Renewals-2.git`
   - **Requires authorization:** Check if private repo
4. Click **"Import"**

### Option B: Manual Import via Git

```bash
# 1. Clone from GitHub
git clone https://github.com/ismaelloveexcel/Secure-Renewals-2.git
cd Secure-Renewals-2

# 2. Add Azure DevOps as new remote
git remote add azure https://dev.azure.com/YOUR-ORG/Secure-Renewals/_git/Secure-Renewals

# 3. Push all branches and tags
git push azure --all
git push azure --tags
```

### Option C: Mirror for Continuous Sync

If you want to keep both GitHub and Azure DevOps in sync temporarily:

```bash
# Clone as mirror
git clone --mirror https://github.com/ismaelloveexcel/Secure-Renewals-2.git

# Push to Azure DevOps
cd Secure-Renewals-2.git
git remote set-url --push origin https://dev.azure.com/YOUR-ORG/Secure-Renewals/_git/Secure-Renewals
git push --mirror
```

---

## Step 3: Set Up Azure Pipelines

### 3.1 Enable Pipelines

1. In Azure DevOps, go to **Pipelines** → **Pipelines**
2. Click **"Create Pipeline"**
3. Select **"Azure Repos Git"**
4. Select your repository

### 3.2 Create Pipeline Files

You'll need to create Azure Pipeline YAML files. See [Step 6](#step-6-create-azure-pipeline-yaml-files) for the converted pipelines.

---

## Step 4: Configure Service Connections

### 4.1 Azure Resource Manager Connection

Required for deploying to Azure services:

1. Go to **Project Settings** → **Service connections**
2. Click **"New service connection"**
3. Select **"Azure Resource Manager"**
4. Choose **"Service principal (automatic)"**
5. Select your Azure subscription
6. Name it: `azure-subscription`
7. Grant access to all pipelines
8. Click **"Save"**

### 4.2 Container Registry (Optional)

If using Docker:

1. Create new service connection
2. Select **"Docker Registry"**
3. Choose **"Azure Container Registry"**
4. Select your ACR instance

---

## Step 5: Set Up Variables and Secrets

### 5.1 Create Variable Groups

1. Go to **Pipelines** → **Library**
2. Click **"+ Variable group"**
3. Create groups for each environment:

**Variable Group: `secure-renewals-common`**
| Variable | Value | Secret |
|----------|-------|--------|
| PYTHON_VERSION | 3.11 | No |
| NODE_VERSION | 20 | No |

**Variable Group: `secure-renewals-prod`**
| Variable | Value | Secret |
|----------|-------|--------|
| DATABASE_URL | (your connection string) | Yes |
| AUTH_SECRET_KEY | (your secret) | Yes |
| AZURE_WEBAPP_NAME | secure-renewals-app | No |
| AUTH_ISSUER | https://login.microsoftonline.com/.../v2.0 | No |
| AUTH_AUDIENCE | api://secure-renewals | No |

### 5.2 Link to Azure Key Vault (Recommended)

For better secret management:

1. Create Azure Key Vault in Azure Portal
2. Add secrets to Key Vault
3. In Variable Group, click **"Link secrets from Azure key vault"**
4. Select subscription and Key Vault
5. Authorize and add variables

---

## Step 6: Create Azure Pipeline YAML Files

Create these files in your repository root:

### 6.1 Main CI Pipeline (`azure-pipelines.yml`)

```yaml
# Azure DevOps CI Pipeline
# Equivalent to GitHub Actions ci.yml

trigger:
  branches:
    include:
      - main
  paths:
    exclude:
      - '*.md'
      - 'docs/**'

pr:
  branches:
    include:
      - main

variables:
  - group: secure-renewals-common

stages:
  - stage: Lint
    displayName: 'Lint & Validate'
    jobs:
      - job: BackendLint
        displayName: 'Backend Lint'
        pool:
          vmImage: 'ubuntu-latest'
        steps:
          - task: UsePythonVersion@0
            inputs:
              versionSpec: '$(PYTHON_VERSION)'
              addToPath: true

          - script: |
              pip install uv
              cd backend
              uv sync
            displayName: 'Install Backend Dependencies'

          - script: |
              cd backend
              find app -name '*.py' -exec uv run python -m py_compile {} +
            displayName: 'Check Python Syntax'

      - job: FrontendLint
        displayName: 'Frontend Lint'
        pool:
          vmImage: 'ubuntu-latest'
        steps:
          - task: NodeTool@0
            inputs:
              versionSpec: '$(NODE_VERSION)'

          - script: |
              cd frontend
              npm install
            displayName: 'Install Frontend Dependencies'

          - script: |
              cd frontend
              npm run lint
            displayName: 'TypeScript Check'

  - stage: Security
    displayName: 'Security Scan'
    dependsOn: Lint
    jobs:
      - job: SecurityScan
        displayName: 'Security Scan'
        pool:
          vmImage: 'ubuntu-latest'
        steps:
          - task: AdvancedSecurity-Codeql-Init@1
            inputs:
              languages: 'python,javascript'
              querysuite: 'security-extended'

          - task: AdvancedSecurity-Codeql-Analyze@1
```

### 6.2 Deployment Pipeline (`azure-pipelines-deploy.yml`)

```yaml
# Azure DevOps Deployment Pipeline
# Equivalent to GitHub Actions deploy.yml

trigger:
  branches:
    include:
      - main

variables:
  - group: secure-renewals-common
  - group: secure-renewals-prod

stages:
  - stage: Build
    displayName: 'Build'
    jobs:
      - job: BuildFrontend
        displayName: 'Build Frontend'
        pool:
          vmImage: 'ubuntu-latest'
        steps:
          - task: NodeTool@0
            inputs:
              versionSpec: '$(NODE_VERSION)'

          - script: |
              cd frontend
              npm install
              npm run build
            displayName: 'Build Frontend'

          - task: PublishBuildArtifacts@1
            inputs:
              pathToPublish: 'frontend/dist'
              artifactName: 'frontend'

      - job: BuildBackend
        displayName: 'Build Backend'
        pool:
          vmImage: 'ubuntu-latest'
        steps:
          - task: UsePythonVersion@0
            inputs:
              versionSpec: '$(PYTHON_VERSION)'

          - script: |
              pip install uv
              cd backend
              uv sync
            displayName: 'Install Dependencies'

          - task: ArchiveFiles@2
            inputs:
              rootFolderOrFile: 'backend'
              includeRootFolder: false
              archiveType: 'zip'
              archiveFile: '$(Build.ArtifactStagingDirectory)/backend.zip'

          - task: PublishBuildArtifacts@1
            inputs:
              pathToPublish: '$(Build.ArtifactStagingDirectory)/backend.zip'
              artifactName: 'backend'

  - stage: Deploy
    displayName: 'Deploy to Azure'
    dependsOn: Build
    condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/main'))
    jobs:
      - deployment: DeployFrontend
        displayName: 'Deploy Frontend'
        environment: 'production'
        pool:
          vmImage: 'ubuntu-latest'
        strategy:
          runOnce:
            deploy:
              steps:
                - task: AzureStaticWebApp@0
                  inputs:
                    app_location: '$(Pipeline.Workspace)/frontend'
                    skip_app_build: true
                    azure_static_web_apps_api_token: '$(AZURE_STATIC_WEB_APPS_TOKEN)'

      - deployment: DeployBackend
        displayName: 'Deploy Backend'
        environment: 'production'
        pool:
          vmImage: 'ubuntu-latest'
        strategy:
          runOnce:
            deploy:
              steps:
                - task: DownloadBuildArtifacts@1
                  inputs:
                    buildType: 'current'
                    downloadType: 'single'
                    artifactName: 'backend'
                    downloadPath: '$(Pipeline.Workspace)'

                - task: AzureWebApp@1
                  inputs:
                    azureSubscription: 'azure-subscription'
                    appType: 'webAppLinux'
                    appName: '$(AZURE_WEBAPP_NAME)'
                    package: '$(Pipeline.Workspace)/backend/backend.zip'
                    runtimeStack: 'PYTHON|3.11'
                    startUpCommand: 'gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app'
```

### 6.3 Scheduled Workflows

Create additional pipelines for scheduled tasks:

**`azure-pipelines-health.yml`** (Health Check)
```yaml
# Health Check Pipeline
# Equivalent to app-health-check.yml

schedules:
  - cron: '0 */6 * * *'
    displayName: 'Every 6 hours'
    branches:
      include:
        - main
    always: true

trigger: none

pool:
  vmImage: 'ubuntu-latest'

steps:
  - script: |
      curl -f https://$(AZURE_WEBAPP_NAME).azurewebsites.net/api/health || exit 1
    displayName: 'Health Check'
```

---

## Step 7: Configure Branch Policies

### 7.1 Protect Main Branch

1. Go to **Repos** → **Branches**
2. Click **⋯** next to `main` → **Branch policies**
3. Configure:

**Require minimum reviewers:**
- Check **"Require a minimum number of reviewers"**
- Set to **1** or more
- Check **"Allow requestors to approve their own changes"** (optional)

**Build validation:**
- Click **"+ Add build policy"**
- Select your CI pipeline
- Set **"Trigger"** to **Automatic**
- Set **"Policy requirement"** to **Required**

**Comment requirements:**
- Check **"Check for comment resolution"**

---

## Step 8: Set Up Boards (Optional)

### 8.1 Import GitHub Issues

Azure DevOps doesn't have automatic GitHub Issues import, but you can:

1. **Manual Migration:**
   - Export issues from GitHub as CSV
   - Import to Azure Boards using Excel

2. **Use Third-Party Tools:**
   - GitHub to Azure DevOps Migrator
   - Jira to Azure DevOps (if using Jira)

### 8.2 Configure Work Item Types

1. Go to **Project Settings** → **Boards** → **Team configuration**
2. Set up:
   - Sprints/Iterations
   - Areas
   - Team members

---

## Migration Checklist

Use this checklist to track your migration progress:

### Repository
- [ ] Create Azure DevOps organization
- [ ] Create project
- [ ] Import repository from GitHub
- [ ] Verify all branches imported
- [ ] Verify all tags imported
- [ ] Update remote URLs in local clones

### Pipelines
- [ ] Create `azure-pipelines.yml` (CI)
- [ ] Create `azure-pipelines-deploy.yml` (CD)
- [ ] Create scheduled pipelines (health, backup, etc.)
- [ ] Set up service connections (Azure subscription)
- [ ] Create variable groups
- [ ] Add secrets to variable groups or Key Vault
- [ ] Test CI pipeline on PR
- [ ] Test deployment pipeline

### Branch Policies
- [ ] Configure branch protection for `main`
- [ ] Set minimum reviewers
- [ ] Enable build validation
- [ ] Enable comment resolution

### Team Setup
- [ ] Add team members to project
- [ ] Configure permissions
- [ ] Set up notifications
- [ ] Update documentation with new URLs

### Cleanup
- [ ] Update README with Azure DevOps URLs
- [ ] Update deployment scripts
- [ ] Redirect or archive GitHub repository
- [ ] Notify team of migration

---

## GitHub vs Azure DevOps Comparison

| Feature | GitHub | Azure DevOps |
|---------|--------|--------------|
| **Repositories** | GitHub Repos | Azure Repos |
| **CI/CD** | GitHub Actions | Azure Pipelines |
| **Project Management** | Issues & Projects | Azure Boards |
| **Package Registry** | GitHub Packages | Azure Artifacts |
| **Code Review** | Pull Requests | Pull Requests |
| **Secrets** | Repository Secrets | Variable Groups / Key Vault |
| **Workflow File** | `.github/workflows/*.yml` | `azure-pipelines*.yml` |
| **Workflow Syntax** | YAML (GitHub Actions) | YAML (Azure Pipelines) |
| **Runners** | GitHub-hosted / Self-hosted | Microsoft-hosted / Self-hosted |
| **Triggers** | `on:` | `trigger:` / `pr:` / `schedules:` |
| **Jobs** | `jobs:` | `stages:` → `jobs:` |
| **Steps** | `steps:` → `uses:` / `run:` | `steps:` → `task:` / `script:` |

### Key Syntax Differences

| GitHub Actions | Azure Pipelines |
|----------------|-----------------|
| `uses: actions/checkout@v4` | `- checkout: self` |
| `uses: actions/setup-python@v4` | `- task: UsePythonVersion@0` |
| `uses: actions/setup-node@v4` | `- task: NodeTool@0` |
| `run: npm install` | `- script: npm install` |
| `${{ secrets.MY_SECRET }}` | `$(MY_SECRET)` |
| `${{ github.ref }}` | `$(Build.SourceBranch)` |
| `if: github.event_name == 'push'` | `condition: eq(variables['Build.Reason'], 'IndividualCI')` |

---

## Troubleshooting

### Pipeline Not Triggering

**Problem:** Pipeline doesn't run on push/PR

**Solutions:**
1. Check `trigger:` and `pr:` sections in YAML
2. Verify branch name matches exactly
3. Check pipeline is not disabled
4. Verify YAML file is in correct location (root or specified path)

### Service Connection Failed

**Problem:** Deployment fails with authentication error

**Solutions:**
1. Verify service connection in Project Settings → Service connections
2. Check service principal has correct permissions
3. Re-authorize the connection
4. Check subscription is active

### Build Agent Not Available

**Problem:** "No hosted parallelism has been purchased or granted"

**Solutions:**
1. Request free tier parallelism: https://aka.ms/azpipelines-parallelism-request
2. Use self-hosted agent
3. Check organization billing settings

### Variable Not Found

**Problem:** Pipeline fails with variable not found

**Solutions:**
1. Check variable group is linked to pipeline
2. Verify variable name matches (case-sensitive)
3. For secrets, ensure marked as secret in variable group
4. Check variable group permissions

### Permission Denied

**Problem:** Access denied errors

**Solutions:**
1. Check user permissions in Project Settings → Permissions
2. Verify security groups membership
3. Check branch policies for required reviewers

---

## Additional Resources

- [Azure DevOps Documentation](https://docs.microsoft.com/en-us/azure/devops/)
- [Azure Pipelines YAML Reference](https://docs.microsoft.com/en-us/azure/devops/pipelines/yaml-schema)
- [Migrate from GitHub Actions](https://docs.microsoft.com/en-us/azure/devops/pipelines/migrate/from-github-actions)
- [Azure DevOps Labs](https://azuredevopslabs.com/)

---

## Quick Reference

### Azure DevOps URLs

After migration, your URLs will be:
- **Repository:** `https://dev.azure.com/YOUR-ORG/Secure-Renewals/_git/Secure-Renewals`
- **Pipelines:** `https://dev.azure.com/YOUR-ORG/Secure-Renewals/_build`
- **Boards:** `https://dev.azure.com/YOUR-ORG/Secure-Renewals/_boards`
- **Pull Requests:** `https://dev.azure.com/YOUR-ORG/Secure-Renewals/_git/Secure-Renewals/pullrequests`

### Git Remote Update

Update your local git config after migration:

```bash
# View current remotes
git remote -v

# Update origin to Azure DevOps
git remote set-url origin https://dev.azure.com/YOUR-ORG/Secure-Renewals/_git/Secure-Renewals

# Verify
git remote -v
```

---

**Need Help?**

- Check [Troubleshooting](#troubleshooting) section
- Review [Azure DevOps Documentation](https://docs.microsoft.com/en-us/azure/devops/)
- Contact your IT/DevOps team
