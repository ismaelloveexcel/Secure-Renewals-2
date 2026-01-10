@echo off
REM ============================================
REM HR Portal First-Time Installation Script
REM ============================================
REM 
REM This script automates the complete setup of the HR Portal:
REM   1. Checks prerequisites
REM   2. Installs dependencies
REM   3. Configures environment
REM   4. Sets up database
REM   5. Optionally enables auto-start
REM
REM ============================================

title HR Portal - First Time Setup

echo ============================================
echo   HR PORTAL - FIRST TIME INSTALLATION
echo ============================================
echo.

REM Get the script directory
cd /d "%~dp0\.."
set PROJECT_DIR=%cd%

echo Project Directory: %PROJECT_DIR%
echo.
echo This script will set up the HR Portal on your computer.
echo.
pause

echo.
echo ============================================
echo   STEP 1: Checking Prerequisites
echo ============================================
echo.

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [X] Python NOT FOUND
    echo     Please install Python 3.11+ from https://www.python.org/downloads/
    echo     Make sure to check "Add Python to PATH" during installation.
    pause
    exit /b 1
) else (
    echo [OK] Python found
    python --version
)

REM Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo [X] Node.js NOT FOUND
    echo     Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
) else (
    echo [OK] Node.js found
    node --version
)

REM Check npm
npm --version >nul 2>&1
if errorlevel 1 (
    echo [X] npm NOT FOUND
    echo     npm should come with Node.js. Please reinstall Node.js.
    pause
    exit /b 1
) else (
    echo [OK] npm found
    npm --version
)

echo.
echo All prerequisites are installed!
echo.

echo ============================================
echo   STEP 2: Installing UV Package Manager
echo ============================================
echo.

uv --version >nul 2>&1
if errorlevel 1 (
    echo Installing UV...
    pip install uv
    echo [OK] UV installed
) else (
    echo [OK] UV already installed
    uv --version
)

echo.
echo ============================================
echo   STEP 3: Installing Backend Dependencies
echo ============================================
echo.

cd "%PROJECT_DIR%\backend"
echo Installing Python dependencies...
uv sync
if errorlevel 1 (
    echo [X] Failed to install backend dependencies
    pause
    exit /b 1
)
echo [OK] Backend dependencies installed

echo.
echo ============================================
echo   STEP 4: Installing Frontend Dependencies
echo ============================================
echo.

cd "%PROJECT_DIR%\frontend"
echo Installing Node.js dependencies...
call npm install
if errorlevel 1 (
    echo [X] Failed to install frontend dependencies
    pause
    exit /b 1
)
echo [OK] Frontend dependencies installed

echo.
echo ============================================
echo   STEP 5: Configuring Environment
echo ============================================
echo.

cd "%PROJECT_DIR%\backend"
if not exist ".env" (
    if exist ".env.example" (
        echo Creating .env from template...
        copy ".env.example" ".env"
        echo [OK] Backend .env created
        echo.
        echo IMPORTANT: Edit backend\.env with your database settings
    ) else (
        echo [!] No .env.example found - creating minimal PostgreSQL .env
        echo DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/DATABASE_NAME > .env
        echo DEV_MODE=true >> .env
        echo [OK] Created minimal .env for PostgreSQL - please edit with your settings
        echo IMPORTANT: Edit backend\.env with your PostgreSQL database settings
    )
) else (
    echo [OK] Backend .env already exists
)

cd "%PROJECT_DIR%\frontend"
if not exist ".env" (
    echo Creating frontend .env...
    echo VITE_API_BASE_URL=http://localhost:8000/api > .env
    echo [OK] Frontend .env created
) else (
    echo [OK] Frontend .env already exists
)

echo.
echo ============================================
echo   STEP 6: Database Setup
echo ============================================
echo.

cd "%PROJECT_DIR%\backend"
echo Running database migrations...
uv run alembic upgrade head
if errorlevel 1 (
    echo [!] Database migration had issues (this may be OK for first run)
) else (
    echo [OK] Database migrations complete
)

echo.
echo ============================================
echo   STEP 7: Auto-Start Configuration
echo ============================================
echo.

set /p autostart="Would you like the HR Portal to start automatically with Windows? (Y/N): "
if /i "%autostart%"=="Y" (
    call "%PROJECT_DIR%\scripts\setup-autostart-windows.bat"
) else (
    echo Skipping auto-start setup.
    echo You can enable it later by running: scripts\setup-autostart-windows.bat
)

echo.
echo ============================================
echo   INSTALLATION COMPLETE!
echo ============================================
echo.
echo Your HR Portal is now installed and ready to use.
echo.
echo To start the portal manually:
echo   scripts\start-portal-windows.bat
echo.
echo Or if you enabled auto-start, it will run automatically
echo when Windows starts.
echo.
echo Access URLs:
echo   Application: http://localhost:5000
echo   API Docs:    http://localhost:8000/docs
echo.

set /p startnow="Would you like to start the HR Portal now? (Y/N): "
if /i "%startnow%"=="Y" (
    call "%PROJECT_DIR%\scripts\start-portal-windows.bat"
)

echo.
echo Thank you for installing the HR Portal!
echo.
pause
