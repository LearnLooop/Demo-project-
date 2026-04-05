#!/bin/bash
set -e

echo "==========================================="
echo " Starting CourseWeaver Natively (SQLite) "
echo "==========================================="

echo "1. Setting up Backend..."
cd backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate || source venv/Scripts/activate

# Install requirements
pip install -r requirements.txt

# Handle Database Migrations via Alembic
echo "Setting up SQLite database..."
if [ ! -d "alembic/versions" ]; then
    mkdir -p alembic/versions
fi

# Check if migrations exist; if not, create initial iteration
if [ -z "$(ls -A alembic/versions)" ]; then
    alembic revision --autogenerate -m "Initial schema"
fi

# Apply migrations
alembic upgrade head

# Seed databse optionally, uncomment if needed:
# python seed.py

# Start the FastAPI backend in the background
echo "Starting Backend on port 8001..."
uvicorn server:app --host 0.0.0.0 --port 8001 &
BACKEND_PID=$!

echo "2. Setting up Frontend..."
cd ../frontend

# Install node dependencies
npm install --legacy-peer-deps

# Start React app in the foreground
echo "Starting Frontend on port 3000..."
npm run dev &
FRONTEND_PID=$!

echo "==========================================="
echo " Backend running at http://localhost:8001"
echo " Frontend running at http://localhost:5173 (or port specified by Vite)"
echo " Press Ctrl+C to stop all services"
echo "==========================================="

# Wait for process exit and clean up
trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait
