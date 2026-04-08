Write-Host "==========================================="
Write-Host " Starting CourseWeaver Natively (SQLite) "
Write-Host "==========================================="

Write-Host "1. Setting up Backend..."
Push-Location "backend"

if (-Not (Test-Path "venv")) {
    python -m venv venv
}

# Activate virtual environment
& .\venv\Scripts\Activate.ps1

# Install requirements
pip install -r requirements.txt

# Handle Database Migrations via Alembic
Write-Host "Setting up SQLite database..."
if (-Not (Test-Path "alembic\versions")) {
    New-Item -ItemType Directory -Force -Path "alembic\versions"
}

# Check if migrations exist; if not, create initial iteration
if ((Get-ChildItem "alembic\versions").Count -eq 0) {
    alembic revision --autogenerate -m "Initial schema"
}

# Apply migrations
alembic upgrade head

# Start the FastAPI backend in a new window
Write-Host "Starting Backend on port 8001..."
Start-Process -FilePath "uvicorn" -ArgumentList "server:app --host 0.0.0.0 --port 8001" -WindowStyle Normal

Write-Host "2. Setting up Frontend..."
Pop-Location
Push-Location "frontend"

# Install node dependencies
npm install --legacy-peer-deps

# Start React app in the foreground
Write-Host "Starting Frontend on port 5173..."
npm run dev -- --port 5173

Pop-Location
