# Medical Insurance Renewal - Employee Verification Portal

## Overview
A secure employee self-service portal for medical insurance renewal verification. Employees authenticate with Staff Number + Date of Birth to review their insurance details and either confirm accuracy OR submit correction requests.

## Current State
- **Status**: Complete and functional
- **Last Updated**: December 26, 2025
- **Policy Year**: 2026
- **Verification Deadline**: January 31, 2026
- **Insurance Provider**: DAMAN

## Design System
- **Font**: Inter (Google Web Font)
- **Primary Accent**: Green (#23c483)
- **Text Colors**: Light gray (#64748b) for values, lighter gray (#94a3b8) for subtitles
- **Background**: Light gradient with frosted glass cards
- **Buttons**: Green with hover animation, Sign Out uses underline animation

## Features

### Layout Sections
1. **Minimal Header** - Company logo, title "Medical Insurance Verification", subtitle "Insured by DAMAN", Policy Year badge, user name/ID
2. **Employee Snapshot** (Read-only) - Employee Number, Name, Job Title, Department
3. **Covered Members** - All members with detailed fields (Gender, DOB, Nationality, Marital Status, Emirates ID, Visa Unified Number, Passport)
4. **Confirmation** - Two-path workflow (Confirm or Update Information)
5. **Update Form** - Two-path data entry:
   - Direct input for missing data (saved immediately)
   - Change requests for existing data (requires admin approval)
6. **Submission Status** - Success messages

### Two-Path Data Entry Workflow
- **Direct Input**: Missing fields (Emirates ID, Passport, Visa, etc.) can be added immediately
- **Change Request**: Modifying existing data requires HR approval
- Validation: Emirates ID format (784-XXXX-XXXXXXX-X), Date of Birth realistic checks

### Admin Portal (Access via ?admin=true)
- **Pending Approvals**: Review and approve/reject change requests
- **Statistics**: Verification completion rates, missing data summary
- **Audit Trail**: Complete log of all data changes
- **Export Reports**: Excel download with completion overview, pending items, missing data

### Security Features
- Session timeout (15 minutes of inactivity)
- Link expiration after deadline date
- Principal's DOB locked (used for authentication)
- Admin portal password protected

## Project Structure
```
/
├── app.py                 # Main Streamlit application
├── models.py              # SQLAlchemy database models
├── attached_assets/
│   ├── Medical_Insurance_Data.csv   # Employee data
│   └── job_data.csv                 # Job titles/departments
├── .streamlit/
│   └── config.toml        # Streamlit server configuration
└── replit.md              # This documentation
```

## Technical Details
- **Framework**: Streamlit
- **Database**: PostgreSQL (for audit trail, change requests)
- **Port**: 5000
- **Data Storage**: CSV for employee data, PostgreSQL for audit/requests
- **Authentication**: Staff Number + Date of Birth validation

## Database Tables
- `audit_trail`: Logs all data changes with timestamps
- `change_requests`: Stores pending change requests for admin review

## Configuration
Located at top of app.py:
- `POLICY_YEAR` - Current policy year (2026)
- `RENEWAL_DEADLINE` - Cutoff date for verification
- `SESSION_TIMEOUT_MINUTES` - Inactivity timeout (15 min)

Environment Variables:
- `ADMIN_PASSWORD` - Admin portal password (default: admin2026)
- `DATABASE_URL` - PostgreSQL connection string

## Sample Staff Numbers for Testing
- BAYN00008 (Mohammad Ismael Sudally) - DOB: 16/05/1988
- BAYN00047 (Alexander Manual Vaz) - DOB: 06/03/1958
- BAYN00002 (Syed Irfan Zakiuddin) - DOB: 11/03/1979
- BAYN00003 (Michael Rutman) - DOB: 21/07/1979

## Running the Application
```bash
streamlit run app.py --server.port 5000
```

## Admin Portal Access
Navigate to the app URL with `?admin=true` parameter:
```
https://your-app-url/?admin=true
```
Login with the ADMIN_PASSWORD and your name.

## Future Enhancements (Not Yet Implemented)
- Email reminder system for incomplete verifications
- SharePoint List integration (writeback)
- Power Automate email trigger for HR notifications
