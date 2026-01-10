# Azure Deployment Quick Start

**Goal**: Deploy the Secure Renewals HR Portal to Microsoft Azure in under 20 minutes.

## Prerequisites (5 minutes)

1. **Azure Account**: Sign up at https://azure.microsoft.com/free if you don't have one
2. **Open Azure Cloud Shell**: https://shell.azure.com (select Bash)

That's it! No local installation needed.

---

## Deployment (15 minutes)

### Step 1: Clone Repository (1 minute)

```bash
git clone https://github.com/ismaelloveexcel/Secure-Renewals-2.git
cd Secure-Renewals-2
```

### Step 2: Configure (2 minutes)

Edit the deployment script (optional - defaults work fine):

```bash
nano deploy_to_azure.sh
```

**Only change if needed:**
- `WEBAPP_NAME` - Must be globally unique (default: secure-renewals-app)
- `LOCATION` - Azure region (default: eastus)

Press `Ctrl+X`, then `Y`, then `Enter` to save.

### Step 3: Deploy (10 minutes)

```bash
chmod +x deploy_to_azure.sh
./deploy_to_azure.sh
```

**What happens:**
- Creates Azure resources (database, app service)
- Generates secure passwords automatically
- Configures everything for you
- Shows you the credentials to save

**⚠️ IMPORTANT**: When the script finishes, it will show:
```
Database Password: [SAVE THIS]
Auth Secret Key: [SAVE THIS]
```

**Save these credentials in a secure place!**

### Step 4: Database Setup (2 minutes)

SSH into your app:
```bash
az webapp ssh --resource-group secure-renewals-rg --name secure-renewals-app
```

Run migrations:
```bash
cd /home/site/wwwroot/backend
alembic upgrade head
exit
```

---

## Verification (2 minutes)

1. **Open your app**: `https://secure-renewals-app.azurewebsites.net`
2. **Check API**: `https://secure-renewals-app.azurewebsites.net/docs`
3. **You should see**: The login page

---

## Create First Admin User (3 minutes)

### Option A: Using Azure Portal Query Editor

1. Go to Azure Portal → PostgreSQL Server → Query Editor
2. Login with database credentials from Step 3
3. Run:
```sql
INSERT INTO employees (
    employee_id, 
    full_name, 
    email, 
    role, 
    date_of_birth,
    hashed_password
) VALUES (
    'ADMIN001',
    'System Admin',
    'admin@company.com',
    'admin',
    '19900101',
    '$2b$12$dummy'  -- Will change on first login
);
```

### Option B: Using psql (if installed)

```bash
psql "host=secure-renewals-db-server.postgres.database.azure.com port=5432 dbname=secure_renewals user=dbadmin@secure-renewals-db-server password=[PASSWORD] sslmode=require"

# Then run the INSERT statement above
```

---

## First Login (1 minute)

1. Go to: `https://secure-renewals-app.azurewebsites.net`
2. Login with:
   - **Employee ID**: `ADMIN001`
   - **Password**: `19900101` (date of birth)
3. You'll be prompted to create a new password
4. Done! 🎉

---

## Next Steps

### Essential Configuration (10 minutes)

Configure email for notifications:

1. Go to: Azure Portal → App Service → Configuration
2. Add these settings:
   ```
   SMTP_HOST=smtp.office365.com
   SMTP_PORT=587
   SMTP_USER=hr@company.com
   SMTP_PASSWORD=[your-email-password]
   SMTP_FROM_EMAIL=hr@company.com
   ```
3. Click **Save**
4. Restart the app

### Optional Enhancements

- **Custom Domain**: [See guide](AZURE_DEPLOYMENT_GUIDE.md#configure-custom-domain)
- **SSL Certificate**: [See guide](AZURE_DEPLOYMENT_GUIDE.md#configure-custom-domain)
- **Monitoring**: [See guide](AZURE_DEPLOYMENT_GUIDE.md#monitoring-and-maintenance)
- **Auto-scaling**: [See guide](AZURE_DEPLOYMENT_GUIDE.md#cost-optimization)

---

## Cost Estimate

**Development/Testing** (B1 tier):
- App Service: ~$13/month
- Database: ~$25/month
- **Total**: ~$40/month

**Production** (P1V2 tier):
- App Service: ~$75/month
- Database: ~$100/month
- **Total**: ~$175/month

---

## Troubleshooting

### App won't start?
```bash
# Check logs
az webapp log tail --name secure-renewals-app --resource-group secure-renewals-rg

# Restart app
az webapp restart --name secure-renewals-app --resource-group secure-renewals-rg
```

### Database connection failed?
- Check firewall rules in Azure Portal
- Verify DATABASE_URL format includes `?ssl=require`

### Frontend not loading?
```bash
# SSH and check static files
az webapp ssh --resource-group secure-renewals-rg --name secure-renewals-app
ls -la /home/site/wwwroot/backend/static/
```

**More help**: [Full troubleshooting guide](AZURE_DEPLOYMENT_GUIDE.md#troubleshooting)

---

## Support

- **Azure issues**: Azure Support Portal
- **Application issues**: GitHub Issues
- **Detailed guide**: [docs/AZURE_DEPLOYMENT_GUIDE.md](AZURE_DEPLOYMENT_GUIDE.md)

---

**Total Time**: ~35 minutes from start to first login

**Questions?** Check the [full deployment guide](AZURE_DEPLOYMENT_GUIDE.md) for detailed instructions.
