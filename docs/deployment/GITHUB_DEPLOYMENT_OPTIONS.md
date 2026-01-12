# GitHub Deployment Options Guide

> 📋 **Your Requirements:**
> - ❌ No personalized company domain available
> - ❌ Cannot use obvious third-party platforms (Replit, Vercel, Netlify) due to HR data sensitivity
> - ⚠️ Azure too complex for non-technical setup
> - ✅ Preferably under Microsoft ecosystem or locally on laptop

This guide presents deployment options available within GitHub and Microsoft ecosystem that meet your privacy and sensitivity requirements for an HR application.

---

## 📊 Quick Comparison

| Option | Cost | Privacy | Complexity | Best For |
|--------|------|---------|------------|----------|
| **Local Desktop (Recommended)** | Free | ⭐⭐⭐⭐⭐ | Easy | Solo HR user, maximum privacy |
| **GitHub Codespaces** | Free tier | ⭐⭐⭐⭐ | Easy | Development + temporary access |
| **Self-Hosted Runner** | Free | ⭐⭐⭐⭐⭐ | Medium | Your own laptop as server |
| **Azure Static Web Apps** | Free | ⭐⭐⭐ | Medium | Frontend only (limited) |

---

## 🏆 OPTION 1: Local Desktop Deployment (RECOMMENDED)

**Best for:** Solo HR user, maximum privacy, no external exposure

This runs the entire application on your laptop. Only accessible from your computer - no external access, no third-party domains.

### Setup Steps

#### Prerequisites
1. Install Python 3.11+: https://www.python.org/downloads/
2. Install Node.js 18+: https://nodejs.org/
3. Install PostgreSQL: https://www.postgresql.org/download/

#### Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/ismaelloveexcel/Secure-Renewals-2.git
cd Secure-Renewals-2

# 2. Setup backend
cd backend
pip install uv
uv sync
cp .env.example .env
# Edit .env with your database settings

# 3. Setup database
uv run alembic upgrade head

# 4. Start backend (Terminal 1)
uv run uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

# 5. Setup frontend (Terminal 2)
cd ../frontend
npm install
echo "VITE_API_BASE_URL=http://localhost:8000/api" > .env
npm run dev
```

#### Access URLs
- **Application:** http://localhost:5000
- **API Docs:** http://localhost:8000/docs

### Create Desktop Shortcut (Windows)

Create a batch file `start-hr-portal.bat`:

```batch
@echo off
title HR Portal Startup
cd /d "%~dp0"

echo Starting HR Portal...
echo.

:: Start Backend
start "Backend" cmd /k "cd backend && uv run uvicorn app.main:app --host 127.0.0.1 --port 8000"

:: Wait for backend to start
timeout /t 5

:: Start Frontend
start "Frontend" cmd /k "cd frontend && npm run dev"

:: Wait for frontend to start
timeout /t 5

:: Open browser
start http://localhost:5000

