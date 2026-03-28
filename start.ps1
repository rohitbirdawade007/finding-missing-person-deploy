<#
.SYNOPSIS
Starts the Guardian Eye AI v2 Backend and Frontend simultaneously.

.DESCRIPTION
This script sets up the Python virtual environment if it doesn't exist,
installs backend requirements, installs frontend requirements, and then
starts both servers (FastAPI on port 8000, Vite on port 5173).
#>

$ErrorActionPreference = "Stop"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "   Starting Guardian Eye AI v2..." -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Check if .env files exist before starting
if (-not (Test-Path "backend\.env")) {
    Write-Host "[WARNING] backend\.env not found. Creating from .env.example..." -ForegroundColor Yellow
    Copy-Item "backend\.env.example" "backend\.env"
    Write-Host "Please edit backend\.env and add your MONGODB_URI before continuing." -ForegroundColor Red
    Pause
    exit
}

if (-not (Test-Path "frontend\.env")) {
    Write-Host "[WARNING] frontend\.env not found. Creating from .env.example..." -ForegroundColor Yellow
    Copy-Item "frontend\.env.example" "frontend\.env"
}

# 1. Start Backend in a new terminal window
Write-Host "Starting Backend Service on Port 8000..." -ForegroundColor Green
$backendScript = @'
cd backend
if (Test-Path "venv") {
    Write-Host "Removing broken Python environment..."
    Remove-Item -Recurse -Force "venv"
}
if (-not (Test-Path "venv")) {
    Write-Host "Creating Python 3.11 virtual environment..."
    py -3.11 -m venv venv
}
Write-Host "Upgrading pip and build tools..."
.\venv\Scripts\python.exe -m pip install --upgrade pip setuptools wheel
Write-Host "Installing backend dependencies (this may take a minute on first run)..."
.\venv\Scripts\python.exe -m pip install -r requirements.txt
Write-Host "Starting FastAPI Server..."
.\venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000
'@

$backendFile = "run_backend.ps1"
Set-Content $backendFile $backendScript
Start-Process powershell -ArgumentList "-NoExit -ExecutionPolicy Bypass -File .\$backendFile"

# 2. Start Frontend in a new terminal window
Write-Host "Starting Frontend Service on Port 5173..." -ForegroundColor Blue
$frontendScript = @'
cd frontend
Write-Host "Installing frontend dependencies..."
npm install
Write-Host "Starting Vite Server..."
npm run dev
'@

$frontendFile = "run_frontend.ps1"
Set-Content $frontendFile $frontendScript
Start-Process powershell -ArgumentList "-NoExit -ExecutionPolicy Bypass -File .\$frontendFile"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host " Services are starting up!" -ForegroundColor Cyan
Write-Host " Backend API: http://localhost:8000" -ForegroundColor White
Write-Host " Frontend UI: http://localhost:5173" -ForegroundColor White
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Press any key to exit this launcher..."
$Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") | Out-Null

# Cleanup temp scripts
Remove-Item $backendFile -ErrorAction SilentlyContinue
Remove-Item $frontendFile -ErrorAction SilentlyContinue
