#!/bin/bash

# HR Portal Docker Deployment Script
# This script sets up and deploys the HR Portal using Docker

set -e

echo "🚀 HR Portal Docker Deployment"
echo "==============================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found!"
    echo "📥 Installing Docker..."
    
    # Detect OS
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        curl -fsSL https://get.docker.com -o get-docker.sh
        sudo sh get-docker.sh
        sudo usermod -aG docker $USER
        echo "✅ Docker installed. Please log out and log back in, then run this script again."
        exit 0
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        echo "Please install Docker Desktop from: https://www.docker.com/products/docker-desktop"
        exit 1
    else
        echo "Unsupported OS. Please install Docker manually."
        exit 1
    fi
fi

echo "✅ Docker is installed"

# Check if Docker Compose is available
if ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose not found!"
    echo "Please install Docker Compose plugin"
    exit 1
fi

echo "✅ Docker Compose is available"
echo ""

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating environment configuration..."
    
    # Generate secure random passwords
    DB_PASSWORD=$(openssl rand -hex 16)
    AUTH_SECRET=$(openssl rand -hex 32)
    
    cat > .env << EOF
# Database Configuration
DB_PASSWORD=${DB_PASSWORD}

# Authentication Configuration
AUTH_SECRET_KEY=${AUTH_SECRET}

# Application URLs
ALLOWED_ORIGINS=http://localhost:5000,http://localhost:3000
VITE_API_BASE_URL=http://localhost:8000/api

# Environment
NODE_ENV=production
EOF
    
    echo "✅ Environment configuration created"
    echo ""
else
    echo "✅ Environment configuration exists"
    echo ""
fi

# Pull latest images
echo "📦 Pulling Docker images..."
docker compose pull

# Build custom images
echo "🔨 Building application images..."
docker compose build

# Start services
echo "🚀 Starting services..."
docker compose up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check service status
echo ""
echo "📊 Service Status:"
docker compose ps

echo ""
echo "✅ Deployment Complete!"
echo ""
echo "📱 Application URLs:"
echo "   Frontend:  http://localhost:5000"
echo "   Backend:   http://localhost:8000"
echo "   API Docs:  http://localhost:8000/docs"
echo ""
echo "🔧 Useful Commands:"
echo "   View logs:      docker compose logs -f"
echo "   Stop services:  docker compose down"
echo "   Restart:        docker compose restart"
echo "   Update app:     git pull && docker compose up -d --build"
echo ""
echo "📝 Next Steps:"
echo "   1. Open http://localhost:5000 in your browser"
echo "   2. Login with your employee credentials"
echo "   3. Start managing HR renewals!"
echo ""
