@echo off
title Nexus Frontend Dev Server
echo ===================================================
echo Starting Nexus React Frontend on http://localhost:5173
echo ===================================================

set "PATH=%~dp0.tools\node;%PATH%"
cd /d "%~dp0frontend"
call npm run dev
pause
