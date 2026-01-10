#!/bin/bash
# ============================================
# HR Portal First-Time Installation Script
# ============================================
#
# This script automates the complete setup of the HR Portal:
#   1. Checks prerequisites
#   2. Installs dependencies
#   3. Configures environment
#   4. Sets up database
#   5. Optionally enables auto-start
#
# Usage: ./scripts/install.sh
#
# ============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "============================================"
echo "  HR PORTAL - FIRST TIME INSTALLATION"
echo "============================================"
echo ""
echo "Project Directory: $PROJECT_DIR"
echo ""
echo "This script will set up the HR Portal on your computer."
echo ""
read -p "Press Enter to continue..."

echo ""
echo "============================================"
echo "  STEP 1: Checking Prerequisites"
echo "============================================"
echo ""

# Check Python
if command -v python3 &> /dev/null; then
    echo -e "${GREEN}[OK]${NC} Python found"
    python3 --version
else
    echo -e "${RED}[X] Python NOT FOUND${NC}"
    echo "    Please install Python 3.11+ from https://www.python.org/downloads/"
    exit 1
fi

# Check Node.js
if command -v node &> /dev/null; then
    echo -e "${GREEN}[OK]${NC} Node.js found"
    node --version
else
    echo -e "${RED}[X] Node.js NOT FOUND${NC}"
    echo "    Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    echo -e "${GREEN}[OK]${NC} npm found"
    npm --version
else
    echo -e "${RED}[X] npm NOT FOUND${NC}"
    echo "    npm should come with Node.js. Please reinstall Node.js."
    exit 1
fi

echo ""
echo -e "${GREEN}All prerequisites are installed!${NC}"
echo ""

echo "============================================"
echo "  STEP 2: Installing UV Package Manager"
echo "============================================"
echo ""

if command -v uv &> /dev/null; then
    echo -e "${GREEN}[OK]${NC} UV already installed"
    uv --version
else
    echo "Installing UV..."
    pip3 install uv
    echo -e "${GREEN}[OK]${NC} UV installed"
fi

echo ""
echo "============================================"
echo "  STEP 3: Installing Backend Dependencies"
echo "============================================"
echo ""

cd "$PROJECT_DIR/backend"
echo "Installing Python dependencies..."
uv sync
echo -e "${GREEN}[OK]${NC} Backend dependencies installed"

echo ""
echo "============================================"
echo "  STEP 4: Installing Frontend Dependencies"
echo "============================================"
echo ""

cd "$PROJECT_DIR/frontend"
echo "Installing Node.js dependencies..."
npm install
echo -e "${GREEN}[OK]${NC} Frontend dependencies installed"

echo ""
echo "============================================"
echo "  STEP 5: Configuring Environment"
echo "============================================"
echo ""

cd "$PROJECT_DIR/backend"
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        echo "Creating .env from template..."
        cp ".env.example" ".env"
        echo -e "${GREEN}[OK]${NC} Backend .env created"
        echo ""
        echo -e "${YELLOW}IMPORTANT: Edit backend/.env with your database settings${NC}"
    else
        echo -e "${YELLOW}[!]${NC} No .env.example found - creating minimal .env"
        echo "DATABASE_URL=sqlite:///./hr_portal.db" > .env
        echo "DEV_MODE=true" >> .env
        echo -e "${GREEN}[OK]${NC} Created minimal .env with SQLite (for testing)"
    fi
else
    echo -e "${GREEN}[OK]${NC} Backend .env already exists"
fi

cd "$PROJECT_DIR/frontend"
if [ ! -f ".env" ]; then
    echo "Creating frontend .env..."
    echo "VITE_API_BASE_URL=http://localhost:8000/api" > .env
    echo -e "${GREEN}[OK]${NC} Frontend .env created"
else
    echo -e "${GREEN}[OK]${NC} Frontend .env already exists"
fi

echo ""
echo "============================================"
echo "  STEP 6: Database Setup"
echo "============================================"
echo ""

cd "$PROJECT_DIR/backend"
echo "Running database migrations..."
if uv run alembic upgrade head; then
    echo -e "${GREEN}[OK]${NC} Database migrations complete"
else
    echo -e "${YELLOW}[!]${NC} Database migration had issues (this may be OK for first run)"
fi

echo ""
echo "============================================"
echo "  STEP 7: Auto-Start Configuration"
echo "============================================"
echo ""

# Detect OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    read -p "Would you like the HR Portal to start automatically when you log in? (y/n): " autostart
    if [[ "$autostart" =~ ^[Yy]$ ]]; then
        chmod +x "$SCRIPT_DIR/setup-autostart-macos.sh"
        "$SCRIPT_DIR/setup-autostart-macos.sh" enable
    else
        echo "Skipping auto-start setup."
        echo "You can enable it later by running: ./scripts/setup-autostart-macos.sh"
    fi
else
    # Linux
    echo "Auto-start on Linux varies by distribution."
    echo "You can add the start script to your startup applications manually:"
    echo "  $SCRIPT_DIR/start-portal.sh"
fi

echo ""
echo "============================================"
echo "  INSTALLATION COMPLETE!"
echo "============================================"
echo ""
echo "Your HR Portal is now installed and ready to use."
echo ""
echo "To start the portal manually:"
echo "  ./scripts/start-portal.sh"
echo ""
echo "Access URLs:"
echo "  Application: http://localhost:5000"
echo "  API Docs:    http://localhost:8000/docs"
echo ""

read -p "Would you like to start the HR Portal now? (y/n): " startnow
if [[ "$startnow" =~ ^[Yy]$ ]]; then
    chmod +x "$SCRIPT_DIR/start-portal.sh"
    "$SCRIPT_DIR/start-portal.sh"
fi

echo ""
echo "Thank you for installing the HR Portal!"
echo ""
