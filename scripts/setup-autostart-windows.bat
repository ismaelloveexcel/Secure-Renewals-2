@echo off
REM ============================================
REM HR Portal Auto-Start Setup for Windows
REM ============================================
REM 
REM This script configures the HR Portal to start automatically
REM when Windows starts using Task Scheduler.
REM
REM Run as Administrator for best results.
REM
REM ============================================

title HR Portal - Auto-Start Setup

echo ============================================
echo   HR PORTAL AUTO-START SETUP
echo ============================================
echo.

REM Get the script directory (parent of scripts folder)
cd /d "%~dp0\.."
set PROJECT_DIR=%cd%

echo Project Directory: %PROJECT_DIR%
echo.

REM Check for admin rights
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo WARNING: Not running as Administrator.
    echo          Some features may not work correctly.
    echo          Right-click and "Run as administrator" for full setup.
    echo.
)

:MENU
echo Choose an option:
echo.
echo   1. Enable Auto-Start (start portal when Windows starts)
echo   2. Disable Auto-Start (remove from startup)
echo   3. Test Start Portal Now
echo   4. Exit
echo.
set /p choice="Enter choice (1-4): "

if "%choice%"=="1" goto ENABLE
if "%choice%"=="2" goto DISABLE
if "%choice%"=="3" goto TEST
if "%choice%"=="4" goto END
goto MENU

:ENABLE
echo.
echo Setting up auto-start...
echo.

REM Create a VBS wrapper to run silently (no command window popup)
echo Creating silent launcher...
(
echo Set WshShell = CreateObject^("WScript.Shell"^)
echo Set fso = CreateObject^("Scripting.FileSystemObject"^)
echo scriptPath = WScript.ScriptFullName
echo projectDir = fso.GetParentFolderName^(scriptPath^)
echo projectDir = fso.GetParentFolderName^(projectDir^)
echo WshShell.CurrentDirectory = projectDir
echo WshShell.Run "cmd /c """ ^& projectDir ^& "\scripts\start-portal-windows.bat""", 0, False
) > "%PROJECT_DIR%\scripts\start-portal-silent.vbs"

REM Method 1: Add to Startup folder (simpler, works for current user)
echo Adding to Windows Startup folder...
set STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup

REM Create a shortcut in the startup folder
powershell -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%STARTUP_FOLDER%\HR Portal.lnk'); $s.TargetPath = 'wscript.exe'; $s.Arguments = '\"%PROJECT_DIR%\scripts\start-portal-silent.vbs\"'; $s.WorkingDirectory = '%PROJECT_DIR%'; $s.Description = 'HR Portal Auto-Start'; $s.Save()"

if %errorLevel% equ 0 (
    echo.
    echo ============================================
    echo   AUTO-START ENABLED SUCCESSFULLY!
    echo ============================================
    echo.
    echo HR Portal will now start automatically when Windows starts.
    echo.
    echo Shortcut created at:
    echo   %STARTUP_FOLDER%\HR Portal.lnk
    echo.
    echo To disable: Run this script again and choose option 2.
    echo.
) else (
    echo ERROR: Failed to create startup shortcut.
    echo Please try running as Administrator.
)
pause
goto MENU

:DISABLE
echo.
echo Removing auto-start...
echo.

REM Remove from Startup folder
set STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
if exist "%STARTUP_FOLDER%\HR Portal.lnk" (
    del "%STARTUP_FOLDER%\HR Portal.lnk"
    echo Removed: %STARTUP_FOLDER%\HR Portal.lnk
)

REM Remove silent launcher
if exist "%PROJECT_DIR%\scripts\start-portal-silent.vbs" (
    del "%PROJECT_DIR%\scripts\start-portal-silent.vbs"
    echo Removed: start-portal-silent.vbs
)

echo.
echo ============================================
echo   AUTO-START DISABLED
echo ============================================
echo.
echo HR Portal will no longer start automatically.
echo.
pause
goto MENU

:TEST
echo.
echo Starting HR Portal now...
echo.
call "%PROJECT_DIR%\scripts\start-portal-windows.bat"
goto MENU

:END
echo.
echo Goodbye!
exit /b 0
