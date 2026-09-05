@echo off
title annDhana Launcher
echo ===================================================
echo Launching annDhana Full-Stack Platform...
echo ===================================================

start "annDhana Backend API (Port 5000)" cmd /k "%~dp0run_backend.bat"
timeout /t 2 /nobreak >nul
start "annDhana Frontend (Port 5173)" cmd /k "%~dp0run_frontend.bat"

echo.
echo Both servers launched!
echo Open your browser at: http://localhost:5173
echo.
pause
