@echo off
title CoopOS - Database Backup Tool
color 0B

echo =====================================================================
echo                     COOP_OS DATABASE BACKUP TOOL
echo =====================================================================
echo.
cd /d "%~dp0"

if not exist "db.sqlite3" (
    echo [ERROR] db.sqlite3 not found in current folder!
    pause
    exit /b 1
)

if not exist "backups" mkdir backups

for /f %%a in ('powershell -NoProfile -Command "Get-Date -Format yyyy-MM-dd_HH-mm-ss"') do set TIMESTAMP=%%a
set BACKUP_FILE=backups\db_backup_%TIMESTAMP%.sqlite3

copy /y db.sqlite3 "%BACKUP_FILE%" >nul

if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Backup created successfully!
    echo File: %BACKUP_FILE%
    echo Full Path: %CD%\%BACKUP_FILE%
    echo.
    echo Tip: You can copy this file to a USB Pen Drive or Google Drive
    echo      to keep your poultry farm records 100%% safe forever.
) else (
    echo [ERROR] Backup failed.
)

echo.
pause
