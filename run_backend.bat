@echo off
title annDhana Flask Backend
echo ===================================================
echo Starting annDhana Flask API on http://localhost:5000
echo ===================================================

cd /d "%~dp0backend"
python app.py
pause
