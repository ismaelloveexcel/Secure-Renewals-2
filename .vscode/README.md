# VSCode Configuration

This directory contains Visual Studio Code configuration files that make development easier.

## Files Overview

### `settings.json`
Workspace-specific settings that configure:
- **Python**: Interpreter path, linting, formatting, testing
- **TypeScript**: SDK location, import behavior
- **Editor**: Auto-format, tab sizes, save actions
- **Tailwind CSS**: Class detection patterns
- **File Exclusions**: Hide unnecessary files from explorer
- **Terminal**: Environment variables (PYTHONPATH)

**Key Settings:**
- Python uses Black formatter
- TypeScript/React use Prettier
- Format on save enabled
- 4 spaces for Python, 2 spaces for JavaScript/TypeScript

### `tasks.json`
Pre-configured tasks accessible via `Ctrl+Shift+P` → "Tasks: Run Task"

**Available Tasks:**

| Category | Task | Description |
|----------|------|-------------|
| **Setup** | Install Backend Dependencies | Run `uv sync` |
| | Install Frontend Dependencies | Run `npm install` |
| **Development** | Run Backend (Development) | Start FastAPI with hot reload |
| | Run Frontend (Development) | Start Vite dev server |
| | Start Full Application | Run both backend and frontend |
| **Build** | Build Frontend | Production build to `backend/static` |
| **Database** | Database Migrations: Upgrade | Apply pending migrations |
| | Database Migrations: Create | Create new migration |
| | Database Migrations: Downgrade | Rollback last migration |
| **Quality** | Lint Backend (Type Check) | Run mypy |
| | Lint Frontend (Type Check) | Run TypeScript compiler |
| **Deployment** | Deploy to Azure | Run Azure deployment script |
| **Maintenance** | Clean Build Artifacts | Remove temporary files |

**Quick Access:**
- Default build task: Press `Ctrl+Shift+B`

### `launch.json`
Debug configurations accessible via `F5` or Debug panel

**Available Configurations:**

| Name | Type | Description |
|------|------|-------------|
| **Backend: FastAPI** | Python | Debug backend on port 8000 |
| **Backend: FastAPI (5001)** | Python | Debug backend on port 5001 (Replit mode) |
| **Backend: Run Alembic Migration** | Python | Debug database migrations |
| **Frontend: Launch Chrome** | Chrome | Debug React in Chrome browser |
| **Frontend: Attach to Chrome** | Chrome | Attach to existing Chrome instance |

**Compound Configurations:**
- **Full Stack: Debug** - Debug both backend and frontend simultaneously

**Debugging Tips:**
1. Set breakpoints by clicking left of line numbers
2. Press `F5` to start debugging
3. Use Debug Console to evaluate expressions
4. Check Variables panel for current scope
5. Step through code with `F10` (step over) and `F11` (step into)

### `extensions.json`
Recommended extensions for optimal development experience

**When you open the workspace, VSCode prompts to install these extensions:**

| Extension | Purpose |
|-----------|---------|
| Python | Python language support |
| Pylance | Fast Python language server |
| Black Formatter | Python code formatting |
| ESLint | JavaScript/TypeScript linting |
| Prettier | Code formatting |
| ES7 React Snippets | React code snippets |
| Tailwind CSS IntelliSense | Tailwind autocomplete |
| GitLens | Advanced Git features |
| PostgreSQL | Database management |
| REST Client | API testing from VSCode |
| Docker | Container support (optional) |
| Path Intellisense | Auto-complete file paths |
| IntelliCode | AI-assisted coding |
| Code Spell Checker | Spell checking in code |

**Installation:**
- Click "Install All" when prompted
- Or manually: `Ctrl+Shift+P` → "Extensions: Show Recommended Extensions"

### `api-tests.http`
REST Client file for testing API endpoints

**Usage:**
1. Install the REST Client extension
2. Open `api-tests.http`
3. Click "Send Request" above any request
4. View response in right panel

**Features:**
- Pre-configured base URL
- Authentication token storage
- All major endpoints covered
- Error testing scenarios included

**Example:**
```http
### Login
POST {{apiUrl}}/auth/login
Content-Type: application/json

{
  "employee_id": "EMP001",
  "password": "your-password"
}

### After login, store token and use in subsequent requests
@authToken = <your-token>

### Get Current User
GET {{apiUrl}}/auth/me
Authorization: Bearer {{authToken}}
```

## Quick Start

### First Time Setup
```bash
# 1. Open in VSCode
code .

# 2. Install recommended extensions (when prompted)

# 3. Run setup tasks
Ctrl+Shift+P → "Tasks: Run Task" → "Install Backend Dependencies"
Ctrl+Shift+P → "Tasks: Run Task" → "Install Frontend Dependencies"

# 4. Configure environment
# Edit backend/.env with your database URL
# Edit frontend/.env with API URL

# 5. Initialize database
Ctrl+Shift+P → "Tasks: Run Task" → "Database Migrations: Upgrade"
```

### Daily Development
```bash
# Start development
Ctrl+Shift+B (or Ctrl+Shift+P → "Tasks: Run Task" → "Start Full Application")

# Debug
F5 (select configuration)

# Test API
Open .vscode/api-tests.http and click "Send Request"
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+B` | Run default build task (Start Full Application) |
| `F5` | Start debugging |
| `Shift+F5` | Stop debugging |
| `F9` | Toggle breakpoint |
| `F10` | Step over (during debug) |
| `F11` | Step into (during debug) |
| `Ctrl+Shift+D` | Open Debug panel |
| `Ctrl+Shift+P` | Command Palette (access tasks) |
| `Ctrl+`` | Toggle terminal |
| `Ctrl+Shift+`` | New terminal |

## Customization

You can customize these files for your needs:

### Change Default Ports
Edit `tasks.json` and `launch.json`:
```json
// Change backend port from 8000 to 3000
"--port", "3000"

// Update frontend proxy in vite.config.ts
```

### Add New Tasks
Add to `tasks.json`:
```json
{
  "label": "My Custom Task",
  "type": "shell",
  "command": "your-command-here",
  "group": "build"
}
```

### Add Debug Configuration
Add to `launch.json`:
```json
{
  "name": "My Debug Config",
  "type": "debugpy",
  "request": "launch",
  "program": "${file}"
}
```

## Troubleshooting

### Settings Not Applied
- Reload window: `Ctrl+Shift+P` → "Developer: Reload Window"
- Check for conflicts with user settings

### Tasks Not Showing
- Verify `tasks.json` has valid JSON
- Reload window
- Check terminal output for errors

### Debug Not Working
- Check Python extension is installed
- Verify interpreter selected: `Ctrl+Shift+P` → "Python: Select Interpreter"
- Check `backend/.venv` exists

### Extensions Not Installing
- Check internet connection
- Manually install: `Ctrl+Shift+X` → Search → Install
- Check VSCode version is latest

## Additional Resources

- [VSCode Deployment Guide](../docs/deployment/VSCODE_DEPLOYMENT_GUIDE.md)
- [Documentation Index](../docs/README.md)
- [Main README](../README.md)
- [Contributing Guide](../CONTRIBUTING.md)

## Support

For issues with VSCode configuration:
1. Check [Troubleshooting](#troubleshooting) above
2. Review [VSCode Deployment Guide](../docs/deployment/VSCODE_DEPLOYMENT_GUIDE.md)
3. Open an issue on GitHub

---

**Happy Coding!** 🚀
