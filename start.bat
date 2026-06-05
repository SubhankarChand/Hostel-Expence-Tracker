@echo off
title HostelSplit - Full Stack Application
echo ========================================
echo    HostelSplit - Starting Application
echo ========================================
echo.

echo [1/2] Starting Backend Server...
cd hostel-split-api
start "HostelSplit Backend" cmd /k "npm run dev"

cd ..

echo [2/2] Starting Frontend Server...
cd hostel-split-app
start "HostelSplit Frontend" cmd /k "npm run dev"

cd ..

echo.
echo ========================================
echo    Application Started Successfully!
echo ========================================
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:5173
echo.
echo Press any key to stop all servers...
pause > nul

taskkill /f /im node.exe
echo All servers stopped.