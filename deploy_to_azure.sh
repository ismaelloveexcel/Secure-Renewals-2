#!/bin/bash
# ============================================================================
# Azure App Service Deployment Script for Secure Renewals HR Portal
# ============================================================================
# This script automates deployment to Azure App Service with PostgreSQL
# Run in Azure Cloud Shell: https://shell.azure.com (no install needed)
# Or install Azure CLI locally: https://aka.ms/azure-cli
# ============================================================================

set -e  # Exit on error

# ============================================================================
# CONFIGURATION - Edit these variables
# ============================================================================
RESOURCE_GROUP="secure-renewals-rg"
APP_SERVICE_PLAN="secure-renewals-plan"
WEBAPP_NAME="secure-renewals-app"
LOCATION="eastus"
GITHUB_REPO="ismaelloveexcel/Secure-Renewals-2"
BRANCH="main"

# Database configuration
DB_SERVER_NAME="secure-renewals-db-server"
DB_NAME="secure_renewals"
DB_ADMIN_USER="dbadmin"
DB_ADMIN_PASSWORD=""  # Will be generated if empty

# App Service SKU (B1 = Basic, P1V2 = Premium for production)
APP_SKU="B1"
DB_SKU="GP_Gen5_2"  # General Purpose, Gen5, 2 vCores

# Generate secure passwords if not provided
if [ -z "$DB_ADMIN_PASSWORD" ]; then
    DB_ADMIN_PASSWORD=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 24)
    echo "Generated DB Password: $DB_ADMIN_PASSWORD"
    echo "⚠️  SAVE THIS PASSWORD SECURELY!"
fi

AUTH_SECRET_KEY=$(openssl rand -base64 32)
echo "Generated Auth Secret Key: $AUTH_SECRET_KEY"
echo "⚠️  SAVE THIS KEY SECURELY!"

# ============================================================================
# STEP 1: Create Azure Resource Group
# ============================================================================
echo ""
echo "============================================================================"
echo "STEP 1: Creating Resource Group"
echo "============================================================================"
az group create --name $RESOURCE_GROUP --location $LOCATION
echo "✅ Resource group created: $RESOURCE_GROUP"

# ============================================================================
# STEP 2: Create PostgreSQL Database
# ============================================================================
echo ""
echo "============================================================================"
echo "STEP 2: Creating PostgreSQL Database"
echo "============================================================================"
az postgres server create \
    --resource-group $RESOURCE_GROUP \
    --name $DB_SERVER_NAME \
    --location $LOCATION \
    --admin-user $DB_ADMIN_USER \
    --admin-password $DB_ADMIN_PASSWORD \
    --sku-name $DB_SKU \
    --version 15

echo "✅ PostgreSQL server created: $DB_SERVER_NAME"

# Create database
az postgres db create \
    --resource-group $RESOURCE_GROUP \
    --server-name $DB_SERVER_NAME \
    --name $DB_NAME

echo "✅ Database created: $DB_NAME"

# Configure firewall to allow Azure services
az postgres server firewall-rule create \
    --resource-group $RESOURCE_GROUP \
    --server-name $DB_SERVER_NAME \
    --name AllowAzureServices \
    --start-ip-address 0.0.0.0 \
    --end-ip-address 0.0.0.0

echo "✅ Firewall configured"

# ============================================================================
# STEP 3: Create App Service Plan
# ============================================================================
echo ""
echo "============================================================================"
echo "STEP 3: Creating App Service Plan"
echo "============================================================================"
az appservice plan create \
    --name $APP_SERVICE_PLAN \
    --resource-group $RESOURCE_GROUP \
    --sku $APP_SKU \
    --is-linux

echo "✅ App Service Plan created: $APP_SERVICE_PLAN"

# ============================================================================
# STEP 4: Create Web App
# ============================================================================
echo ""
echo "============================================================================"
echo "STEP 4: Creating Web App"
echo "============================================================================"
az webapp create \
    --resource-group $RESOURCE_GROUP \
    --plan $APP_SERVICE_PLAN \
    --name $WEBAPP_NAME \
    --runtime "PYTHON|3.11"

echo "✅ Web App created: $WEBAPP_NAME"

