#!/bin/bash
# =============================================================================
# Azure Infrastructure Provisioning Script for Secure Renewals HR Portal
# This script automates the one-time Azure setup with minimal manual intervention
# =============================================================================

set -e

# Configuration - Update these values
RESOURCE_GROUP="secure-renewals-rg"
LOCATION="uaenorth"
APP_SERVICE_PLAN="secure-renewals-plan"
WEBAPP_NAME="secure-renewals-api"
STATIC_WEB_APP_NAME="secure-renewals-frontend"
POSTGRES_SERVER="secure-renewals-db"
POSTGRES_DB="secure_renewals"
POSTGRES_ADMIN="sradmin"
GITHUB_REPO="ismaelloveexcel/Secure-Renewals-2"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Azure Infrastructure Provisioning    ${NC}"
echo -e "${BLUE}  Secure Renewals HR Portal            ${NC}"
echo -e "${BLUE}========================================${NC}"

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo -e "${RED}Error: Azure CLI is not installed.${NC}"
    echo "Install it from: https://docs.microsoft.com/cli/azure/install-azure-cli"
    exit 1
fi

# Check if logged in
echo -e "\n${YELLOW}Step 1: Checking Azure login status...${NC}"
if ! az account show &> /dev/null; then
    echo "Not logged in. Starting Azure login..."
    az login
fi

SUBSCRIPTION_ID=$(az account show --query id -o tsv)
TENANT_ID=$(az account show --query tenantId -o tsv)
echo -e "${GREEN}✓ Logged in to Azure${NC}"
echo "  Subscription: $SUBSCRIPTION_ID"
echo "  Tenant: $TENANT_ID"

# Create Resource Group
echo -e "\n${YELLOW}Step 2: Creating Resource Group...${NC}"
az group create --name $RESOURCE_GROUP --location $LOCATION --output none
echo -e "${GREEN}✓ Resource group '$RESOURCE_GROUP' created in $LOCATION${NC}"

# Create App Service Plan
echo -e "\n${YELLOW}Step 3: Creating App Service Plan...${NC}"
az appservice plan create \
    --name $APP_SERVICE_PLAN \
    --resource-group $RESOURCE_GROUP \
    --sku B1 \
    --is-linux \
    --output none
echo -e "${GREEN}✓ App Service Plan created${NC}"

# Create Web App
echo -e "\n${YELLOW}Step 4: Creating Web App for Backend...${NC}"
az webapp create \
    --name $WEBAPP_NAME \
    --resource-group $RESOURCE_GROUP \
    --plan $APP_SERVICE_PLAN \
    --runtime "PYTHON:3.11" \
    --output none
echo -e "${GREEN}✓ Web App '$WEBAPP_NAME' created${NC}"

# Create staging slot
echo -e "\n${YELLOW}Step 5: Creating Staging Slot...${NC}"
az webapp deployment slot create \
    --name $WEBAPP_NAME \
    --resource-group $RESOURCE_GROUP \
    --slot staging \
    --output none
echo -e "${GREEN}✓ Staging slot created${NC}"

# Configure startup command
az webapp config set \
    --name $WEBAPP_NAME \
    --resource-group $RESOURCE_GROUP \
    --startup-file "gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app" \
    --output none

# Enable managed identity
az webapp identity assign \
    --name $WEBAPP_NAME \
    --resource-group $RESOURCE_GROUP \
    --output none
echo -e "${GREEN}✓ Managed identity enabled${NC}"

# Create PostgreSQL Flexible Server
echo -e "\n${YELLOW}Step 6: Creating PostgreSQL Database...${NC}"
POSTGRES_PASSWORD=$(openssl rand -base64 24 | tr -d '/@+=')

az postgres flexible-server create \
    --name $POSTGRES_SERVER \
    --resource-group $RESOURCE_GROUP \
    --location $LOCATION \
    --admin-user $POSTGRES_ADMIN \
    --admin-password "$POSTGRES_PASSWORD" \
    --sku-name Standard_B1ms \
    --tier Burstable \
    --storage-size 32 \
    --version 15 \
    --yes \
    --output none
echo -e "${GREEN}✓ PostgreSQL server created${NC}"

# Create database
az postgres flexible-server db create \
    --resource-group $RESOURCE_GROUP \
    --server-name $POSTGRES_SERVER \
    --database-name $POSTGRES_DB \
    --output none
echo -e "${GREEN}✓ Database '$POSTGRES_DB' created${NC}"

# Allow Azure services to access the database
az postgres flexible-server firewall-rule create \
    --resource-group $RESOURCE_GROUP \
    --name $POSTGRES_SERVER \
    --rule-name AllowAzureServices \
    --start-ip-address 0.0.0.0 \
    --end-ip-address 0.0.0.0 \
    --output none
echo -e "${GREEN}✓ Firewall rule configured${NC}"

# Create Static Web App
echo -e "\n${YELLOW}Step 7: Creating Static Web App for Frontend...${NC}"
az staticwebapp create \
    --name $STATIC_WEB_APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --location $LOCATION \
    --sku Free \
    --output none 2>/dev/null || echo "Static Web App may already exist or requires manual creation in portal"
echo -e "${GREEN}✓ Static Web App created${NC}"

# Get Static Web App deployment token
SWA_TOKEN=$(az staticwebapp secrets list \
    --name $STATIC_WEB_APP_NAME \
    --query "properties.apiKey" -o tsv 2>/dev/null || echo "")

