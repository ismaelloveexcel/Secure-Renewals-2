@echo off
REM ============================================
REM HR Portal Startup Script for Windows
REM ============================================
REM 
REM This script starts the Secure Renewals HR Portal locally.
REM Requirements:
REM   - Python 3.11+ installed
REM   - Node.js 18+ installed
REM   - PostgreSQL running
REM   - Dependencies installed (run once: scripts\install-windows.bat)
REM
REM ============================================

title HR Portal - Secure Renewals

echo ============================================
echo   SECURE RENEWALS HR PORTAL
echo ============================================
echo.

REM Get the script directory
cd /d "%~dp0\.."

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found. Please install Python 3.11+
    echo Download: https://www.python.org/downloads/
    pause
    exit /b 1
)

REM Check if Node.js is available
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found. Please install Node.js 18+
    echo Download: https://nodejs.org/
    pause
    exit /b 1
)

REM Check if UV is available
uv --version >nul 2>&1
if errorlevel 1 (
    echo Installing UV package manager...
    pip install uv
)

echo.
echo Starting services...
echo.

REM Start Backend in new window
echo [1/2] Starting Backend (Port 8000)...
start "HR Portal - Backend" cmd /k "cd backend && uv run uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

REM Wait for backend to initialize
timeout /t 5 /nobreak >nul

REM Start Frontend in new window
echo [2/2] Starting Frontend (Port 5000)...
start "HR Portal - Frontend" cmd /k "cd frontend && npm run dev"

REM Wait for frontend to initialize
timeout /t 5 /nobreak >nul

REM Open browser
echo.
echo Opening browser...
start http://localhost:5000

echo.
echo ============================================
echo   HR PORTAL IS RUNNING
echo ============================================
echo.
echo   Application: http://localhost:5000
echo   API Docs:    http://localhost:8000/docs
echo.
echo   To stop: Close the Backend and Frontend windows
echo.
echo ============================================
echo.
echo Press any key to close this window (app keeps running)...
pause >nul
