@echo off
title CoopOS Workstation
cd /d "C:\Users\ahasr\Coop_OS"

:: Check if CoopOS server is already running on port 8000
netstat -ano | findstr :8000 | findstr LISTENING >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [CoopOS] Server is already running. Opening workstation...
    start http://127.0.0.1:8000/
    exit /b 0
)

echo [CoopOS] Starting Commercial Poultry Farm Workstation...
:: Launch Django server minimized in taskbar
start "CoopOS Server" /min cmd /k "cd /d C:\Users\ahasr\Coop_OS && venv\Scripts\python.exe manage.py runserver 127.0.0.1:8000"

:: Wait 3 seconds for server initialization
ping 127.0.0.1 -n 4 >nul

:: Open browser directly to CoopOS
start http://127.0.0.1:8000/
exit /b 0
