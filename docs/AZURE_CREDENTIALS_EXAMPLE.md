# Azure Credentials JSON Format

This document provides the exact format of the Azure credentials JSON needed for the `AZURE_CREDENTIALS` GitHub Secret.

---

## How to Generate Azure Credentials

Run this command in Azure CLI:

```bash
az ad sp create-for-rbac \
  --name "github-actions-secure-renewals" \
  --role contributor \
  --scopes /subscriptions/{subscription-id}/resourceGroups/{resource-group} \
  --sdk-auth
```

**Replace:**
- `{subscription-id}` - Your Azure subscription ID
- `{resource-group}` - Your resource group name (e.g., `secure-renewals-rg`)

---

## Example JSON Output

The command will output JSON in this format:

```json
{
  "clientId": "12345678-1234-1234-1234-123456789abc",
  "clientSecret": "your-client-secret-here-abc123~def456",
  "subscriptionId": "87654321-4321-4321-4321-abcdef123456",
  "tenantId": "abcdefab-abcd-abcd-abcd-abcdefabcdef",
  "activeDirectoryEndpointUrl": "https://login.microsoftonline.com",
  "resourceManagerEndpointUrl": "https://management.azure.com/",
  "activeDirectoryGraphResourceId": "https://graph.windows.net/",
  "sqlManagementEndpointUrl": "https://management.core.windows.net:8443/",
  "galleryEndpointUrl": "https://gallery.azure.com/",
  "managementEndpointUrl": "https://management.core.windows.net/"
}
```

---

## Field Descriptions

| Field | Description | Example |
|-------|-------------|---------|
| `clientId` | Application (client) ID of the service principal | `12345678-1234-1234-1234-123456789abc` |
| `clientSecret` | Client secret/password for authentication | `your-secret~abc123` |
| `subscriptionId` | Your Azure subscription ID | `87654321-4321-4321-4321-abcdef123456` |
| `tenantId` | Azure AD tenant ID | `abcdefab-abcd-abcd-abcd-abcdefabcdef` |
| `activeDirectoryEndpointUrl` | Azure AD login endpoint | `https://login.microsoftonline.com` |
| `resourceManagerEndpointUrl` | Azure Resource Manager endpoint | `https://management.azure.com/` |

---

## Step-by-Step: Getting Your Azure Credentials

### Step 1: Login to Azure CLI

```bash
az login
```

This will open a browser for authentication.

### Step 2: Get Your Subscription ID

```bash
az account show --query id -o tsv
```

This outputs your subscription ID. Copy it.

### Step 3: Create Service Principal

```bash
# Replace the placeholders:
# - {your-subscription-id} with the ID from step 2
# - {your-resource-group} with your resource group name

az ad sp create-for-rbac \
  --name "github-actions-secure-renewals" \
  --role contributor \
  --scopes /subscriptions/{your-subscription-id}/resourceGroups/{your-resource-group} \
  --sdk-auth
```

**Example with real values:**
```bash
az ad sp create-for-rbac \
  --name "github-actions-secure-renewals" \
  --role contributor \
  --scopes /subscriptions/87654321-4321-4321-4321-abcdef123456/resourceGroups/secure-renewals-rg \
  --sdk-auth
```

### Step 4: Copy the JSON Output

The command will output JSON similar to this:

```json
{
  "clientId": "a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6",
  "clientSecret": "SuperSecretPassword123~xyz789",
  "subscriptionId": "87654321-4321-4321-4321-abcdef123456",
  "tenantId": "t1e2n3a4-n5t6-i7d8-h9e0-r1e2i3s4n5o6",
  "activeDirectoryEndpointUrl": "https://login.microsoftonline.com",
  "resourceManagerEndpointUrl": "https://management.azure.com/",
  "activeDirectoryGraphResourceId": "https://graph.windows.net/",
  "sqlManagementEndpointUrl": "https://management.core.windows.net:8443/",
  "galleryEndpointUrl": "https://gallery.azure.com/",
  "managementEndpointUrl": "https://management.core.windows.net/"
}
```

**⚠️ IMPORTANT:** Copy the **entire JSON output** including the curly braces `{ }`.

---

## Adding to GitHub Secrets

### Method 1: GitHub Web UI

1. Go to your repository on GitHub
2. Click **Settings** tab
3. Click **Secrets and variables** → **Actions** in the left sidebar
4. Click **New repository secret**
5. Enter:
   - **Name:** `AZURE_CREDENTIALS`
   - **Value:** Paste the entire JSON (including `{ }`)
6. Click **Add secret**

### Method 2: GitHub CLI

