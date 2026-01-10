#!/bin/bash
# Azure App Service startup script for FastAPI application

echo "Starting Azure App Service deployment..."

# Navigate to backend directory
cd /home/site/wwwroot/backend || cd /home/site/wwwroot

# Install dependencies
echo "Installing Python dependencies..."
python -m pip install --upgrade pip
pip install -r requirements.txt

# Run database migrations
echo "Running database migrations..."
alembic upgrade head || echo "Warning: Database migrations failed. Please check DATABASE_URL environment variable."

# Start the application with Gunicorn
echo "Starting FastAPI application with Gunicorn..."
exec gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app --bind 0.0.0.0:8000 --timeout 120 --access-logfile - --error-logfile -
