# HR Portal User Guide

**For:** Non-Technical HR Users  
**Application:** Secure Renewals HR Portal  
**Last Updated:** December 2024

---

## Welcome! 👋

This guide will help you use the Secure Renewals HR Portal effectively. No technical knowledge is required!

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Navigating the Portal](#navigating-the-portal)
3. [Managing Contract Renewals](#managing-contract-renewals)
4. [Understanding Your Role](#understanding-your-role)
5. [Common Tasks](#common-tasks)
6. [Bulk Employee Imports](#bulk-employee-imports)
7. [Troubleshooting](#troubleshooting)
8. [Getting Help](#getting-help)

---

## Getting Started

### What You'll Need

Before using the portal, make sure you have:

- ✅ A web browser (Chrome, Firefox, Edge, or Safari)
- ✅ Your **Employee ID** (provided by HR)
- ✅ Your **Date of Birth** (for first-time login)

### First-Time Login

1. Open your web browser
2. Go to your company's HR Portal URL (e.g., `https://hr-portal.yourcompany.com`)
3. Enter your **Employee ID**
4. Enter your **Date of Birth** as the temporary password (format: DDMMYYYY)
5. You'll be prompted to **create a new password**
6. Choose a strong password (at least 8 characters, with uppercase, lowercase, and a number)
7. You're now logged in!

### Regular Login

1. Go to the HR Portal URL
2. Enter your **Employee ID**
3. Enter your **password**
4. Click **Login**

> 💡 **Tip:** The portal runs 24/7 on Replit - no need to wait for anyone to start it. Just open the URL and you're ready to go!

### Forgot Password?

1. Click "**Forgot Password**" on the login page
2. Enter your Employee ID
3. Contact HR to reset your password, or check your email for reset instructions

---

## Navigating the Portal

### Main Menu (Left Sidebar)

The portal has five main sections:

| Icon | Section | What It Does |
|------|---------|--------------|
| 🏠 | **Home** | Welcome page with quick access buttons |
| 👥 | **Employees** | Manage contract renewals |
| 📋 | **Onboarding** | New employee onboarding (coming soon) |
| 🌐 | **External Users** | Manage contractors/vendors (coming soon) |
| 🛡️ | **Admin** | System settings and health check |

### Quick Tips

- Click any section name to navigate there
- The current section is highlighted in green
- Your version number is shown at the bottom of the sidebar

---

## Managing Contract Renewals

This is the main feature you'll use. Here's how:

### Viewing All Renewals

1. Click **Employees** in the left sidebar
2. You'll see a table with all contract renewal requests
3. Each row shows:
   - ID number
   - Employee name
   - Contract end date
   - Renewal period (in months)
   - Status (approved/pending)

### Creating a New Renewal Request

1. Click **Employees** in the sidebar
2. Click the green **New Renewal** button (top right)
3. Fill in the form:
   - **Employee Name**: Type the full name
   - **Contract End Date**: Select the date the current contract ends
   - **Renewal Period**: Choose how many months to renew (6, 12, 24, or 36)
4. Click **Create**

> 📝 **Note:** If you're an HR user, your request will be marked as "pending" and needs admin approval. If you're an admin, it's automatically approved.

### Refreshing the List

Click the **Refresh** button to see the latest data.

---

## Understanding Your Role

Different users have different permissions:

| Role | What You Can Do |
|------|-----------------|
| **Viewer** | View renewal requests only |
| **HR** | View renewals + Create new requests (need approval) |
| **Admin** | Full access + Requests are auto-approved |

Your current role is shown in the Admin section under "API Health Check."

---

## Common Tasks

### Task 1: Check Who Needs Contract Renewal This Month

1. Go to **Employees**
2. Look at the **Contract End Date** column
3. Identify employees with dates coming up soon
4. Create renewal requests for them

### Task 2: Create Multiple Renewals

Currently, you need to create one renewal at a time:
1. Create the first renewal
2. After it saves, create the next one
3. Repeat as needed

> 💡 **Tip:** Use the CSV import flow below to add many employees quickly.

### Task 3: Check System Status

1. Go to **Admin**
2. Click **Check API Health**
3. If you see "Status: ok" in green, everything is working!

---

## Bulk Employee Imports

Use this when onboarding many employees at once.

1. Prepare a CSV file with the header row: `employee_id,name,email,department,date_of_birth,role`
2. Fill in each row. Date of birth must be `DDMMYYYY` or ISO format (YYYY-MM-DD). Roles must be `admin`, `hr`, or `viewer`.
3. In the portal, go to **Admin → Employee Import** and upload the CSV.
4. Review the import summary:
   - **Created**: employees added successfully
   - **Skipped**: employees already existed
   - **Errors**: rows missing required fields or using unsupported roles
5. Download the error report, fix the flagged rows, and re-upload the corrected file.

---

## Troubleshooting

### "Login failed" or "Invalid credentials"

**Problem:** Your Employee ID or password is incorrect  
**Solution:** 
1. Check that you entered the correct Employee ID
2. For first-time login, use your date of birth in DDMMYYYY format
3. Make sure Caps Lock is not on
4. If you forgot your password, ask HR admin to reset it

### "Request failed" or Red Error Message

**Problem:** Something went wrong  
**Solution:**
1. Check your internet connection
2. Try clicking **Refresh**
3. Try logging out and logging back in
4. If it persists, contact IT support

### "Insufficient role" Error

**Problem:** You're trying to do something your role doesn't allow  
**Solution:** 
- Viewers can't create renewals
- Contact your admin if you need different permissions

### The Page Looks Broken

**Problem:** Display issues  
**Solution:**
1. Refresh the page (Ctrl+R or Cmd+R)
2. Clear your browser cache
3. Try a different browser

---

## Getting Help

### Quick Help

- **Technical Issues:** Contact your IT department
- **Access Problems:** Ask your HR admin or manager
- **Feature Requests:** Submit to IT or project owner

### Important Contacts

| Issue Type | Contact |
|------------|---------|
| Can't log in | IT Help Desk |
| Need access | Your Manager |
| Bug/Error | IT Support |
| Training | HR Manager |

---

## Tips for Success 🌟

1. **Check renewals weekly** - Don't let contracts expire
2. **Use clear names** - Type employee names exactly as in official records
3. **Verify dates** - Double-check contract end dates before submitting
4. **Refresh regularly** - Click Refresh to see the latest updates
5. **Use a strong password** - Minimum 8 characters with uppercase, lowercase, and a number

---

## Quick Reference Card

### Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Refresh page | Ctrl+R (or Cmd+R on Mac) |
| Go back | Backspace or Browser back button |

### Status Colors

| Color | Meaning |
|-------|---------|
| 🟢 Green | Approved / OK |
| 🟡 Yellow | Pending / Warning |
| 🔴 Red | Error / Attention needed |
| ⚪ Gray | Not applicable |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Dec 2024 | Initial release |

---

*Thank you for using Secure Renewals HR Portal!*
