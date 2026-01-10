@echo off
REM Extract PR #79 files to a new repository directory
REM This script copies all performance optimization and deployment files
REM Usage: extract-pr79-files.bat <destination-directory>

setlocal enabledelayedexpansion

echo.
echo ========================================
echo PR #79 File Extraction Script
echo ========================================
echo.

REM Check for destination argument
if "%~1"=="" (
    echo [ERROR] Destination directory not specified
    echo.
    echo Usage: %~nx0 ^<destination-directory^>
    echo.
    echo Example:
    echo   %~nx0 ..\hr-portal-performance-deployment
    echo.
    exit /b 1
)

set "DEST_DIR=%~1"
set "SOURCE_DIR=%~dp0.."

echo Source:      %SOURCE_DIR%
echo Destination: %DEST_DIR%
echo.

set /p CONFIRM="Continue? (y/n) "
if /i not "%CONFIRM%"=="y" (
    echo Cancelled.
    exit /b 0
)

REM Create destination directory
echo [INFO] Creating destination directory...
if not exist "%DEST_DIR%" mkdir "%DEST_DIR%"
cd /d "%DEST_DIR%"

REM Initialize git if not already initialized
if not exist .git (
    echo [INFO] Initializing git repository...
    git init
    git branch -M main
    echo [OK] Git repository initialized
) else (
    echo [OK] Git repository already exists
)

REM Create directory structure
echo [INFO] Creating directory structure...
if not exist docs mkdir docs
if not exist scripts mkdir scripts
if not exist backend mkdir backend
if not exist frontend mkdir frontend

REM Copy documentation files
echo [INFO] Copying documentation...
set FILES_COPIED=0

if exist "%SOURCE_DIR%\docs\PERFORMANCE_OPTIMIZATION_GUIDE.md" (
    copy "%SOURCE_DIR%\docs\PERFORMANCE_OPTIMIZATION_GUIDE.md" docs\ >nul
    echo   [OK] PERFORMANCE_OPTIMIZATION_GUIDE.md
    set /a FILES_COPIED+=1
)

if exist "%SOURCE_DIR%\docs\DEPLOYMENT_ALTERNATIVES_GUIDE.md" (
    copy "%SOURCE_DIR%\docs\DEPLOYMENT_ALTERNATIVES_GUIDE.md" docs\ >nul
    echo   [OK] DEPLOYMENT_ALTERNATIVES_GUIDE.md
    set /a FILES_COPIED+=1
)

if exist "%SOURCE_DIR%\docs\AWESOME_RESOURCES.md" (
    copy "%SOURCE_DIR%\docs\AWESOME_RESOURCES.md" docs\ >nul
    echo   [OK] AWESOME_RESOURCES.md
    set /a FILES_COPIED+=1
)

if exist "%SOURCE_DIR%\docs\PERFORMANCE_DEPLOYMENT_QUICK_REFERENCE.md" (
    copy "%SOURCE_DIR%\docs\PERFORMANCE_DEPLOYMENT_QUICK_REFERENCE.md" docs\ >nul
    echo   [OK] PERFORMANCE_DEPLOYMENT_QUICK_REFERENCE.md
    set /a FILES_COPIED+=1
)

if exist "%SOURCE_DIR%\docs\IMPLEMENTATION_SUMMARY.md" (
    copy "%SOURCE_DIR%\docs\IMPLEMENTATION_SUMMARY.md" docs\ >nul
    echo   [OK] IMPLEMENTATION_SUMMARY.md
    set /a FILES_COPIED+=1
)

if exist "%SOURCE_DIR%\QUICK_START.md" (
    copy "%SOURCE_DIR%\QUICK_START.md" . >nul
    echo   [OK] QUICK_START.md
    set /a FILES_COPIED+=1
)

REM Copy Docker configuration
echo [INFO] Copying Docker configuration...

if exist "%SOURCE_DIR%\docker-compose.yml" (
    copy "%SOURCE_DIR%\docker-compose.yml" . >nul
    echo   [OK] docker-compose.yml
    set /a FILES_COPIED+=1
)

if exist "%SOURCE_DIR%\.dockerignore" (
    copy "%SOURCE_DIR%\.dockerignore" . >nul
    echo   [OK] .dockerignore
    set /a FILES_COPIED+=1
)

if exist "%SOURCE_DIR%\backend\Dockerfile" (
    copy "%SOURCE_DIR%\backend\Dockerfile" backend\ >nul
    echo   [OK] backend\Dockerfile
    set /a FILES_COPIED+=1
)

if exist "%SOURCE_DIR%\frontend\Dockerfile" (
    copy "%SOURCE_DIR%\frontend\Dockerfile" frontend\ >nul
    echo   [OK] frontend\Dockerfile
    set /a FILES_COPIED+=1
)

