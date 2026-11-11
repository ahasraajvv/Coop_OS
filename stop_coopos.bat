@echo off
title Stop CoopOS
cd /d "C:\Users\ahasr\Coop_OS"

echo [CoopOS] Stopping server on port 8000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000 ^| findstr LISTENING') do (
    echo Stopping process PID: %%a
    taskkill /F /PID %%a >nul 2>&1
)
echo [CoopOS] Server stopped successfully.
ping 127.0.0.1 -n 3 >nul
exit /b 0
