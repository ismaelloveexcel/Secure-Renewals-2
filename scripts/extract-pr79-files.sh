#!/bin/bash

# Extract PR #79 files to a new repository directory
# This script copies all performance optimization and deployment files
# Usage: ./extract-pr79-files.sh /path/to/new-repo

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo "🚀 PR #79 File Extraction Script"
echo "=================================="
echo ""

# Check for destination argument
if [ -z "$1" ]; then
    echo "❌ Error: Destination directory not specified"
    echo ""
    echo "Usage: $0 <destination-directory>"
    echo ""
    echo "Example:"
    echo "  $0 ../hr-portal-performance-deployment"
    echo ""
    exit 1
fi

DEST_DIR="$1"
SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo -e "${BLUE}Source:${NC}      $SOURCE_DIR"
echo -e "${BLUE}Destination:${NC} $DEST_DIR"
echo ""

# Confirm with user
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

# Create destination directory
echo -e "${GREEN}📁 Creating destination directory...${NC}"
mkdir -p "$DEST_DIR"
cd "$DEST_DIR"

# Initialize git if not already initialized
if [ ! -d .git ]; then
    echo -e "${GREEN}🔧 Initializing git repository...${NC}"
    git init
    git branch -M main
    echo "✅ Git repository initialized"
else
    echo "✅ Git repository already exists"
fi

# Create directory structure
echo -e "${GREEN}📂 Creating directory structure...${NC}"
mkdir -p docs
mkdir -p scripts
mkdir -p backend
mkdir -p frontend

# Copy documentation files
echo -e "${GREEN}📄 Copying documentation...${NC}"
FILES_COPIED=0

if [ -f "$SOURCE_DIR/docs/PERFORMANCE_OPTIMIZATION_GUIDE.md" ]; then
    cp "$SOURCE_DIR/docs/PERFORMANCE_OPTIMIZATION_GUIDE.md" docs/
    echo "  ✓ PERFORMANCE_OPTIMIZATION_GUIDE.md"
    FILES_COPIED=$((FILES_COPIED+1))
fi

if [ -f "$SOURCE_DIR/docs/DEPLOYMENT_ALTERNATIVES_GUIDE.md" ]; then
    cp "$SOURCE_DIR/docs/DEPLOYMENT_ALTERNATIVES_GUIDE.md" docs/
    echo "  ✓ DEPLOYMENT_ALTERNATIVES_GUIDE.md"
    FILES_COPIED=$((FILES_COPIED+1))
fi

if [ -f "$SOURCE_DIR/docs/AWESOME_RESOURCES.md" ]; then
    cp "$SOURCE_DIR/docs/AWESOME_RESOURCES.md" docs/
    echo "  ✓ AWESOME_RESOURCES.md"
    FILES_COPIED=$((FILES_COPIED+1))
fi

if [ -f "$SOURCE_DIR/docs/PERFORMANCE_DEPLOYMENT_QUICK_REFERENCE.md" ]; then
    cp "$SOURCE_DIR/docs/PERFORMANCE_DEPLOYMENT_QUICK_REFERENCE.md" docs/
    echo "  ✓ PERFORMANCE_DEPLOYMENT_QUICK_REFERENCE.md"
    FILES_COPIED=$((FILES_COPIED+1))
fi

if [ -f "$SOURCE_DIR/docs/IMPLEMENTATION_SUMMARY.md" ]; then
    cp "$SOURCE_DIR/docs/IMPLEMENTATION_SUMMARY.md" docs/
    echo "  ✓ IMPLEMENTATION_SUMMARY.md"
    FILES_COPIED=$((FILES_COPIED+1))
fi

if [ -f "$SOURCE_DIR/QUICK_START.md" ]; then
    cp "$SOURCE_DIR/QUICK_START.md" .
    echo "  ✓ QUICK_START.md"
    FILES_COPIED=$((FILES_COPIED+1))
fi

# Copy Docker configuration
echo -e "${GREEN}🐳 Copying Docker configuration...${NC}"

if [ -f "$SOURCE_DIR/docker-compose.yml" ]; then
    cp "$SOURCE_DIR/docker-compose.yml" .
    echo "  ✓ docker-compose.yml"
    FILES_COPIED=$((FILES_COPIED+1))
fi

if [ -f "$SOURCE_DIR/.dockerignore" ]; then
    cp "$SOURCE_DIR/.dockerignore" .
    echo "  ✓ .dockerignore"
    FILES_COPIED=$((FILES_COPIED+1))
fi

if [ -f "$SOURCE_DIR/backend/Dockerfile" ]; then
    cp "$SOURCE_DIR/backend/Dockerfile" backend/
    echo "  ✓ backend/Dockerfile"
    FILES_COPIED=$((FILES_COPIED+1))
fi

if [ -f "$SOURCE_DIR/frontend/Dockerfile" ]; then
    cp "$SOURCE_DIR/frontend/Dockerfile" frontend/
    echo "  ✓ frontend/Dockerfile"
    FILES_COPIED=$((FILES_COPIED+1))
fi

if [ -f "$SOURCE_DIR/frontend/nginx.conf" ]; then
    cp "$SOURCE_DIR/frontend/nginx.conf" frontend/
    echo "  ✓ frontend/nginx.conf"
    FILES_COPIED=$((FILES_COPIED+1))
fi

# Copy scripts
echo -e "${GREEN}📜 Copying scripts...${NC}"

