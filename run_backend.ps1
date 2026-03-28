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
