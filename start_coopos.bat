@echo off
title CoopOS - Commercial Poultry CRM Workstation
color 0A

echo =====================================================================
echo           COOP_OS - COMMERCIAL POULTRY CRM & ERP WORKSTATION
echo =====================================================================
echo.
echo [1/3] Checking environment...
cd /d "%~dp0"

if not exist "venv\Scripts\python.exe" (
    echo [ERROR] Python virtual environment not found in venv\
    echo Please make sure the venv folder exists.
    pause
    exit /b 1
)

echo [2/3] Opening CoopOS in your default browser...
start http://127.0.0.1:8000/

echo [3/3] Starting CoopOS Server on your laptop (127.0.0.1:8000)...
echo.
echo ---------------------------------------------------------------------
echo Server is running!
echo Access the CRM at: http://127.0.0.1:8000/
echo To STOP the server, close this window or press Ctrl + C.
echo ---------------------------------------------------------------------
echo.

venv\Scripts\python.exe manage.py runserver 127.0.0.1:8000

pause
