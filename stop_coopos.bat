@echo off
title Stop CoopOS Server
echo ===================================================
echo               STOPPING COOP_OS SERVER
echo ===================================================
echo.

setlocal enabledelayedexpansion
set FOUND=0

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000 ^| findstr LISTENING') do (
    set FOUND=1
    echo Found CoopOS process with PID: %%a
    taskkill /F /PID %%a 2>nul
)

if "!FOUND!"=="1" (
    echo.
    echo CoopOS server on port 8000 has been stopped successfully.
) else (
    echo No running CoopOS server found on port 8000.
)

echo.
ping 127.0.0.1 -n 3 >nul