if [ -f "$SOURCE_DIR/scripts/deploy-docker.sh" ]; then
    cp "$SOURCE_DIR/scripts/deploy-docker.sh" scripts/
    chmod +x scripts/deploy-docker.sh
    echo "  ✓ deploy-docker.sh"
    FILES_COPIED=$((FILES_COPIED+1))
fi

if [ -f "$SOURCE_DIR/scripts/deploy-docker.bat" ]; then
    cp "$SOURCE_DIR/scripts/deploy-docker.bat" scripts/
    echo "  ✓ deploy-docker.bat"
    FILES_COPIED=$((FILES_COPIED+1))
fi

if [ -f "$SOURCE_DIR/scripts/backup-database.sh" ]; then
    cp "$SOURCE_DIR/scripts/backup-database.sh" scripts/
    chmod +x scripts/backup-database.sh
    echo "  ✓ backup-database.sh"
    FILES_COPIED=$((FILES_COPIED+1))
fi

# Create basic README
echo -e "${GREEN}📝 Creating README.md...${NC}"
cat > README.md << 'EOF'
# HR Portal: Performance & Deployment Guides

Performance optimization and deployment documentation for the Secure Renewals HR Portal.

## 📚 What's Inside

This repository contains comprehensive guides for:
- **Performance Optimization** - Tools and techniques from awesome lists
- **Deployment Alternatives** - Docker, On-Premise, Oracle Cloud Free, and more
- **Awesome Resources** - Curated tools for HR applications
- **Quick Reference** - TL;DR for common tasks

## 🚀 Quick Start

### Deploy with Docker (10 minutes)

**Linux/macOS:**
```bash
./scripts/deploy-docker.sh
```

**Windows:**
```bash
scripts\deploy-docker.bat
```

Access the application at http://localhost:5000

## 📖 Documentation

| Guide | Description |
|-------|-------------|
| [Quick Start](QUICK_START.md) | Fast track to deployment |
| [Performance Optimization](docs/PERFORMANCE_OPTIMIZATION_GUIDE.md) | Detailed performance guide |
| [Deployment Alternatives](docs/DEPLOYMENT_ALTERNATIVES_GUIDE.md) | Various deployment options |
| [Awesome Resources](docs/AWESOME_RESOURCES.md) | Tools from awesome lists |
| [Quick Reference](docs/PERFORMANCE_DEPLOYMENT_QUICK_REFERENCE.md) | Common commands |
| [Implementation Summary](docs/IMPLEMENTATION_SUMMARY.md) | What's included |

## 🐳 Docker Configuration

- `docker-compose.yml` - Multi-container orchestration
- `backend/Dockerfile` - Backend container configuration
- `frontend/Dockerfile` - Frontend container configuration
- `frontend/nginx.conf` - Production web server config

## 📜 Automation Scripts

- `scripts/deploy-docker.sh` - One-command deployment (Linux/macOS)
- `scripts/deploy-docker.bat` - One-command deployment (Windows)
- `scripts/backup-database.sh` - Automated database backups

## 🎯 Deployment Options

1. **Docker Desktop** - Local deployment ($0, 10 minutes)
2. **On-Premise Server** - Office deployment (hardware cost only)
3. **Oracle Cloud Free** - Cloud deployment ($0 forever)
4. **GitHub Codespaces** - Development environment

## 🔒 Privacy & Security

All deployment options prioritize data privacy:
- Self-hosted options keep data on your infrastructure
- No third-party SaaS exposure
- Suitable for sensitive HR data

## 📊 Performance Features

- Redis caching (10-50x faster)
- Database optimization (10-100x faster queries)
- Virtual scrolling (handle 10,000+ items)
- Response compression (70% smaller)
- Lazy loading (50% faster page loads)

## 💰 Cost Analysis

| Option | Cost |
|--------|------|
| Docker Desktop | $0 |
| On-Premise Server | Hardware only |
| Oracle Cloud Free | $0 forever |
| Azure Container | $30-50/month |

## 📚 Source

These guides were created as part of PR #79 in the [Secure-Renewals-2](https://github.com/ismaelloveexcel/Secure-Renewals-2) repository.

## 📄 License

MIT License
EOF

echo "  ✓ README.md created"

# Create .gitignore
echo -e "${GREEN}📝 Creating .gitignore...${NC}"
cat > .gitignore << 'EOF'
# Environment
.env
.env.local
.env.*.local

# Dependencies
node_modules/
__pycache__/
*.pyc
*.pyo
*.pyd

# Build outputs
dist/
build/
*.egg-info/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
logs/

# Database
*.sqlite
*.db

# Backups
backups/
EOF

echo "  ✓ .gitignore created"

# Summary
echo ""
echo -e "${GREEN}✅ Extraction Complete!${NC}"
echo ""
echo -e "${BLUE}📊 Summary:${NC}"
echo "  Files copied: $FILES_COPIED"
echo "  Destination: $DEST_DIR"
echo ""
echo -e "${YELLOW}📝 Next Steps:${NC}"
echo "  1. cd $DEST_DIR"
echo "  2. Review the files and README.md"
echo "  3. Create a new GitHub repository"
echo "  4. git add ."
echo "  5. git commit -m 'Initial commit: PR #79 performance and deployment guides'"
echo "  6. git remote add origin <your-new-repo-url>"
echo "  7. git push -u origin main"
echo ""
echo -e "${GREEN}🎉 Your new repository is ready!${NC}"
echo ""
