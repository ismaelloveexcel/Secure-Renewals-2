@echo off
REM ############################################################################
REM Create New Lean Repository Script (Windows)
REM 
REM Purpose: Copy only essential files to a new repository for Azure deployment
REM Excludes: docs, attached_assets, scripts, .github, .vscode, etc.
REM Result: 80-90%% size reduction (50+ MB to 2-5 MB)
REM ############################################################################

setlocal enabledelayedexpansion

REM Script directory and source repository
set "SCRIPT_DIR=%~dp0"
set "SOURCE_REPO=%SCRIPT_DIR%.."

echo ========================================
echo Secure Renewals - New Repository Creation
echo ========================================
echo.
echo This script will create a new lean repository containing only
echo the essential files needed for Azure deployment.
echo.
echo What gets copied:
echo   + backend/          - FastAPI application
echo   + frontend/         - React application
echo   + .streamlit/       - Configuration
echo   + .gitignore        - Git ignore rules
echo   + pyproject.toml    - Python dependencies
echo   + uv.lock           - Dependency lock
echo   + deploy_to_azure.sh - Deployment script
echo.
echo What gets excluded:
echo   - docs/             - Documentation (35+ files)
echo   - attached_assets/  - Reference files (180+ files, 50+ MB)
echo   - scripts/          - Development scripts
echo   - .github/          - GitHub configs
echo   - .vscode/          - VSCode configs
echo   - .devcontainer/    - DevContainer configs
echo   - Root docs         - README, CONTRIBUTING, etc.
echo.

REM Prompt for target directory
set /p "TARGET_DIR=Enter target directory name (default: ..\secure-renewals-production): "
if "!TARGET_DIR!"=="" set "TARGET_DIR=..\secure-renewals-production"

REM Convert to absolute path
pushd "%SOURCE_REPO%"
cd /d "%TARGET_DIR%" 2>nul && set "TARGET_DIR=%CD%" || set "TARGET_DIR=%SOURCE_REPO%\%TARGET_DIR%"
popd

REM Check if target directory exists
if exist "!TARGET_DIR!" (
    echo.
    echo [ERROR] Target directory already exists: !TARGET_DIR!
    set /p "CONFIRM=Do you want to remove it and continue? (y/N): "
    if /i not "!CONFIRM!"=="y" (
        echo [ERROR] Aborted.
        exit /b 1
    )
    rmdir /s /q "!TARGET_DIR!"
    echo [OK] Removed existing directory
)

REM Create target directory
echo.
echo [INFO] Creating target directory: !TARGET_DIR!
mkdir "!TARGET_DIR!"
echo [OK] Created target directory

REM Copy essential directories
echo.
echo ========================================
echo Copying Essential Files
echo ========================================
echo.

echo [INFO] Copying backend/...
xcopy /E /I /Q "%SOURCE_REPO%\backend" "!TARGET_DIR!\backend" >nul
echo [OK] Copied backend/

echo [INFO] Copying frontend/...
xcopy /E /I /Q "%SOURCE_REPO%\frontend" "!TARGET_DIR!\frontend" >nul
echo [OK] Copied frontend/

echo [INFO] Copying .streamlit/...
if exist "%SOURCE_REPO%\.streamlit" (
    xcopy /E /I /Q "%SOURCE_REPO%\.streamlit" "!TARGET_DIR!\.streamlit" >nul
    echo [OK] Copied .streamlit/
) else (
    echo [WARNING] .streamlit/ not found, skipped
)

REM Copy root configuration files
echo [INFO] Copying root configuration files...
copy /Y "%SOURCE_REPO%\.gitignore" "!TARGET_DIR!\" >nul 2>&1 || echo [WARNING] .gitignore not found
copy /Y "%SOURCE_REPO%\pyproject.toml" "!TARGET_DIR!\" >nul 2>&1 || echo [WARNING] pyproject.toml not found
copy /Y "%SOURCE_REPO%\uv.lock" "!TARGET_DIR!\" >nul 2>&1 || echo [WARNING] uv.lock not found
copy /Y "%SOURCE_REPO%\deploy_to_azure.sh" "!TARGET_DIR!\" >nul 2>&1 || echo [WARNING] deploy_to_azure.sh not found
echo [OK] Copied root configuration files

REM Clean up build artifacts
echo [INFO] Cleaning up build artifacts...
if exist "!TARGET_DIR!\frontend\node_modules" rmdir /s /q "!TARGET_DIR!\frontend\node_modules" 2>nul
if exist "!TARGET_DIR!\frontend\dist" rmdir /s /q "!TARGET_DIR!\frontend\dist" 2>nul
if exist "!TARGET_DIR!\backend\static" rmdir /s /q "!TARGET_DIR!\backend\static" 2>nul
if exist "!TARGET_DIR!\backend\__pycache__" rmdir /s /q "!TARGET_DIR!\backend\__pycache__" 2>nul
for /d /r "!TARGET_DIR!" %%d in (__pycache__) do @if exist "%%d" rmdir /s /q "%%d" 2>nul
for /d /r "!TARGET_DIR!" %%d in (.pytest_cache) do @if exist "%%d" rmdir /s /q "%%d" 2>nul
del /s /q "!TARGET_DIR!\*.pyc" >nul 2>&1
echo [OK] Cleaned up build artifacts

