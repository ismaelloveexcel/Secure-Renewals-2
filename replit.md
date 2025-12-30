# Baynunah HR Portal - Landing Page Template

## Overview
A clean HR portal landing page template for Baynunah Group with admin-restricted access. Features 4 category sections with glassmorphism/liquid glass styling and a circular 2x2 quadrant menu.

## Current State
- **Status**: Clean Template (ready for customization)
- **Last Updated**: December 30, 2025
- **Custom Domain**: hr.baynunah.ae (configured separately)

## Features

### Landing Page
- **Header**: Baynunah logo with portal title
- **4 Category Buttons**: 
  - Employees (Coming Soon)
  - Onboarding (Coming Soon)
  - External Users (Coming Soon)
  - Admin (Password protected)

### Menu Design
- 2x2 quadrant grid with rounded corners forming circular shape
- Each quadrant has unique corner radius (top-left, top-right, bottom-left, bottom-right)
- 160px quarter-circle buttons with glassmorphism/liquid glass effect
- SVG outline icons in fluorescent green (#39FF14)
- Hover animations: letter-spacing expansion, translateY lift, color inversion
- Dotted grid background pattern

### Button Styling (Glassmorphism)
- Light gray background (#e8e8e8) with soft shadows
- Backdrop-filter blur with semi-transparent gradients
- Multi-layer shadows for depth
- Hover animations:
  - Letter-spacing expansion (0.2em → 0.5em)
  - TranslateY lift (-0.8em)
  - Background change to dark (#171717)
  - Text color change to white

### Footer
- "Conceptualised by Baynunah|HR|IS"

### Admin Portal
- Password protected access
- Dark blue modal-style login (#00065f background, #9c9a9a border)
- Environment variable: `ADMIN_PASSWORD`
- Sign out functionality
- Subfolder structure:
  - **Insurance Renewal 2026**
    - Life Insurance (Coming Soon)
    - Medical Insurance (Coming Soon)

### Coming Soon Pages
- Employees, Onboarding, External Users sections show placeholder
- Back to Home navigation

## Technical Details
- **Framework**: Streamlit
- **Port**: 5000
- **Design**: Glassmorphism theme with dotted grid background
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
- `ADMIN_PASSWORD` - Admin portal password (required for admin access)

## Customization Notes
This is a clean template. To add functionality:
1. **Employees Section**: Add employee data source and login validation
2. **Onboarding Section**: Add onboarding workflow content
3. **External Users**: Add partner/contractor portal features
4. **Admin Reports**: Connect to database for data management