# Create Azure AD App Registration for GitHub Actions OIDC
echo -e "\n${YELLOW}Step 8: Creating Azure AD App Registration for OIDC...${NC}"
APP_NAME="secure-renewals-github-actions"

# Check if app already exists
EXISTING_APP_ID=$(az ad app list --display-name "$APP_NAME" --query "[0].appId" -o tsv 2>/dev/null || echo "")

if [ -z "$EXISTING_APP_ID" ]; then
    # Create new app registration
    az ad app create --display-name "$APP_NAME" --output none
    APP_ID=$(az ad app list --display-name "$APP_NAME" --query "[0].appId" -o tsv)
    
    # Create service principal
    az ad sp create --id $APP_ID --output none
else
    APP_ID=$EXISTING_APP_ID
    echo "App registration already exists"
fi
echo -e "${GREEN}✓ App registration created: $APP_ID${NC}"

# Get service principal object ID
SP_OBJECT_ID=$(az ad sp show --id $APP_ID --query "id" -o tsv)

# Assign Contributor role
echo -e "\n${YELLOW}Step 9: Assigning RBAC permissions...${NC}"
az role assignment create \
    --role Contributor \
    --assignee-object-id $SP_OBJECT_ID \
    --assignee-principal-type ServicePrincipal \
    --scope "/subscriptions/${SUBSCRIPTION_ID}/resourceGroups/${RESOURCE_GROUP}" \
    --output none 2>/dev/null || echo "Role assignment may already exist"
echo -e "${GREEN}✓ Contributor role assigned${NC}"

# Create federated credential for GitHub Actions
echo -e "\n${YELLOW}Step 10: Creating Federated Credentials for OIDC...${NC}"

# For main branch
az ad app federated-credential create --id $APP_ID --parameters "{
  \"name\": \"github-main-branch\",
  \"issuer\": \"https://token.actions.githubusercontent.com\",
  \"subject\": \"repo:${GITHUB_REPO}:ref:refs/heads/main\",
  \"audiences\": [\"api://AzureADTokenExchange\"]
}" --output none 2>/dev/null || echo "Federated credential for main branch may already exist"

# For pull requests
az ad app federated-credential create --id $APP_ID --parameters "{
  \"name\": \"github-pull-requests\",
  \"issuer\": \"https://token.actions.githubusercontent.com\",
  \"subject\": \"repo:${GITHUB_REPO}:pull_request\",
  \"audiences\": [\"api://AzureADTokenExchange\"]
}" --output none 2>/dev/null || echo "Federated credential for PRs may already exist"

echo -e "${GREEN}✓ Federated credentials created${NC}"

# Build connection strings and secrets
DATABASE_URL="postgresql+asyncpg://${POSTGRES_ADMIN}:${POSTGRES_PASSWORD}@${POSTGRES_SERVER}.postgres.database.azure.com:5432/${POSTGRES_DB}?sslmode=require"
API_BASE_URL="https://${WEBAPP_NAME}.azurewebsites.net/api"

# Configure Web App settings
echo -e "\n${YELLOW}Step 11: Configuring Web App settings...${NC}"
az webapp config appsettings set \
    --name $WEBAPP_NAME \
    --resource-group $RESOURCE_GROUP \
    --settings \
        DATABASE_URL="$DATABASE_URL" \
        ALLOWED_ORIGINS="https://${STATIC_WEB_APP_NAME}.azurestaticapps.net" \
        APP_ENV="production" \
    --output none
echo -e "${GREEN}✓ Web App settings configured${NC}"

# Output summary
echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}  Infrastructure Created Successfully!  ${NC}"
echo -e "${BLUE}========================================${NC}"

echo -e "\n${GREEN}Azure Resources:${NC}"
echo "  • Resource Group: $RESOURCE_GROUP"
echo "  • Web App: https://${WEBAPP_NAME}.azurewebsites.net"
echo "  • Static Web App: https://${STATIC_WEB_APP_NAME}.azurestaticapps.net"
echo "  • PostgreSQL: ${POSTGRES_SERVER}.postgres.database.azure.com"

echo -e "\n${YELLOW}GitHub Secrets to Configure:${NC}"
echo -e "Add these secrets to: Settings → Secrets → Actions\n"

echo "AZURE_CLIENT_ID=$APP_ID"
echo "AZURE_TENANT_ID=$TENANT_ID"
echo "AZURE_SUBSCRIPTION_ID=$SUBSCRIPTION_ID"
echo "DATABASE_URL=$DATABASE_URL"
echo "API_BASE_URL=$API_BASE_URL"
if [ -n "$SWA_TOKEN" ]; then
    echo "AZURE_STATIC_WEB_APPS_API_TOKEN=$SWA_TOKEN"
else
    echo "AZURE_STATIC_WEB_APPS_API_TOKEN=<Get from Azure Portal → Static Web App → Manage deployment token>"
fi

echo -e "\n${GREEN}Next Steps:${NC}"
echo "1. Copy the secrets above to your GitHub repository"
echo "2. Push to main branch to trigger automatic deployment"
echo "3. Your app will deploy automatically via GitHub Actions!"

echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}  Zero-Touch Deployment Ready!          ${NC}"
echo -e "${BLUE}========================================${NC}"
