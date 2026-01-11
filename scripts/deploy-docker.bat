@echo off
REM HR Portal Docker Deployment Script for Windows
REM This script sets up and deploys the HR Portal using Docker

echo.
echo ==============================
echo HR Portal Docker Deployment
echo ==============================
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker not found!
    echo Please install Docker Desktop from: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

echo [OK] Docker is installed
echo.

REM Check if Docker Compose is available
docker compose version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker Compose not found!
    echo Please install Docker Compose
    pause
    exit /b 1
)

echo [OK] Docker Compose is available
echo.

REM Create .env file if it doesn't exist
if not exist .env (
    echo [INFO] Creating environment configuration...
    
    REM Generate random passwords using PowerShell
    for /f %%i in ('powershell -Command "[Convert]::ToBase64String((1..24 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 })) -replace '[/+=]',''"') do set DB_PASSWORD=%%i
    for /f %%i in ('powershell -Command "[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 })) -replace '[/+=]',''"') do set AUTH_SECRET=%%i
    
    (
        echo # Database Configuration
        echo DB_PASSWORD=%DB_PASSWORD%
        echo.
        echo # Authentication Configuration
        echo AUTH_SECRET_KEY=%AUTH_SECRET%
        echo.
        echo # Application URLs
        echo ALLOWED_ORIGINS=http://localhost:5000,http://localhost:3000
        echo VITE_API_BASE_URL=http://localhost:8000/api
        echo.
        echo # Environment
        echo NODE_ENV=production
    ) > .env
    
    echo [OK] Environment configuration created
    echo.
) else (
    echo [OK] Environment configuration exists
    echo.
)

REM Pull latest images
echo [INFO] Pulling Docker images...
docker compose pull

REM Build custom images
echo [INFO] Building application images...
docker compose build

REM Start services
echo [INFO] Starting services...
docker compose up -d

REM Wait for services to be ready
echo [INFO] Waiting for services to be ready...
timeout /t 10 /nobreak >nul

REM Check service status
echo.
echo ==============================
echo Service Status:
echo ==============================
docker compose ps

echo.
echo ==============================
echo Deployment Complete!
echo ==============================
echo.
echo Application URLs:
echo   Frontend:  http://localhost:5000
echo   Backend:   http://localhost:8000
echo   API Docs:  http://localhost:8000/docs
echo.
echo Useful Commands:
echo   View logs:      docker compose logs -f
echo   Stop services:  docker compose down
echo   Restart:        docker compose restart
echo   Update app:     git pull ^&^& docker compose up -d --build
echo.
echo Next Steps:
echo   1. Open http://localhost:5000 in your browser
echo   2. Login with your employee credentials
echo   3. Start managing HR renewals!
echo.
pause