# ============================================================================
# STEP 5: Configure Environment Variables
# ============================================================================
echo ""
echo "============================================================================"
echo "STEP 5: Configuring Environment Variables"
echo "============================================================================"

# Construct database URL
DATABASE_URL="postgresql+asyncpg://${DB_ADMIN_USER}@${DB_SERVER_NAME}:${DB_ADMIN_PASSWORD}@${DB_SERVER_NAME}.postgres.database.azure.com:5432/${DB_NAME}?ssl=require"

az webapp config appsettings set \
    --resource-group $RESOURCE_GROUP \
    --name $WEBAPP_NAME \
    --settings \
        DATABASE_URL="$DATABASE_URL" \
        APP_NAME="Secure Renewals API" \
        APP_ENV="production" \
        API_PREFIX="/api" \
        LOG_LEVEL="INFO" \
        AUTH_SECRET_KEY="$AUTH_SECRET_KEY" \
        SESSION_TIMEOUT_HOURS="8" \
        PASSWORD_MIN_LENGTH="8" \
        ALLOWED_ORIGINS="https://${WEBAPP_NAME}.azurewebsites.net" \
        PYTHON_VERSION="3.11" \
        SCM_DO_BUILD_DURING_DEPLOYMENT="true" \
        ENABLE_ORYX_BUILD="true" \
        POST_BUILD_COMMAND="cd frontend && npm install && npm run build && mkdir -p ../backend/static && cp -r dist/* ../backend/static/"

echo "✅ Environment variables configured"

# ============================================================================
# STEP 6: Configure Startup Command
# ============================================================================
echo ""
echo "============================================================================"
echo "STEP 6: Configuring Startup Command"
echo "============================================================================"
az webapp config set \
    --resource-group $RESOURCE_GROUP \
    --name $WEBAPP_NAME \
    --startup-file "cd backend && gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app --bind 0.0.0.0:8000 --timeout 120"

echo "✅ Startup command configured"

# ============================================================================
# STEP 7: Configure GitHub Deployment (Optional)
# ============================================================================
echo ""
echo "============================================================================"
echo "STEP 7: Configuring GitHub Deployment"
echo "============================================================================"
read -p "Configure GitHub continuous deployment? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    az webapp deployment source config \
        --name $WEBAPP_NAME \
        --resource-group $RESOURCE_GROUP \
        --repo-url https://github.com/$GITHUB_REPO \
        --branch $BRANCH \
        --manual-integration
    echo "✅ GitHub deployment configured"
else
    echo "⏭️  Skipping GitHub deployment configuration"
fi

# ============================================================================
# STEP 8: Run Database Migrations
# ============================================================================
echo ""
echo "============================================================================"
echo "STEP 8: Database Migrations"
echo "============================================================================"
echo "To run database migrations, SSH into the app:"
echo ""
echo "    az webapp ssh --resource-group $RESOURCE_GROUP --name $WEBAPP_NAME"
echo "    cd /home/site/wwwroot/backend"
echo "    alembic upgrade head"
echo ""
read -p "Press Enter to continue..."

# ============================================================================
# DEPLOYMENT COMPLETE
# ============================================================================
echo ""
echo "============================================================================"
echo "🎉 DEPLOYMENT COMPLETE!"
echo "============================================================================"
echo ""
echo "Your application is deployed at:"
echo "🌐 https://${WEBAPP_NAME}.azurewebsites.net"
echo ""
echo "API Documentation:"
echo "📚 https://${WEBAPP_NAME}.azurewebsites.net/docs"
echo ""
echo "IMPORTANT - Save these credentials:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Database Server: ${DB_SERVER_NAME}.postgres.database.azure.com"
echo "Database Name: $DB_NAME"
echo "Database User: ${DB_ADMIN_USER}@${DB_SERVER_NAME}"
echo "Database Password: $DB_ADMIN_PASSWORD"
echo "Auth Secret Key: $AUTH_SECRET_KEY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Next Steps:"
echo "1. Run database migrations (see STEP 8 above)"
echo "2. Create admin user in database"
echo "3. Configure custom domain (optional)"
echo "4. Set up SSL certificate (optional)"
echo "5. Configure email SMTP settings in App Settings"
echo ""
echo "Need help? Check: docs/AZURE_DEPLOYMENT_GUIDE.md"
echo "============================================================================"
