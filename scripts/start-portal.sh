#!/bin/bash
# ============================================
# HR Portal Startup Script for macOS/Linux
# ============================================
#
# This script starts the Secure Renewals HR Portal locally.
# Requirements:
#   - Python 3.11+ installed
#   - Node.js 18+ installed
#   - PostgreSQL running
#   - Dependencies installed (run once: ./scripts/install-deps.sh)
#
# Usage: ./scripts/start-portal.sh
# ============================================

set -e

echo "============================================"
echo "  SECURE RENEWALS HR PORTAL"
echo "============================================"
echo ""

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python 3 not found. Please install Python 3.11+"
    echo "Download: https://www.python.org/downloads/"
    exit 1
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js not found. Please install Node.js 18+"
    echo "Download: https://nodejs.org/"
    exit 1
fi

# Check/install UV
if ! command -v uv &> /dev/null; then
    echo "Installing UV package manager..."
    pip3 install uv
fi

echo ""
echo "Starting services..."
echo ""

# Create a cleanup function
cleanup() {
    echo ""
    echo "Shutting down HR Portal..."
    # Kill background processes
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    echo "Shutdown complete."
    exit 0
}

trap cleanup SIGINT SIGTERM

# Configure backend reload mode (default: no reload)
# Set DEV_MODE=1 in the environment to enable uvicorn --reload.
RELOAD_FLAG=""
if [ "${DEV_MODE:-}" = "1" ]; then
    RELOAD_FLAG="--reload"
fi

# Start Backend
echo "[1/2] Starting Backend (Port 8000)..."
cd "$PROJECT_DIR/backend"
uv run uvicorn app.main:app --host 127.0.0.1 --port 8000 $RELOAD_FLAG &
BACKEND_PID=$!

# Wait for backend
sleep 3

# Start Frontend
echo "[2/2] Starting Frontend (Port 5000)..."
cd "$PROJECT_DIR/frontend"
npm run dev &
FRONTEND_PID=$!

# Wait for frontend
sleep 3

echo ""
echo "============================================"
echo "  HR PORTAL IS RUNNING"
echo "============================================"
echo ""
echo "  Application: http://localhost:5000"
echo "  API Docs:    http://localhost:8000/docs"
echo ""
echo "  Press Ctrl+C to stop all services"
echo ""
echo "============================================"

# Open browser (works on macOS and some Linux)
if command -v open &> /dev/null; then
    open http://localhost:5000
elif command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:5000
fi

# Wait for processes
wait
