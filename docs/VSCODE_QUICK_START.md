# VSCode Quick Start Guide

Get up and running with Secure Renewals HR Portal in Visual Studio Code in 5 minutes!

## 🚀 Super Quick Start

```bash
# 1. Clone and open
git clone https://github.com/ismaelloveexcel/Secure-Renewals-2.git
cd Secure-Renewals-2
code .

# 2. Install extensions when prompted (click "Install All")

# 3. Setup backend
cd backend
uv sync
cp .env.example .env
# Edit .env with your database URL
uv run alembic upgrade head

# 4. Setup frontend
cd ../frontend
npm install
echo "VITE_API_BASE_URL=http://localhost:8000/api" > .env

# 5. Start development
# Press Ctrl+Shift+B in VSCode
```

## 📋 What You Get

### Instant Features
- ✅ **One-key build** - Press `Ctrl+Shift+B` to start everything
- ✅ **One-key debug** - Press `F5` to debug with breakpoints
- ✅ **Auto-complete** - Python, TypeScript, Tailwind CSS
- ✅ **API testing** - Built-in REST client (`.vscode/api-tests.http`)
- ✅ **Tasks menu** - All commands in one place

### Pre-configured Tasks
Press `Ctrl+Shift+P` → type "task" → see all available tasks:

| Task | What it does |
|------|--------------|
| **Start Full Application** | Runs both backend & frontend |
| **Run Backend** | FastAPI on port 8000 |
| **Run Frontend** | React on port 5000 |
| **Database Migrations: Upgrade** | Apply database changes |
| **Build Frontend** | Production build |
| **Deploy to Azure** | One-click deploy |

### Debug Configurations
Press `F5` and choose:
- **Backend: FastAPI** - Debug Python API
- **Frontend: Launch Chrome** - Debug React in Chrome
- **Full Stack: Debug** - Debug both at once

## 🎯 Common Workflows

### Starting Development
```
1. Open VSCode
2. Press Ctrl+Shift+B (runs backend + frontend)
3. Browser opens at http://localhost:5000
```

### Debugging an API Issue
```
1. Set breakpoint in Python file (click left of line number)
2. Press F5 → select "Backend: FastAPI"
3. Make API request from frontend or Swagger (http://localhost:8000/docs)
4. Code stops at breakpoint - inspect variables
```

### Testing API Endpoints
```
1. Open .vscode/api-tests.http
2. Update @authToken with your token
3. Click "Send Request" above any request
4. See response in right panel
```

### Creating a Database Migration
```
1. Modify models in backend/app/models/
2. Press Ctrl+Shift+P
3. Type "task" → "Database Migrations: Create"
4. Enter migration name
5. Run "Database Migrations: Upgrade"
```

### Building for Production
```
1. Press Ctrl+Shift+P
2. Type "task" → "Build Frontend"
3. Files created in backend/static/
4. Deploy backend folder to server
```

## 🔧 Keyboard Shortcuts Reference

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+B` | Build/Start app |
| `F5` | Start debugging |
| `Shift+F5` | Stop debugging |
| `F9` | Toggle breakpoint |
| `F10` | Step over |
| `F11` | Step into |
| `Ctrl+Shift+D` | Debug panel |
| `Ctrl+Shift+P` | Command palette |
| `Ctrl+`` | Toggle terminal |
| `Ctrl+Shift+`` | New terminal |
| `Ctrl+P` | Quick file open |
| `Ctrl+Shift+F` | Search in files |

## 🐛 Quick Troubleshooting

### "Module not found" error
```bash
cd backend
uv sync
# Reload VSCode window: Ctrl+Shift+P → "Reload Window"
```

### Port already in use
```bash
# Linux/Mac
lsof -i :8000
kill -9 <PID>

# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

### Python extension not working
```
1. Ctrl+Shift+P → "Python: Select Interpreter"
2. Choose backend/.venv/bin/python
3. Reload window
```

### Frontend not connecting to backend
Check these files have correct URLs:
- `frontend/.env` - Should have `VITE_API_BASE_URL=http://localhost:8000/api`
- `backend/.env` - Should have `ALLOWED_ORIGINS=http://localhost:5000`

## 📚 Need More Help?

- **Full Guide**: [VSCode Deployment Guide](VSCODE_DEPLOYMENT_GUIDE.md)
- **API Docs**: http://localhost:8000/docs (when backend running)
- **Contributing**: [CONTRIBUTING.md](../CONTRIBUTING.md)

## 🎉 You're Ready!

Press `Ctrl+Shift+B` and start coding! 🚀
