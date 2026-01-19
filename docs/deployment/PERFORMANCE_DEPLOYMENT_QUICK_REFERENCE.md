# Performance & Deployment Quick Reference

**For:** Secure Renewals HR Portal  
**Purpose:** Quick reference for performance and deployment options  
**Last Updated:** January 2025

---

## 🎯 Performance Quick Wins (30 Minutes)

### Backend (FastAPI)
```bash
# Add Redis caching
cd backend
uv pip install "redis[hiredis]>=5.0.1"
```

```python
# app/core/cache.py - Add caching service
from redis.asyncio import Redis

cache = Redis(host='localhost', port=6379)
```

**Impact:** 10-50x faster for repeated queries

### Frontend (React)
```typescript
// Add lazy loading for routes
const Dashboard = lazy(() => import('./pages/Dashboard'));

// Add debounce for search
const debouncedSearch = useDebounce(searchTerm, 300);
```

**Impact:** 50% faster page loads

### Database (PostgreSQL)
```sql
-- Add indexes for common queries
CREATE INDEX idx_renewals_status ON renewals (status);
CREATE INDEX idx_renewals_expiry ON renewals (contract_expiry_date);
```

**Impact:** 10-100x faster queries

---

## 🚀 Deployment Quick Start

### Option 1: Docker (RECOMMENDED)

**One command setup:**
```bash
# Linux/macOS
./scripts/deploy-docker.sh

# Windows
scripts\deploy-docker.bat
```

**Access:** http://localhost:5000

**Benefits:**
- ✅ Complete isolation
- ✅ Easy backup/restore
- ✅ Portable
- ✅ Production-ready

---

### Option 2: Local Desktop (Simplest)

```bash
# Backend
cd backend
uv sync
uv run uvicorn app.main:app --reload --port 8000

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

**Access:** http://localhost:5173

**Benefits:**
- ✅ No Docker needed
- ✅ Direct file access
- ✅ Fast development

---

### Option 3: On-Premise Server

**For:** 5-20 users needing shared access

```bash
# Install on Ubuntu Server
sudo apt update
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Deploy
git clone https://github.com/ismaelloveexcel/Secure-Renewals-2.git
cd Secure-Renewals-2
docker compose up -d
```

**Access:** http://your-server-ip:5000

**Benefits:**
- ✅ 24/7 availability
- ✅ Multi-user access
- ✅ No internet required

---

### Option 4: Oracle Cloud Free (Always Free)

**For:** Always-on cloud deployment, $0 cost

**Resources:**
- 4 ARM cores
- 24GB RAM
- 200GB storage
- **FREE FOREVER**

```bash
# After creating Oracle Cloud VM
ssh ubuntu@your-vm-ip
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
git clone https://github.com/ismaelloveexcel/Secure-Renewals-2.git
cd Secure-Renewals-2
docker compose up -d
```

**Benefits:**
- ✅ No hosting costs
- ✅ Professional cloud infrastructure
- ✅ Use your own domain

---

## 📊 Performance Monitoring

### Backend Metrics (Prometheus)
```python
# Add to backend
from prometheus_fastapi_instrumentator import Instrumentator
Instrumentator().instrument(app).expose(app)
```

**Metrics available at:** http://localhost:8000/metrics

### Frontend Metrics (Web Vitals)
```bash
cd frontend
npm install web-vitals
```

```typescript
import { getCLS, getFID, getLCP } from 'web-vitals';
getCLS(console.log);
getFID(console.log);
getLCP(console.log);
```

---

## 🔧 Maintenance Commands

### Docker Commands
```bash
# Start
docker compose up -d

# View logs
docker compose logs -f

# Stop
docker compose down

# Backup database
./scripts/backup-database.sh

# Update app
git pull && docker compose up -d --build
```

### Local Development
```bash
# Backend
cd backend
uv run pytest  # Run tests
uv run alembic upgrade head  # Run migrations

# Frontend
cd frontend
npm run lint  # Check code
npm run build  # Build production
```

---

## 📚 Performance Tools from Awesome Lists

| Tool | Purpose | Install |
|------|---------|---------|
| **Redis** | Caching | `docker pull redis:7-alpine` |
| **Locust** | Load testing | `pip install locust` |
| **Prometheus** | Monitoring | `docker pull prom/prometheus` |
| **Grafana** | Dashboards | `docker pull grafana/grafana` |

---

## 🎯 Quick Decision Guide

**Choose Docker if:**
- ✅ You want easy deployment
- ✅ You might deploy to cloud later
- ✅ You want clean isolation

**Choose Local Desktop if:**
- ✅ You're the only user
- ✅ You want simplest setup
- ✅ You're comfortable with terminal

**Choose On-Premise Server if:**
- ✅ You have 5-20 users
- ✅ You have office space
- ✅ You need 24/7 access

**Choose Oracle Cloud if:**
- ✅ You need cloud hosting
- ✅ You want $0 cost
- ✅ You need remote access

---

## 📖 Full Documentation

- 📚 [Performance Optimization Guide](PERFORMANCE_OPTIMIZATION_GUIDE.md)
- 🚀 [Deployment Alternatives Guide](DEPLOYMENT_ALTERNATIVES_GUIDE.md)
- 🐳 [GitHub Deployment Options](GITHUB_DEPLOYMENT_OPTIONS.md)

---

## 🆘 Quick Help

**Problem:** Slow queries  
**Solution:** Add database indexes (see Performance Guide)

**Problem:** High memory usage  
**Solution:** Add Redis caching (see Performance Guide)

**Problem:** Want to deploy but no server  
**Solution:** Use Docker Desktop locally (see Deployment Guide)

**Problem:** Need remote access  
**Solution:** Add Tailscale VPN (see Deployment Guide)

---

<p align="center">
  <strong>Fast, Secure, Private</strong><br>
  Performance meets Privacy
</p>
