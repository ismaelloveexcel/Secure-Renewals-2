#!/bin/bash

################################################################################
# Create New Lean Repository Script
# 
# Purpose: Copy only essential files to a new repository for Azure deployment
# Excludes: docs, attached_assets, scripts, .github, .vscode, etc.
# Result: 80-90% size reduction (50+ MB → 2-5 MB)
################################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory and source repository
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_REPO="$(cd "$SCRIPT_DIR/.." && pwd)"

################################################################################
# Functions
################################################################################

print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

################################################################################
# Main Script
################################################################################

print_header "Secure Renewals - New Repository Creation"

echo "This script will create a new lean repository containing only"
echo "the essential files needed for Azure deployment."
echo ""
echo "What gets copied:"
echo "  ✓ backend/          - FastAPI application"
echo "  ✓ frontend/         - React application"
echo "  ✓ .streamlit/       - Configuration"
echo "  ✓ .gitignore        - Git ignore rules"
echo "  ✓ pyproject.toml    - Python dependencies"
echo "  ✓ uv.lock           - Dependency lock"
echo "  ✓ deploy_to_azure.sh - Deployment script"
echo ""
echo "What gets excluded:"
echo "  ✗ docs/             - Documentation (35+ files)"
echo "  ✗ attached_assets/  - Reference files (180+ files, 50+ MB)"
echo "  ✗ scripts/          - Development scripts"
echo "  ✗ .github/          - GitHub configs"
echo "  ✗ .vscode/          - VSCode configs"
echo "  ✗ .devcontainer/    - DevContainer configs"
echo "  ✗ Root docs         - README, CONTRIBUTING, etc."
echo ""

# Prompt for target directory
read -p "Enter target directory name (default: ../secure-renewals-production): " TARGET_DIR
TARGET_DIR=${TARGET_DIR:-"../secure-renewals-production"}

# Expand to absolute path
TARGET_DIR="$(cd "$(dirname "$TARGET_DIR")" 2>/dev/null && pwd)/$(basename "$TARGET_DIR")" || TARGET_DIR="$TARGET_DIR"

# Check if target directory exists
if [ -d "$TARGET_DIR" ]; then
    print_error "Target directory already exists: $TARGET_DIR"
    read -p "Do you want to remove it and continue? (y/N): " CONFIRM
    if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
        print_error "Aborted."
        exit 1
    fi
    rm -rf "$TARGET_DIR"
    print_success "Removed existing directory"
fi

# Create target directory
print_info "Creating target directory: $TARGET_DIR"
mkdir -p "$TARGET_DIR"
print_success "Created target directory"

# Copy essential directories
print_header "Copying Essential Files"

print_info "Copying backend/..."
cp -r "$SOURCE_REPO/backend" "$TARGET_DIR/"
print_success "Copied backend/"

print_info "Copying frontend/..."
cp -r "$SOURCE_REPO/frontend" "$TARGET_DIR/"
print_success "Copied frontend/"

print_info "Copying .streamlit/..."
if [ -d "$SOURCE_REPO/.streamlit" ]; then
    cp -r "$SOURCE_REPO/.streamlit" "$TARGET_DIR/"
    print_success "Copied .streamlit/"
else
    print_warning ".streamlit/ not found, skipped"
fi

# Copy root configuration files
print_info "Copying root configuration files..."
cp "$SOURCE_REPO/.gitignore" "$TARGET_DIR/" 2>/dev/null || print_warning ".gitignore not found"
cp "$SOURCE_REPO/pyproject.toml" "$TARGET_DIR/" 2>/dev/null || print_warning "pyproject.toml not found"
cp "$SOURCE_REPO/uv.lock" "$TARGET_DIR/" 2>/dev/null || print_warning "uv.lock not found"
cp "$SOURCE_REPO/deploy_to_azure.sh" "$TARGET_DIR/" 2>/dev/null || print_warning "deploy_to_azure.sh not found"

# Make deploy script executable
if [ -f "$TARGET_DIR/deploy_to_azure.sh" ]; then
    chmod +x "$TARGET_DIR/deploy_to_azure.sh"
fi

print_success "Copied root configuration files"

# Clean up any node_modules or build artifacts that might have been copied
print_info "Cleaning up build artifacts..."
rm -rf "$TARGET_DIR/frontend/node_modules" 2>/dev/null || true
rm -rf "$TARGET_DIR/frontend/dist" 2>/dev/null || true
rm -rf "$TARGET_DIR/backend/static" 2>/dev/null || true
rm -rf "$TARGET_DIR/backend/__pycache__" 2>/dev/null || true
find "$TARGET_DIR" -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find "$TARGET_DIR" -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
find "$TARGET_DIR" -type f -name "*.pyc" -delete 2>/dev/null || true
print_success "Cleaned up build artifacts"

