# Baynunah HR Portal - Landing Page

## Overview
A clean HR portal landing page for Baynunah Group featuring a circular 2x2 quadrant menu with glassmorphism/liquid glass styling. Built with React + TypeScript, served through Streamlit.

## Current State
- **Status**: Landing Page Complete
- **Last Updated**: December 30, 2025
- **Custom Domain**: hr.baynunah.ae (configured separately)

## Architecture
- **Frontend**: React 18 + TypeScript + Tailwind CSS v4
- **Build Tool**: Vite with vite-plugin-singlefile (inlines all JS/CSS)
- **Serving**: Streamlit wrapper serves the pre-built HTML via st.components.v1.html()
- **Port**: 5000 (Streamlit)

## Features

### Landing Page
- **Header**: Baynunah logo with portal title
- **4 Category Buttons**: 
  - Employees (Coming Soon)
  - Onboarding (Coming Soon)
  - External Users (Coming Soon)
  - Admin (Coming Soon)

### Menu Design
- 2x2 quadrant grid with rounded corners forming circular shape
- Each quadrant has unique corner radius (top-left, top-right, bottom-left, bottom-right)
- 160px quarter-circle buttons with glassmorphism/liquid glass effect
- SVG outline icons in fluorescent green (#39FF14)
- Hover animations using React state + inline styles

### Button Styling (Glassmorphism)
- Light gray background (#e8e8e8) with soft shadows
- Backdrop-filter blur with semi-transparent gradients
- Multi-layer shadows for depth
- Hover animations:
  - TranslateY lift (-0.8em)
  - Background change to dark (#171717)
  - Text and icon color change to white

### Footer
- "Conceptualised by Baynunah|HR|IS"

## Technical Details
- **Frontend Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS v4 with @tailwindcss/postcss
- **Build Tool**: Vite with vite-plugin-singlefile
- **Design**: Glassmorphism theme with dotted grid background
- **Font**: Poppins (Google Fonts)

## Project Structure
```
/
├── app.py                    # Streamlit wrapper (serves pre-built HTML)
├── client/
│   ├── src/
│   │   ├── App.tsx           # Main React component with landing page
│   │   ├── index.css         # Tailwind imports + custom styles
│   │   └── main.tsx          # React entry point
│   └── index.html            # HTML template
├── dist/
│   └── index.html            # Built single-file app (JS/CSS inlined)
├── attached_assets/
│   └── logo_*.png            # Baynunah logo
├── vite.config.js            # Vite config with singlefile plugin
├── postcss.config.js         # PostCSS config
└── replit.md                 # This documentation
```

## Running the Application
```bash
streamlit run app.py --server.port 5000
```

## Rebuilding the React App
If you make changes to the React code:
```bash
npx vite build
```
This regenerates `dist/index.html` with all JS/CSS inlined.

## Customization Notes
This is a clean landing page template. To add functionality:
1. **Employees Section**: Add employee data source and login
2. **Onboarding Section**: Add onboarding workflow content
3. **External Users**: Add partner/contractor portal features
4. **Admin Portal**: Add password protection and admin features

After making React changes, remember to run `npx vite build` to rebuild.