if exist "%SOURCE_DIR%\frontend\nginx.conf" (
    copy "%SOURCE_DIR%\frontend\nginx.conf" frontend\ >nul
    echo   [OK] frontend\nginx.conf
    set /a FILES_COPIED+=1
)

REM Copy scripts
echo [INFO] Copying scripts...

if exist "%SOURCE_DIR%\scripts\deploy-docker.sh" (
    copy "%SOURCE_DIR%\scripts\deploy-docker.sh" scripts\ >nul
    echo   [OK] deploy-docker.sh
    set /a FILES_COPIED+=1
)

if exist "%SOURCE_DIR%\scripts\deploy-docker.bat" (
    copy "%SOURCE_DIR%\scripts\deploy-docker.bat" scripts\ >nul
    echo   [OK] deploy-docker.bat
    set /a FILES_COPIED+=1
)

if exist "%SOURCE_DIR%\scripts\backup-database.sh" (
    copy "%SOURCE_DIR%\scripts\backup-database.sh" scripts\ >nul
    echo   [OK] backup-database.sh
    set /a FILES_COPIED+=1
)

REM Create basic README
echo [INFO] Creating README.md...
(
echo # HR Portal: Performance ^& Deployment Guides
echo.
echo Performance optimization and deployment documentation for the Secure Renewals HR Portal.
echo.
echo ## 📚 What's Inside
echo.
echo This repository contains comprehensive guides for:
echo - **Performance Optimization** - Tools and techniques from awesome lists
echo - **Deployment Alternatives** - Docker, On-Premise, Oracle Cloud Free, and more
echo - **Awesome Resources** - Curated tools for HR applications
echo - **Quick Reference** - TL;DR for common tasks
echo.
echo ## 🚀 Quick Start
echo.
echo ### Deploy with Docker ^(10 minutes^)
echo.
echo **Linux/macOS:**
echo ```bash
echo ./scripts/deploy-docker.sh
echo ```
echo.
echo **Windows:**
echo ```bash
echo scripts\deploy-docker.bat
echo ```
echo.
echo Access the application at http://localhost:5000
echo.
echo ## 📖 Documentation
echo.
echo ^| Guide ^| Description ^|
echo ^|-------^|-------------^|
echo ^| [Quick Start]^(QUICK_START.md^) ^| Fast track to deployment ^|
echo ^| [Performance Optimization]^(docs/PERFORMANCE_OPTIMIZATION_GUIDE.md^) ^| Detailed performance guide ^|
echo ^| [Deployment Alternatives]^(docs/DEPLOYMENT_ALTERNATIVES_GUIDE.md^) ^| Various deployment options ^|
echo ^| [Awesome Resources]^(docs/AWESOME_RESOURCES.md^) ^| Tools from awesome lists ^|
echo ^| [Quick Reference]^(docs/PERFORMANCE_DEPLOYMENT_QUICK_REFERENCE.md^) ^| Common commands ^|
echo ^| [Implementation Summary]^(docs/IMPLEMENTATION_SUMMARY.md^) ^| What's included ^|
echo.
echo ## 📚 Source
echo.
echo These guides were created as part of PR #79 in the [Secure-Renewals-2]^(https://github.com/ismaelloveexcel/Secure-Renewals-2^) repository.
echo.
echo ## 📄 License
echo.
echo MIT License
) > README.md

echo   [OK] README.md created

REM Create .gitignore
echo [INFO] Creating .gitignore...
(
echo # Environment
echo .env
echo .env.local
echo .env.*.local
echo.
echo # Dependencies
echo node_modules/
echo __pycache__/
echo *.pyc
echo *.pyo
echo *.pyd
echo.
echo # Build outputs
echo dist/
echo build/
echo *.egg-info/
echo.
echo # IDE
echo .vscode/
echo .idea/
echo *.swp
echo *.swo
echo.
echo # OS
echo .DS_Store
echo Thumbs.db
echo.
echo # Logs
echo *.log
echo logs/
echo.
echo # Database
echo *.sqlite
echo *.db
echo.
echo # Backups
echo backups/
) > .gitignore

echo   [OK] .gitignore created

REM Summary
echo.
echo ========================================
echo Extraction Complete!
echo ========================================
echo.
echo Summary:
echo   Files copied: !FILES_COPIED!
echo   Destination: %DEST_DIR%
echo.
echo Next Steps:
echo   1. cd %DEST_DIR%
echo   2. Review the files and README.md
echo   3. Create a new GitHub repository
echo   4. git add .
echo   5. git commit -m "Initial commit: PR #79 performance and deployment guides"
echo   6. git remote add origin ^<your-new-repo-url^>
echo   7. git push -u origin main
echo.
echo Your new repository is ready!
echo.

pause