```bash
# Save the JSON to a file first
az ad sp create-for-rbac \
  --name "github-actions-secure-renewals" \
  --role contributor \
  --scopes /subscriptions/{subscription-id}/resourceGroups/{resource-group} \
  --sdk-auth > azure-credentials.json

# Add to GitHub secrets
gh secret set AZURE_CREDENTIALS < azure-credentials.json

# Delete the file (security best practice)
rm azure-credentials.json
```

---

## Verification

After adding the secret, verify it's configured:

1. Go to **Repository → Settings → Secrets and variables → Actions**
2. You should see `AZURE_CREDENTIALS` listed
3. The value will be hidden (shows as `***`)

---

## Troubleshooting

### Issue: "Invalid JSON format"

**Problem:** GitHub says the JSON is invalid.

**Solution:** 
- Ensure you copied the entire JSON including opening `{` and closing `}`
- Check there are no extra characters before or after the JSON
- Verify no line breaks were added accidentally

### Issue: "Authentication failed"

**Problem:** Workflow fails with authentication error.

**Solution:**
```bash
# Test the credentials manually
az login --service-principal \
  -u <clientId> \
  -p <clientSecret> \
  --tenant <tenantId>

# If this fails, regenerate the service principal
az ad sp delete --id <clientId>

# Create new one
az ad sp create-for-rbac \
  --name "github-actions-secure-renewals-new" \
  --role contributor \
  --scopes /subscriptions/{sub-id}/resourceGroups/{rg} \
  --sdk-auth
```

### Issue: "Insufficient permissions"

**Problem:** Service principal cannot access resources.

**Solution:** Grant proper role:
```bash
# Grant contributor role on resource group
az role assignment create \
  --assignee <clientId> \
  --role Contributor \
  --scope /subscriptions/{subscription-id}/resourceGroups/{resource-group}
```

---

## Security Best Practices

1. **Never commit credentials to code** - Always use GitHub Secrets
2. **Rotate credentials regularly** - Create new service principal every 90 days
3. **Use minimum permissions** - Grant only "Contributor" on specific resource group, not subscription
4. **Delete local copies** - Remove any files containing credentials after adding to GitHub
5. **Monitor usage** - Check Azure AD sign-in logs for the service principal

---

## Complete Example Walkthrough

Here's a complete example with real commands (you'll need to replace the IDs with yours):

```bash
# 1. Login
az login

# 2. Get subscription ID
SUBSCRIPTION_ID=$(az account show --query id -o tsv)
echo "Subscription ID: $SUBSCRIPTION_ID"

# 3. Set your resource group name
RESOURCE_GROUP="secure-renewals-rg"

# 4. Create service principal and save output
az ad sp create-for-rbac \
  --name "github-actions-secure-renewals" \
  --role contributor \
  --scopes /subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP \
  --sdk-auth

# Output will look like:
# {
#   "clientId": "...",
#   "clientSecret": "...",
#   ...
# }

# 5. Copy the entire JSON output (including { })
# 6. Go to GitHub → Repository → Settings → Secrets → New secret
# 7. Name: AZURE_CREDENTIALS
# 8. Value: Paste the JSON
# 9. Click "Add secret"
```

---

## Other Required Secrets

In addition to `AZURE_CREDENTIALS`, you also need:

```bash
# Get subscription ID
az account show --query id -o tsv

# Get resource group (you know this already)
# Example: secure-renewals-rg

# Get webapp name (you know this already)
# Example: secure-renewals-app
```

Add these to GitHub Secrets:
- `AZURE_SUBSCRIPTION_ID` - From command above
- `AZURE_RESOURCE_GROUP` - Your resource group name
- `AZURE_WEBAPP_NAME` - Your app service name

---

## Quick Reference

| Secret Name | How to Get It |
|------------|---------------|
| `AZURE_CREDENTIALS` | `az ad sp create-for-rbac --sdk-auth` (entire JSON output) |
| `AZURE_SUBSCRIPTION_ID` | `az account show --query id -o tsv` |
| `AZURE_RESOURCE_GROUP` | Your resource group name (e.g., `secure-renewals-rg`) |
| `AZURE_WEBAPP_NAME` | Your app service name (e.g., `secure-renewals-app`) |

---

## Need Help?

- **Main Guide:** [Azure Debugging Guide](AZURE_DEBUGGING_GUIDE.md)
- **Quick Start:** [Using Azure Debug Workflow](USING_AZURE_DEBUG_WORKFLOW.md)
- **FAQ:** [Azure Debugging FAQ](AZURE_DEBUGGING_FAQ.md)
- **Complete Solution:** [Azure Debugging Complete Solution](AZURE_DEBUGGING_COMPLETE_SOLUTION.md)

---

**Ready to use the workflow?** Once you've added all secrets, go to **Actions → Azure Debug & Diagnostics → Run workflow**!