REM Initialize git repository (optional)
echo.
echo ========================================
echo Git Initialization
echo ========================================
echo.
set /p "INIT_GIT=Initialize git repository? (Y/n): "
if "!INIT_GIT!"=="" set "INIT_GIT=y"

if /i "!INIT_GIT!"=="y" (
    pushd "!TARGET_DIR!"
    git init >nul 2>&1
    if !ERRORLEVEL! equ 0 (
        echo [OK] Initialized git repository
        
        REM Optional: Create initial commit
        set /p "INITIAL_COMMIT=Create initial commit? (Y/n): "
        if "!INITIAL_COMMIT!"=="" set "INITIAL_COMMIT=y"
        
        if /i "!INITIAL_COMMIT!"=="y" (
            git add . >nul 2>&1
            git commit -m "Initial commit - production files only" >nul 2>&1
            echo [OK] Created initial commit
        )
    ) else (
        echo [WARNING] Git not found or initialization failed
    )
    popd
)

REM Create minimal README (optional)
echo.
echo ========================================
echo README Creation
echo ========================================
echo.
set /p "CREATE_README=Create minimal README.md? (Y/n): "
if "!CREATE_README!"=="" set "CREATE_README=y"

if /i "!CREATE_README!"=="y" (
    (
        echo # Secure Renewals HR Portal - Production
        echo.
        echo Production-ready deployment of the Secure Renewals HR Portal.
        echo.
        echo ## Quick Start
        echo.
        echo ### Backend Setup
        echo.
        echo ```bash
        echo cd backend
        echo cp .env.example .env
        echo # Edit .env with your settings
        echo uv sync
        echo uv run alembic upgrade head
        echo uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
        echo ```
        echo.
        echo **API Docs:** http://localhost:8000/docs
        echo.
        echo ### Frontend Setup
        echo.
        echo ```bash
        echo cd frontend
        echo npm install
        echo echo "VITE_API_BASE_URL=http://localhost:8000/api" ^> .env
        echo npm run dev
        echo ```
        echo.
        echo **App:** http://localhost:5173
        echo.
        echo ### Build Production Frontend
        echo.
        echo ```bash
        echo cd frontend
        echo npm run build
        echo # Output: backend/static/
        echo ```
        echo.
        echo ## Deployment
        echo.
        echo ### Azure Deployment
        echo.
        echo See `deploy_to_azure.sh` for deployment instructions.
        echo.
        echo ### Environment Variables
        echo.
        echo **Backend ^(.env^):**
        echo - `DATABASE_URL` - PostgreSQL connection string ^(postgresql+asyncpg://...^)
        echo - `AUTH_ISSUER` - Authentication issuer URL
        echo - `AUTH_AUDIENCE` - API audience identifier
        echo - `AUTH_JWKS_URL` - JWKS endpoint URL
        echo - `ALLOWED_ORIGINS` - Comma-separated allowed origins
        echo.
        echo **Frontend ^(.env^):**
        echo - `VITE_API_BASE_URL` - Backend API URL
        echo.
        echo ## Technology Stack
        echo.
        echo ^| Layer ^| Technology ^|
        echo ^|-------^|------------^|
        echo ^| **Backend** ^| Python 3.11+, FastAPI, SQLAlchemy, Alembic ^|
        echo ^| **Frontend** ^| React 18, TypeScript, Vite, TailwindCSS ^|
        echo ^| **Database** ^| PostgreSQL ^(asyncpg driver^) ^|
        echo ^| **Auth** ^| JWT-based authentication ^|
        echo.
        echo ## License
        echo.
        echo ISC License
    ) > "!TARGET_DIR!\README.md"
    
    echo [OK] Created README.md
    
    REM Add README to git if initialized
    if /i "!INIT_GIT!"=="y" (
        pushd "!TARGET_DIR!"
        git add README.md >nul 2>&1
        git commit -m "Add minimal README" >nul 2>&1
        popd
    )
)

REM Generate summary report
echo.
echo ========================================
echo Summary Report
echo ========================================
echo.

echo Source Repository: %SOURCE_REPO%
echo.
echo New Repository: !TARGET_DIR!
echo.

echo [OK] Repository created successfully!

REM Next steps
echo.
echo ========================================
echo Next Steps
echo ========================================
echo.

echo 1. Verify the structure:
echo    cd !TARGET_DIR!
echo    dir
echo.
echo 2. Set up backend:
echo    cd !TARGET_DIR!\backend
echo    copy .env.example .env
echo    # Edit .env with your settings
echo    uv sync
echo    uv run alembic upgrade head
echo.
echo 3. Set up frontend:
echo    cd !TARGET_DIR!\frontend
echo    npm install
echo    echo VITE_API_BASE_URL=http://localhost:8000/api ^> .env
echo.
echo 4. Push to GitHub:
echo    cd !TARGET_DIR!
echo    git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git
echo    git branch -M main
echo    git push -u origin main
echo.

echo [OK] Done! Your new lean repository is ready at: !TARGET_DIR!
echo.

pause
