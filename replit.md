# Employee Benefits Portal - Medical Insurance Verification

## Overview
A secure employee self-service portal for medical insurance data verification. Employees can log in using their Staff Number and Date of Birth to view and update their personal information and that of their dependents before insurance renewal.

## Current State
- **Status**: Complete and functional
- **Last Updated**: December 24, 2025

## Features
1. **Secure Login** - Two-factor authentication using Staff Number + Date of Birth (DD/MM/YYYY)
2. **Data Display** - Shows employee and all dependents (spouse, children)
3. **Edit Capability** - Inline editing for all fields, with missing fields highlighted
4. **Protected Fields** - Principal's Date of Birth is locked (used for authentication)
5. **Confirmation System** - Employees can confirm their data is correct
6. **Microsoft-style Branding** - Professional blue theme, hidden Streamlit elements
7. **HR Support** - WhatsApp contact button for HR assistance

## Project Structure
```
/
├── app.py                 # Main Streamlit application
├── attached_assets/
│   └── Medical_Insurance_-_Workings_*.csv  # Employee data
├── .streamlit/
│   └── config.toml        # Streamlit server configuration
└── replit.md              # This documentation
```

## Technical Details
- **Framework**: Streamlit
- **Port**: 5000
- **Data Storage**: CSV file (updates saved to same file)
- **Authentication**: Staff Number + Date of Birth validation

## Key Fields Tracked
- Personal info (name, gender, DOB, nationality, marital status)
- ID documents (Emirates ID, National ID, Passport)
- Visa information (Visa Unified Number, File Number, Place of issuance)
- Birth Certificate Number

## Running the Application
```bash
streamlit run app.py --server.port 5000
```

## Sample Staff Numbers for Testing
- BAYN00047 (Alexander Manual Vaz) - DOB: 02/06/1958
- BAYN00014 (Mahmoud Saeed Mohamed) - DOB: 31/12/1979
- BAYN00038 (Shafeeqe Vakkayil) - DOB: 04/10/1989