# Initialize git repository (optional)
print_header "Git Initialization"
read -p "Initialize git repository? (Y/n): " INIT_GIT
INIT_GIT=${INIT_GIT:-"y"}

if [ "$INIT_GIT" = "y" ] || [ "$INIT_GIT" = "Y" ]; then
    cd "$TARGET_DIR"
    git init
    print_success "Initialized git repository"
    
    # Optional: Create initial commit
    read -p "Create initial commit? (Y/n): " INITIAL_COMMIT
    INITIAL_COMMIT=${INITIAL_COMMIT:-"y"}
    
    if [ "$INITIAL_COMMIT" = "y" ] || [ "$INITIAL_COMMIT" = "Y" ]; then
        git add .
        git commit -m "Initial commit - production files only"
        print_success "Created initial commit"
    fi
fi

# Create minimal README (optional)
print_header "README Creation"
read -p "Create minimal README.md? (Y/n): " CREATE_README
CREATE_README=${CREATE_README:-"y"}

if [ "$CREATE_README" = "y" ] || [ "$CREATE_README" = "Y" ]; then
    cat > "$TARGET_DIR/README.md" << 'EOF'
# Secure Renewals HR Portal - Production

Production-ready deployment of the Secure Renewals HR Portal.

## Quick Start

### Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your settings
uv sync
uv run alembic upgrade head
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**API Docs:** http://localhost:8000/docs

### Frontend Setup

```bash
cd frontend
npm install
echo "VITE_API_BASE_URL=http://localhost:8000/api" > .env
npm run dev
```

**App:** http://localhost:5173

### Build Production Frontend

```bash
cd frontend
npm run build
# Output: backend/static/
```

## Deployment

### Azure Deployment

See `deploy_to_azure.sh` for deployment instructions.

### Environment Variables

**Backend (.env):**
- `DATABASE_URL` - PostgreSQL connection string (postgresql+asyncpg://...)
- `AUTH_ISSUER` - Authentication issuer URL
- `AUTH_AUDIENCE` - API audience identifier
- `AUTH_JWKS_URL` - JWKS endpoint URL
- `ALLOWED_ORIGINS` - Comma-separated allowed origins

**Frontend (.env):**
- `VITE_API_BASE_URL` - Backend API URL

## Technology Stack

| Layer | Technology |
|-------|------------|
| **Backend** | Python 3.11+, FastAPI, SQLAlchemy, Alembic |
| **Frontend** | React 18, TypeScript, Vite, TailwindCSS |
| **Database** | PostgreSQL (asyncpg driver) |
| **Auth** | JWT-based authentication |

## License

ISC License
EOF

    print_success "Created README.md"
    
    # Add README to git if initialized
    if [ "$INIT_GIT" = "y" ] || [ "$INIT_GIT" = "Y" ]; then
        cd "$TARGET_DIR"
        git add README.md
        git commit -m "Add minimal README" 2>/dev/null || true
    fi
fi

# Generate summary report
print_header "Summary Report"

SOURCE_FILE_COUNT=$(find "$SOURCE_REPO" -type f 2>/dev/null | wc -l | xargs)
TARGET_FILE_COUNT=$(find "$TARGET_DIR" -type f 2>/dev/null | wc -l | xargs)

SOURCE_SIZE=$(du -sh "$SOURCE_REPO" 2>/dev/null | cut -f1)
TARGET_SIZE=$(du -sh "$TARGET_DIR" 2>/dev/null | cut -f1)

echo ""
echo "Source Repository: $SOURCE_REPO"
echo "  Files: $SOURCE_FILE_COUNT"
echo "  Size:  $SOURCE_SIZE"
echo ""
echo "New Repository: $TARGET_DIR"
echo "  Files: $TARGET_FILE_COUNT"
echo "  Size:  $TARGET_SIZE"
echo ""

REDUCTION_PERCENT=$(echo "scale=1; (($SOURCE_FILE_COUNT - $TARGET_FILE_COUNT) * 100) / $SOURCE_FILE_COUNT" | bc 2>/dev/null || echo "N/A")
echo "Reduction: $REDUCTION_PERCENT% fewer files"

print_success "Repository created successfully!"

# Next steps
print_header "Next Steps"

echo "1. Verify the structure:"
echo "   cd $TARGET_DIR"
echo "   ls -la"
echo ""
echo "2. Set up backend:"
echo "   cd $TARGET_DIR/backend"
echo "   cp .env.example .env"
echo "   # Edit .env with your settings"
echo "   uv sync"
echo "   uv run alembic upgrade head"
echo ""
echo "3. Set up frontend:"
echo "   cd $TARGET_DIR/frontend"
echo "   npm install"
echo "   echo \"VITE_API_BASE_URL=http://localhost:8000/api\" > .env"
echo ""
echo "4. Push to GitHub:"
echo "   cd $TARGET_DIR"
echo "   git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""

print_success "Done! Your new lean repository is ready at: $TARGET_DIR"
echo ""