echo.
echo HR Portal is running!
echo Close this window to keep running, or press any key to exit.
pause
```

### Advantages
- ✅ **100% Private** - Data never leaves your computer
- ✅ **No subscription costs**
- ✅ **No third-party domains**
- ✅ **Works offline** (once data is loaded)
- ✅ **Simple to understand and maintain**
- ✅ **Auto-start available** - Can start automatically with Windows/macOS

### Considerations
- ⚠️ Only accessible from your laptop
- ⚠️ PostgreSQL must be running

### 🤖 Automated Installation (Recommended)

Run the installation script for a fully automated setup:

**Windows:**
```batch
scripts\install-windows.bat
```

**macOS/Linux:**
```bash
chmod +x scripts/install.sh
./scripts/install.sh
```

The installer will:
1. ✅ Check all prerequisites (Python, Node.js, npm)
2. ✅ Install UV package manager
3. ✅ Install backend dependencies
4. ✅ Install frontend dependencies
5. ✅ Configure environment files
6. ✅ Run database migrations
7. ✅ Optionally enable auto-start

### 🔄 Enable Auto-Start

Make the HR Portal start automatically when your computer boots:

**Windows:**
```batch
scripts\setup-autostart-windows.bat
```
Choose option 1 to enable auto-start. The portal will launch silently in the background.

**macOS:**
```bash
./scripts/setup-autostart-macos.sh enable
```
The portal will start automatically when you log in.

### Manual Start (if auto-start not enabled)

**Windows:**
```batch
scripts\start-portal-windows.bat
```

**macOS/Linux:**
```bash
./scripts/start-portal.sh
```

---

## 🔧 OPTION 2: GitHub Codespaces

**Best for:** Development environment that doubles as a private deployment

GitHub Codespaces runs in the cloud under Microsoft's infrastructure with a `.github.dev` or private URL that is not obviously an HR platform.

### Setup Steps

1. **Open Codespace:**
   - Go to your repository on GitHub
   - Click **Code** → **Codespaces** → **Create codespace on main**

2. **Configure the Codespace:**
   
   The repository already has a `.devcontainer` configuration. Once the Codespace starts:

   ```bash
   # Setup backend
   cd backend
   uv sync
   cp .env.example .env
   # Edit .env with your settings
   
   # Run migrations
   uv run alembic upgrade head
   
   # Start backend (Terminal 1)
   uv run uvicorn app.main:app --host 0.0.0.0 --port 8000
   
   # Start frontend (Terminal 2)
   cd ../frontend
   npm install
   npm run dev
   ```

3. **Access the Application:**
   - Click on the **Ports** tab at the bottom
   - Find port 5000 (frontend) and make it "Private" or "Private to Organization"
   - Click the URL to open

### Advantages
- ✅ **Microsoft infrastructure** (github.dev domain)
- ✅ **Private URLs** (not publicly visible)
- ✅ **60 hours/month free**
- ✅ **No setup on your laptop needed**
- ✅ **Pre-configured development environment**

### Considerations
- ⚠️ 60 hours/month free, then paid
- ⚠️ Codespace sleeps after 30 min idle
- ⚠️ Need internet connection

### Pricing
- Free: 60 hours/month on 2-core machine
- Paid: ~$0.18/hour for 2-core after free tier

---

## 🖥️ OPTION 3: Self-Hosted GitHub Actions Runner

**Best for:** Running on your own laptop/office server, triggered by GitHub

This option uses your laptop as a GitHub Actions self-hosted runner. The app runs on your machine but can be managed through GitHub.

### Setup Steps

#### 1. Register Self-Hosted Runner

1. Go to your repository → **Settings** → **Actions** → **Runners**
2. Click **New self-hosted runner**
3. Choose your OS (Windows/macOS/Linux)
4. Follow the commands to download and configure the runner:

```bash
# Example for Windows (PowerShell as Admin)
mkdir actions-runner; cd actions-runner
# Download the runner (follow GitHub's provided URL)
Invoke-WebRequest -Uri https://github.com/actions/runner/releases/download/v2.x.x/actions-runner-win-x64-2.x.x.zip -OutFile actions-runner.zip
Expand-Archive -Path actions-runner.zip
./config.cmd --url https://github.com/ismaelloveexcel/Secure-Renewals-2 --token YOUR_TOKEN
./run.cmd
```

#### 2. Create Self-Hosted Deployment Workflow

Create `.github/workflows/deploy-local.yml`:

```yaml
name: Deploy to Local Machine

on:
  workflow_dispatch:
    inputs:
      action:
        description: 'Action to perform'
        required: true
        default: 'start'
        type: choice
        options:
          - start
          - stop
          - restart

jobs:
  deploy-local:
    runs-on: self-hosted
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      
      - name: Install Backend Dependencies
        run: |
          cd backend
          pip install uv
          uv sync
      
      - name: Install Frontend Dependencies
        run: |
          cd frontend
          npm install
      
      - name: Start Application
        if: github.event.inputs.action == 'start'
        run: |
          # Stop any previously running instances (if PID files exist)
          if [ -f /tmp/hr_app_backend.pid ]; then
            echo "Stopping existing backend process..."
            kill "$(cat /tmp/hr_app_backend.pid)" 2>/dev/null || true
            rm -f /tmp/hr_app_backend.pid
          fi
          if [ -f /tmp/hr_app_frontend.pid ]; then
            echo "Stopping existing frontend process..."
            kill "$(cat /tmp/hr_app_frontend.pid)" 2>/dev/null || true
            rm -f /tmp/hr_app_frontend.pid
          fi

          # Backend (runs in background, PID tracked)
          cd backend
          nohup uv run uvicorn app.main:app --host 127.0.0.1 --port 8000 &
          echo $! > /tmp/hr_app_backend.pid
          
          # Frontend (runs in background, PID tracked)
          cd ../frontend
          nohup npm run dev &
          echo $! > /tmp/hr_app_frontend.pid
          
          echo "Application started!"
          echo "Frontend: http://localhost:5000"
          echo "Backend: http://localhost:8000"
      
      - name: Stop Application
        if: github.event.inputs.action == 'stop'
        run: |
          # Stop backend
          if [ -f /tmp/hr_app_backend.pid ]; then
            echo "Stopping backend..."
            kill "$(cat /tmp/hr_app_backend.pid)" 2>/dev/null || true
            rm -f /tmp/hr_app_backend.pid
          else
            echo "No backend PID file found; backend may not be running."
          fi

          # Stop frontend
          if [ -f /tmp/hr_app_frontend.pid ]; then
            echo "Stopping frontend..."
            kill "$(cat /tmp/hr_app_frontend.pid)" 2>/dev/null || true
            rm -f /tmp/hr_app_frontend.pid
          else
            echo "No frontend PID file found; frontend may not be running."
          fi
