@echo off
title Nexus Flask Backend
echo ===================================================
echo Starting Nexus Flask API on http://localhost:5000
echo ===================================================

cd /d "%~dp0backend"
python app.py
pause
