@echo off
REM Truvamate Development Server Startup Script for Windows
REM This script starts both backend and frontend servers

echo 🚀 Starting Truvamate Development Servers...
echo ==============================================
echo.

REM Check Node.js
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed. Please install from https://nodejs.org
    pause
    exit /b 1
)

echo ✅ Node.js version:
node --version
echo.

REM Get script directory
cd /d "%~dp0"

REM Start Backend
echo 📦 Starting Backend Server (port 5000)...
start "Truvamate Backend" cmd /k "cd backend && npm run dev"

REM Wait for backend to start
timeout /t 3 /nobreak >nul

REM Start Frontend
echo 📦 Starting Frontend Server (port 5001)...
start "Truvamate Frontend" cmd /k "npm run dev"

REM Wait for servers to start
echo.
echo ⏳ Waiting for servers to start...
timeout /t 5 /nobreak >nul

echo.
echo ==============================================
echo 🎉 Servers are starting!
echo.
echo 📱 Frontend: http://localhost:5001
echo 🔧 Backend:  http://localhost:5000
echo.
echo Close the terminal windows to stop the servers
echo.
pause