```

### Advantages
- ✅ **Runs on your hardware**
- ✅ **Managed through GitHub UI**
- ✅ **No external exposure**
- ✅ **Free unlimited usage**

### Considerations
- ⚠️ Laptop must be running for the app to work
- ⚠️ Initial setup is more technical
- ⚠️ Runner must stay registered

---

## 📄 OPTION 4: GitHub Pages (Frontend Only)

**Best for:** Static frontend with no backend requirements

GitHub Pages can host the frontend under a `username.github.io` domain. However, this is **limited for your HR app** because it requires a backend.

### When to Use
- Read-only dashboards
- Static employee directories
- Document portals (PDF viewers)

### Setup
```yaml
# .github/workflows/pages.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pages: write
      id-token: write
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      
      - name: Install and Build
        run: |
          cd frontend
          npm install
          npm run build
      
      - name: Upload Pages artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: frontend/dist
      
      - name: Deploy to Pages
        uses: actions/deploy-pages@v4
```

### Considerations
- ⚠️ **No backend support** - API calls will fail
- ⚠️ Public domain (github.io)
- ✅ Free and fast

---

## 🔒 OPTION 5: Private Network with Tailscale/ZeroTier

**Best for:** Accessing your laptop from other trusted devices privately

If you want to access the app running on your laptop from other devices (e.g., your phone, another computer), you can use a private VPN mesh network.

### Setup with Tailscale (Microsoft-connected)

1. **Install Tailscale** on your laptop: https://tailscale.com/download
2. **Sign in with Microsoft account** (integrates with Azure AD)
3. **Install on other devices** you want to access from
4. **Start the app on your laptop**
5. **Access from other device** using the Tailscale IP (e.g., `http://100.x.x.x:5000`)

### Advantages
- ✅ **Private mesh VPN** - No public exposure
- ✅ **Microsoft SSO integration**
- ✅ **Access from phone/tablet**
- ✅ **Free for personal use**

---

## 🎯 RECOMMENDATION SUMMARY

Based on your requirements:

### If you're the only user → **Option 1: Local Desktop**
- Simplest setup
- 100% private
- No ongoing costs
- No third-party domains

### If you need occasional remote access → **Option 1 + Option 5 (Tailscale)**
- Local app with private VPN access
- Access from phone/tablet
- Still no public exposure

### If you want cloud backup/flexibility → **Option 2: GitHub Codespaces**
- Microsoft infrastructure
- Private URLs
- 60 hours/month free

---

## 📋 Quick Start Checklist

### Local Desktop Setup

- [ ] Install Python 3.11+
- [ ] Install Node.js 18+
- [ ] Install PostgreSQL
- [ ] Clone repository
- [ ] Configure `.env` files
- [ ] Run database migrations
- [ ] Start backend and frontend
- [ ] Create desktop shortcut (optional)
- [ ] Access http://localhost:5000

### Need Help?

- 📖 [VSCode Deployment Guide](VSCODE_DEPLOYMENT_GUIDE.md)
- 📖 [Contributing Guide](../CONTRIBUTING.md)
- 📖 [HR User Guide](HR_USER_GUIDE.md)

---

## 🔄 Comparison with Rejected Options

| Platform | Why Not Suitable |
|----------|------------------|
| **Replit** | Hidden costs, obvious domain (replit.dev) |
| **Vercel** | Obvious domain (vercel.app), public-facing |
| **Netlify** | Obvious domain (netlify.app), public-facing |
| **Azure App Service** | Complex setup for non-technical users |
| **Heroku** | Obvious domain (herokuapp.com), paid |

---

<p align="center">
  <strong>Secure Renewals HR Portal</strong><br>
  Built with ❤️ for HR teams
</p>
