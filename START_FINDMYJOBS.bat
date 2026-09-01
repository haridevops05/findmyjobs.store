@echo off
title FindMyJobs.store — Local Server
color 0A

echo.
echo  ==========================================
echo   ⚡ FindMyJobs.store — Starting Up...
echo  ==========================================
echo.

:: Set Ollama to allow localhost
setx OLLAMA_ORIGINS "http://localhost:3001" >nul 2>&1

:: Kill any existing Vite on port 3001
echo  [1/3] Clearing port 3001...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001 2^>nul') do taskkill /F /PID %%a >nul 2>&1

:: Start Ollama in background (if not already running)
echo  [2/3] Starting Ollama...
start "" /min "ollama" ollama serve
timeout /t 2 /nobreak >nul

:: Start Vite dev server
echo  [3/3] Starting FindMyJobs...
cd /d "%~dp0"
start "" http://localhost:3001
npx vite --port 3001 --host localhost

pause
