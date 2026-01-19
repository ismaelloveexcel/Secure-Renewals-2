# Visual Studio Code Deployment Guide

This guide explains how to develop, debug, and deploy the Secure Renewals HR Portal using Visual Studio Code.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [Development Workflow](#development-workflow)
- [Debugging](#debugging)
- [Deployment](#deployment)
- [Useful Commands](#useful-commands)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

1. **Visual Studio Code** (latest version)
   - Download: https://code.visualstudio.com/

2. **Python 3.11+**
   - Download: https://www.python.org/downloads/
   - Verify: `python --version` or `python3 --version`

3. **Node.js 18+**
   - Download: https://nodejs.org/
   - Verify: `node --version`

4. **UV Package Manager** (Python)
   - Install: `pip install uv` or `curl -LsSf https://astral.sh/uv/install.sh | sh`
   - Verify: `uv --version`

5. **PostgreSQL** (or access to a PostgreSQL database)
   - Download: https://www.postgresql.org/download/
   - Or use a cloud provider (Azure Database, AWS RDS, etc.)

### Recommended VSCode Extensions

The workspace includes a recommended extensions list. When you open the project, VSCode will prompt you to install them. Click "Install All" to get:

- **Python** - Python language support
- **Pylance** - Fast Python language server
- **Black Formatter** - Python code formatter
- **ESLint** - JavaScript/TypeScript linting
- **Prettier** - Code formatter
- **Tailwind CSS IntelliSense** - Tailwind autocomplete
- **GitLens** - Git supercharged
- **PostgreSQL** - Database management
- **REST Client** - Test APIs from VSCode

---

## Initial Setup

### 1. Clone and Open the Repository

```bash
# Clone the repository
git clone https://github.com/ismaelloveexcel/Secure-Renewals-2.git
cd Secure-Renewals-2

# Open in VSCode
code .
```

Alternatively, open the **workspace file** for a better multi-folder experience:

```bash
code secure-renewals.code-workspace
```

### 2. Install Backend Dependencies

**Option A: Using VSCode Task**
- Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
- Type "Tasks: Run Task"
- Select "Install Backend Dependencies"

**Option B: Using Terminal**
```bash
cd backend
uv sync
```

This creates a virtual environment and installs all Python dependencies.

### 3. Install Frontend Dependencies

**Option A: Using VSCode Task**
- Press `Ctrl+Shift+P`
- Type "Tasks: Run Task"
- Select "Install Frontend Dependencies"

**Option B: Using Terminal**
```bash
cd frontend
npm install
```

### 4. Configure Environment Variables

#### Backend Configuration

1. Copy the example environment file:
   ```bash
   cd backend
   cp .env.example .env
   ```

2. Edit `backend/.env` with your settings:
   ```env
   # Database
   DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/secure_renewals
   
   # Authentication
   AUTH_SECRET_KEY=your-secret-key-here
   AUTH_ISSUER=https://login.microsoftonline.com/<tenant-id>/v2.0
   AUTH_AUDIENCE=api://secure-renewals
   AUTH_JWKS_URL=https://login.microsoftonline.com/<tenant-id>/discovery/v2.0/keys
   
   # CORS
   ALLOWED_ORIGINS=http://localhost:5000,http://localhost:5173
   
   # Development
   DEV_MODE=true
   ```

#### Frontend Configuration

1. Create `frontend/.env`:
   ```bash
   cd frontend
   echo "VITE_API_BASE_URL=http://localhost:8000/api" > .env
   ```

### 5. Initialize Database

**Option A: Using VSCode Task**
- Press `Ctrl+Shift+P`
- Type "Tasks: Run Task"
- Select "Database Migrations: Upgrade"

**Option B: Using Terminal**
```bash
cd backend
uv run alembic upgrade head
```

---

## Development Workflow

### Starting the Application

#### Quick Start: Run Both Frontend & Backend

**Option 1: Using Default Build Task**
- Press `Ctrl+Shift+B` (or `Cmd+Shift+B` on Mac)
- This runs the "Start Full Application" task

**Option 2: Using Task Menu**
- Press `Ctrl+Shift+P`
- Type "Tasks: Run Task"
- Select "Start Full Application"

This starts:
- Backend on `http://localhost:8000`
- Frontend on `http://localhost:5000`

#### Start Services Individually

**Backend Only:**
- Task: "Run Backend (Development)"
- URL: http://localhost:8000
- API Docs: http://localhost:8000/docs

**Frontend Only:**
- Task: "Run Frontend (Development)"
- URL: http://localhost:5000

### Building for Production

**Build Frontend:**
- Task: "Build Frontend"
- Or: `cd frontend && npm run build`
- Output: `backend/static/` (configured in Vite)

---

## Debugging

### Debug Backend (FastAPI)

1. **Set Breakpoints** in Python files (click left of line number)

2. **Start Debugging:**
   - Press `F5`
   - Or go to Run and Debug panel (`Ctrl+Shift+D`)
   - Select "Backend: FastAPI"
   - Click green play button

3. **Make API requests** from frontend or using tools like:
   - Browser: http://localhost:8000/docs (Swagger UI)
   - VSCode REST Client (create `.http` files)
   - Postman/Insomnia

4. **Debugging Tips:**
   - Use `justMyCode: false` in launch.json to step into libraries
   - Check Variables panel for current scope
   - Use Debug Console for evaluating expressions
   - Watch expressions in Watch panel

### Debug Frontend (React)

1. **Method 1: Chrome DevTools**
   - Start frontend: `npm run dev`
   - Open Chrome DevTools (`F12`)
   - Use Sources tab to set breakpoints
   - Check Console for logs

2. **Method 2: VSCode Chrome Debugger**
   - Start frontend first
   - Press `F5` and select "Frontend: Launch Chrome"
   - Set breakpoints in `.tsx` files
   - Chrome opens with debugger attached

### Full Stack Debugging

Use the **"Full Stack: Debug"** compound configuration:
- Press `F5`
- Select "Full Stack: Debug"
- Both backend and frontend start with debugging enabled

---

## Deployment

### Deployment Options

#### 1. Replit (Easiest - Already Configured)

The app is pre-configured for Replit:

1. Import repo to Replit workspace
2. Configure Secrets in Replit
3. Click Run button
4. Done!

See main [README.md](../README.md#deployment) for details.

#### 2. Azure App Service

Use the provided deployment script:

**Option A: Using VSCode Task**
- Task: "Deploy to Azure"

**Option B: Using Terminal**
```bash
bash deploy_to_azure.sh
```

**Prerequisites:**
- Azure CLI installed: https://learn.microsoft.com/en-us/cli/azure/install-azure-cli
- Azure account and login: `az login`

The script creates:
- Resource Group
- App Service Plan
- Web App
- Configures GitHub deployment

#### 3. Docker (Future)

Docker support can be added if needed. Basic Dockerfile structure:

```dockerfile
# Backend
FROM python:3.11-slim
WORKDIR /app
COPY backend/pyproject.toml backend/uv.lock ./
RUN pip install uv && uv sync
COPY backend/ ./
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### 4. Manual VPS/Server Deployment

1. **Install dependencies** on server
2. **Copy repository** files
3. **Setup systemd service** for backend:

```ini
[Unit]
Description=Secure Renewals Backend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/secure-renewals/backend
Environment="PATH=/var/www/secure-renewals/backend/.venv/bin"
ExecStart=/var/www/secure-renewals/backend/.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

4. **Setup nginx** as reverse proxy
5. **Configure SSL** with Let's Encrypt

---

## Useful Commands

### VSCode Tasks (Press `Ctrl+Shift+P` → "Tasks: Run Task")

| Task | Description |
|------|-------------|
| Install Backend Dependencies | Run `uv sync` in backend |
| Install Frontend Dependencies | Run `npm install` in frontend |
| Run Backend (Development) | Start FastAPI with hot reload |
| Run Frontend (Development) | Start Vite dev server |
| Build Frontend | Build production React app |
| Database Migrations: Upgrade | Apply pending database migrations |
| Database Migrations: Create | Create new migration from model changes |
| Database Migrations: Downgrade | Rollback last migration |
| Lint Backend (Type Check) | Run mypy type checking |
| Lint Frontend (Type Check) | Run TypeScript compiler check |
| Start Full Application | Start both backend and frontend |
| Deploy to Azure | Run Azure deployment script |
| Clean Build Artifacts | Remove build files and caches |

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+B` | Run default build task |
| `F5` | Start debugging |
| `Ctrl+Shift+D` | Open Debug panel |
| `Ctrl+Shift+P` | Command Palette |
| `Ctrl+`` | Toggle terminal |
| `Ctrl+Shift+`` | New terminal |
| `Ctrl+K Ctrl+T` | Change theme |
| `Ctrl+,` | Open settings |

### Terminal Commands

```bash
# Backend
cd backend
uv sync                              # Install dependencies
uv run uvicorn app.main:app --reload # Start dev server
uv run alembic upgrade head          # Run migrations
uv run alembic revision --autogenerate -m "message" # Create migration
uv run pytest                        # Run tests (if configured)

# Frontend
cd frontend
npm install                          # Install dependencies
npm run dev                          # Start dev server
npm run build                        # Build for production
npm run lint                         # Type check

# Database
psql -U postgres -d secure_renewals  # Connect to database
```

---

## Troubleshooting

### Python Module Not Found

**Problem:** `ModuleNotFoundError: No module named 'app'`

**Solutions:**
1. Ensure you're in backend directory: `cd backend`
2. Check virtual environment is activated
3. Verify PYTHONPATH is set (VSCode should do this automatically)
4. Reinstall: `uv sync`

### Port Already in Use

**Problem:** `Address already in use: Port 8000/5000`

**Solutions:**
1. Find process: `lsof -i :8000` (Mac/Linux) or `netstat -ano | findstr :8000` (Windows)
2. Kill process: `kill -9 <PID>` (Mac/Linux) or `taskkill /PID <PID> /F` (Windows)
3. Or use different ports in configuration

### Database Connection Failed

**Problem:** `could not connect to server: Connection refused`

**Solutions:**
1. Check PostgreSQL is running: `pg_isready`
2. Verify DATABASE_URL in `.env`
3. Check firewall settings
4. Ensure database exists: `createdb secure_renewals`

### Frontend Not Connecting to Backend

**Problem:** API calls fail with CORS or connection errors

**Solutions:**
1. Check backend is running on correct port
2. Verify `VITE_API_BASE_URL` in `frontend/.env`
3. Check `ALLOWED_ORIGINS` in `backend/.env` includes frontend URL
4. Clear browser cache

### VSCode Python Extension Issues

**Problem:** Python extension not recognizing virtual environment

**Solutions:**
1. Press `Ctrl+Shift+P` → "Python: Select Interpreter"
2. Choose the interpreter in `backend/.venv/bin/python`
3. Reload window: `Ctrl+Shift+P` → "Developer: Reload Window"

### TypeScript Errors in Frontend

**Problem:** "Cannot find module" or type errors

**Solutions:**
1. Ensure dependencies installed: `cd frontend && npm install`
2. Restart TypeScript server: `Ctrl+Shift+P` → "TypeScript: Restart TS Server"
3. Check `tsconfig.json` configuration

### Build Artifacts Taking Up Space

**Solution:**
- Run Task: "Clean Build Artifacts"
- Or manually: `rm -rf frontend/dist backend/static backend/__pycache__`

---

## Additional Resources

- [Main README](../README.md) - Project overview
- [Contributing Guide](../CONTRIBUTING.md) - Development setup and best practices
- [HR User Guide](HR_USER_GUIDE.md) - For end users
- [API Documentation](http://localhost:8000/docs) - When backend is running

---

## Quick Reference Card

### Start Development
```bash
# Terminal 1 - Backend
cd backend && uv run uvicorn app.main:app --reload

# Terminal 2 - Frontend
cd frontend && npm run dev
```

### Access Application
- Frontend: http://localhost:5000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Common Tasks
- Debug: Press `F5`
- Build: Press `Ctrl+Shift+B`
- Tasks: Press `Ctrl+Shift+P` → "Tasks: Run Task"
- Terminal: Press `Ctrl+``

---

**Need Help?**
- Check [Troubleshooting](#troubleshooting) section
- Review [Contributing Guide](../CONTRIBUTING.md)
- Open an issue on GitHub
