# Baynunah HR Portal - Landing Page

## Overview
A secure HR portal landing page for Baynunah Group with admin-restricted access. Features 4 category sections with neumorphism-styled buttons.

## Current State
- **Status**: Production-ready
- **Last Updated**: December 29, 2025
- **Custom Domain**: hr.baynunah.ae (configured separately)

## Features

### Landing Page
- **Header**: Baynunah logo with portal title
- **4 Category Buttons**: 
  - Employees (Staff services & resources)
  - Onboarding (New hire orientation)
  - External Users (Partners & contractors)
  - Admin (HR administration - password protected)

### Menu Design
- 2x2 quadrant grid with rounded corners forming circular shape
- Each quadrant has unique corner radius (top-left, top-right, bottom-left, bottom-right)
- SVG outline icons in fluorescent green (#39FF14)
- Hover animations: letter-spacing expansion, translateY lift, color inversion

### Button Styling (Neumorphism)
- Light gray background (#e8e8e8) with soft shadows
- Inset shadows: `inset 2px 5px 10px rgba(0,0,0,0.2)`
- Hover animations:
  - Letter-spacing expansion (0.2em → 0.5em)
  - TranslateY lift (-0.8em)
  - Background change to dark (#171717)
  - Text color change to white

### Footer
- "Conceptualised by Baynunah|HR|IS"

### Admin Portal
- Password protected access
- Environment variable: `ADMIN_PASSWORD` (default: admin2026)
- Sign out functionality
- Subfolder structure:
  - **Insurance Renewal 2026**
    - Life Insurance
    - Medical Insurance
  - **Employee Submissions** (Reports)
    - View all employee data confirmations/updates
    - Download CSV export for HR processing

### Employee Portal
- Login with Employee ID + Date of Birth
- Validates credentials against Excel data (Renewal_Insurance_1767051010260.xlsx)
- Pass template design with droplet watermark background
- Displays insurance details: Staff Number, Principal Number, Member Number, Package, etc.
- **Data Confirmation Form**: After viewing data, employees can:
  - Confirm displayed information is correct
  - Update Passport Number (if renewed)
  - Update Marital Status
  - Update Visa File Number
  - Add additional notes
- Submissions saved to PostgreSQL database
- Sign out functionality

### Coming Soon Pages
- Onboarding, External Users sections show placeholder
- Back to Home navigation

## Technical Details
- **Framework**: Streamlit
- **Port**: 5000
- **Design**: White neumorphism theme (#e8e8e8 background)
- **Font**: Poppins (Google Fonts)

## Project Structure
```
/
├── app.py                 # Main Streamlit application
├── attached_assets/
│   └── logo_*.png         # Baynunah logo
├── .streamlit/
│   └── config.toml        # Streamlit server configuration
└── replit.md              # This documentation
```

## Running the Application
```bash
streamlit run app.py --server.port 5000
```

## Environment Variables
- `ADMIN_PASSWORD` - Admin portal password (default: admin2026)
