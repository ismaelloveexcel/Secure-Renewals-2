# Deployment Alternatives Guide

**For:** Secure Renewals HR Portal  
**Purpose:** Privacy-focused deployment options beyond Azure  
**Focus:** Self-hosted, on-premise, and Microsoft-adjacent solutions  
**Last Updated:** January 2025

---

## 🎯 Executive Summary

This guide provides deployment alternatives that prioritize **data privacy** and **cost control** for HR applications handling sensitive employee data. All options avoid obvious third-party domains while maintaining professional deployment standards.

**Key Requirements:**
- ✅ Data privacy (no obvious third-party exposure)
- ✅ Professional appearance (no `replit.dev`, `vercel.app` domains)
- ✅ Cost-effective or free
- ✅ Easy to maintain for non-technical users

---

## 📊 Deployment Options Comparison

| Option | Privacy | Cost | Complexity | Maintenance | Best For |
|--------|---------|------|------------|-------------|----------|
| **Local Desktop** | ⭐⭐⭐⭐⭐ | Free | ⭐ Easy | Low | Solo HR user |
| **Docker Desktop** | ⭐⭐⭐⭐⭐ | Free | ⭐⭐ Medium | Low | Local with portability |
| **On-Premise Server** | ⭐⭐⭐⭐⭐ | Hardware only | ⭐⭐⭐ Medium | Medium | Small office (5-20 users) |
| **Proxmox VE** | ⭐⭐⭐⭐⭐ | Free | ⭐⭐⭐ Advanced | Medium | Tech-savvy IT team |
| **GitHub Codespaces** | ⭐⭐⭐⭐ | $9-18/mo | ⭐ Easy | Low | Temporary/development |
| **Oracle Cloud Free** | ⭐⭐⭐⭐ | Free forever | ⭐⭐⭐ Medium | Medium | Always-on cloud |
| **Azure Container** | ⭐⭐⭐ | $30-50/mo | ⭐⭐⭐ Medium | Low | Microsoft ecosystem |

---

## 🏆 OPTION 1: Docker Desktop (RECOMMENDED)

**Best for:** Local deployment with easy portability and isolation

Docker containers provide a clean, isolated environment that runs consistently across different machines. This is the modern standard for application deployment.

### Why Docker?

- ✅ **Complete Isolation** - App runs in its own container, no conflicts
- ✅ **One-Command Start** - `docker compose up` starts everything
- ✅ **Easy Backup** - Backup data volumes for disaster recovery
- ✅ **Portable** - Move to another machine easily
- ✅ **Production-Ready** - Same setup works in cloud later

### Setup Instructions

#### 1. Install Docker Desktop

**Windows/macOS:**
1. Download from https://www.docker.com/products/docker-desktop
2. Install and start Docker Desktop
3. Verify: Open terminal and run `docker --version`

**Linux:**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

#### 2. Create Docker Configuration

Create `docker-compose.yml` in the project root:

```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:16-alpine
    container_name: hr_portal_db
    environment:
      POSTGRES_DB: secure_renewals
      POSTGRES_USER: hruser
      POSTGRES_PASSWORD: ${DB_PASSWORD:-changeme123}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U hruser"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis Cache (for performance)
  redis:
    image: redis:7-alpine
    container_name: hr_portal_redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

  # Backend API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: hr_portal_backend
    environment:
      DATABASE_URL: postgresql+asyncpg://hruser:${DB_PASSWORD:-changeme123}@postgres:5432/secure_renewals
      REDIS_URL: redis://redis:6379
      AUTH_SECRET_KEY: ${AUTH_SECRET_KEY}
    ports:
      - "8000:8000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started
    volumes:
      - ./backend:/app
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000

  # Frontend
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: hr_portal_frontend
    environment:
      VITE_API_BASE_URL: http://localhost:8000/api
    ports:
      - "5000:80"
    depends_on:
      - backend

volumes:
  postgres_data:
  redis_data:
```

#### 3. Create Backend Dockerfile

```dockerfile
# backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install UV package manager
RUN pip install uv

# Copy dependency files
COPY pyproject.toml uv.lock ./

# Install dependencies
RUN uv sync --frozen

# Copy application code
COPY . .

# Run migrations on startup
CMD uv run alembic upgrade head && \
    uv run uvicorn app.main:app --host 0.0.0.0 --port 8000
```

#### 4. Create Frontend Dockerfile

```dockerfile
# frontend/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build production bundle
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files to nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### 5. Create Nginx Configuration

```nginx
# frontend/nginx.conf
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/css application/javascript application/json;
    
    # SPA routing - serve index.html for all routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### 6. Create Environment File

```bash
# .env
DB_PASSWORD=your_secure_password_here
AUTH_SECRET_KEY=your_auth_secret_key_here
```

#### 7. Start the Application

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f

# Stop all services
docker compose down
```

#### 8. Access the Application

- **Frontend:** http://localhost:5000
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs

### Docker Desktop Management

**Start on System Boot:**
1. Open Docker Desktop settings
2. Enable "Start Docker Desktop when you log in"

**Update Application:**
```bash
# Pull latest code
git pull

# Rebuild and restart
docker compose up -d --build
```

**Backup Data:**
```bash
# Backup database
docker exec hr_portal_db pg_dump -U hruser secure_renewals > backup.sql

# Backup volumes
docker run --rm -v hr_portal_postgres_data:/data -v $(pwd):/backup \
  alpine tar czf /backup/postgres_backup.tar.gz /data
```

**Restore Data:**
```bash
# Restore database
docker exec -i hr_portal_db psql -U hruser secure_renewals < backup.sql
```

---

## 🖥️ OPTION 2: On-Premise Physical Server

**Best for:** Small office with 5-20 users needing shared access

Deploy on a dedicated computer in your office that acts as a server. This could be an old desktop, a small server, or a NAS device.

### Hardware Requirements

**Minimum:**
- CPU: Intel i5 or equivalent (4+ cores)
- RAM: 8GB
- Storage: 256GB SSD
- Network: Gigabit Ethernet

**Recommended:**
- CPU: Intel i7 or equivalent (6+ cores)
- RAM: 16GB
- Storage: 512GB SSD
- Network: Gigabit Ethernet with UPS backup

### Setup Steps

#### 1. Choose Operating System

**Option A: Ubuntu Server 22.04 LTS** (Recommended)
- Free, stable, well-documented
- 5 years of security updates
- Easy to maintain

**Option B: Windows Server 2022**
- Familiar Windows interface
- Requires license ($500+)
- Good for Windows-heavy environments

#### 2. Install Ubuntu Server

```bash
# Download Ubuntu Server 22.04 LTS
# https://ubuntu.com/download/server

# Create bootable USB
# Use Rufus (Windows) or Etcher (macOS/Linux)

# Install on server hardware
# Choose "Install Ubuntu Server"
# Select minimal installation
# Enable OpenSSH server
```

#### 3. Initial Server Configuration

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose-plugin

# Create app user
sudo useradd -m -s /bin/bash hrapp
sudo usermod -aG docker hrapp

# Setup firewall
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

#### 4. Deploy Application

```bash
# Switch to app user
sudo su - hrapp

# Clone repository
git clone https://github.com/ismaelloveexcel/Secure-Renewals-2.git
cd Secure-Renewals-2

# Configure environment
cp .env.example .env
nano .env  # Edit with your settings

# Start application
docker compose up -d

# Enable auto-start
sudo systemctl enable docker
```

#### 5. Setup Local Network Access

**Configure Static IP:**
```bash
# Edit netplan configuration
sudo nano /etc/netplan/00-installer-config.yaml
```

```yaml
network:
  version: 2
  ethernets:
    ens33:  # Your network interface name
      dhcp4: no
      addresses:
        - 192.168.1.100/24  # Your static IP
      gateway4: 192.168.1.1
      nameservers:
        addresses: [8.8.8.8, 8.8.4.4]
```

```bash
# Apply configuration
sudo netplan apply
```

**Add DNS Entry (Optional):**
- If you have a local DNS server, add: `hr.company.local` → `192.168.1.100`
- Or use hosts file on client machines

#### 6. Add HTTPS with Self-Signed Certificate

```bash
# Install Nginx
sudo apt install nginx certbot

# Create self-signed certificate for internal use
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/hr-portal.key \
  -out /etc/ssl/certs/hr-portal.crt

# Configure Nginx
sudo nano /etc/nginx/sites-available/hr-portal
```

```nginx
server {
    listen 80;
    listen 443 ssl;
    server_name hr.company.local 192.168.1.100;

    ssl_certificate /etc/ssl/certs/hr-portal.crt;
    ssl_certificate_key /etc/ssl/private/hr-portal.key;

    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/hr-portal /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Maintenance Tasks

**Daily:**
- [ ] Check application is running: `docker compose ps`
- [ ] Monitor disk space: `df -h`

**Weekly:**
- [ ] Backup database: `./scripts/backup-db.sh`
- [ ] Check logs: `docker compose logs --tail=100`
- [ ] Check system updates: `sudo apt update`

**Monthly:**
- [ ] Apply security updates: `sudo apt upgrade`
- [ ] Test backup restoration
- [ ] Review access logs

---

## ☁️ OPTION 3: Oracle Cloud Free Tier (Always Free)

**Best for:** Always-on cloud deployment with zero ongoing costs

Oracle Cloud offers a truly free tier that never expires - perfect for small applications.

### What's Included (Forever Free)

- 2 AMD-based VMs (1/8 OCPU, 1GB RAM each)
- OR 1 ARM-based VM (4 cores, 24GB RAM) - **RECOMMENDED**
- 200GB block storage
- 10TB outbound data transfer per month
- Load balancer

### Setup Steps

#### 1. Create Oracle Cloud Account

1. Go to https://www.oracle.com/cloud/free/
2. Click "Start for free"
3. Verify your email and payment method (no charges for free tier)

#### 2. Create VM Instance

1. Go to **Compute** → **Instances**
2. Click **Create Instance**
3. Choose:
   - **Shape:** VM.Standard.A1.Flex (ARM)
   - **OCPU:** 4 (max free)
   - **Memory:** 24GB (max free)
   - **Image:** Ubuntu 22.04
   - **Boot volume:** 200GB
4. Add your SSH key
5. Click **Create**

#### 3. Configure Security Rules

1. Go to **Networking** → **Virtual Cloud Networks**
2. Select your VCN → Security Lists → Default
3. Add Ingress Rules:
   - Port 22 (SSH)
   - Port 80 (HTTP)
   - Port 443 (HTTPS)

#### 4. Connect and Deploy

```bash
# Connect via SSH
ssh ubuntu@<your-instance-ip>

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Clone and deploy
git clone https://github.com/ismaelloveexcel/Secure-Renewals-2.git
cd Secure-Renewals-2

# Configure
cp .env.example .env
nano .env

# Deploy
docker compose up -d
```

#### 5. Setup Domain (Optional)

If you have a domain name:

```bash
# Install Caddy (automatic HTTPS)
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy

# Configure Caddyfile
sudo nano /etc/caddy/Caddyfile
```

```
hr.yourdomain.com {
    reverse_proxy localhost:5000
}

api.yourdomain.com {
    reverse_proxy localhost:8000
}
```

```bash
# Reload Caddy
sudo systemctl reload caddy
```

### Oracle Cloud Benefits

- ✅ **Truly Free Forever** - No time limits
- ✅ **Generous Resources** - 4 core ARM server
- ✅ **Professional Setup** - Cloud infrastructure
- ✅ **No Third-Party Domains** - Use your own domain
- ✅ **Global Data Centers** - Choose your region

---

## 🖥️ OPTION 4: Proxmox VE (Advanced Self-Hosting)

**Best for:** Organizations with IT expertise wanting enterprise-grade virtualization

Proxmox is a free, open-source virtualization platform that lets you run multiple VMs and containers on a single physical server.

### Why Proxmox?

- ✅ **Enterprise Features** - Clustering, high availability, backups
- ✅ **Free & Open Source** - No licensing costs
- ✅ **Web-Based Management** - Easy to use GUI
- ✅ **VM + Container Support** - Run any OS or app
- ✅ **Snapshot & Backup** - Easy disaster recovery

### Hardware Requirements

**Minimum:**
- CPU: Intel VT-x or AMD-V (virtualization support)
- RAM: 16GB (8GB for Proxmox, 8GB for VMs)
- Storage: 500GB SSD
- Network: Gigabit Ethernet

**Recommended:**
- CPU: Intel Xeon or AMD EPYC (8+ cores)
- RAM: 64GB
- Storage: 1TB NVMe SSD + 4TB HDD for backups
- Network: Dual Gigabit Ethernet

### Setup Steps

#### 1. Install Proxmox VE

```bash
# Download Proxmox VE ISO
# https://www.proxmox.com/en/downloads

# Create bootable USB
# Use Etcher or Rufus

# Boot from USB and install
# Choose target disk
# Set root password
# Configure network (static IP recommended)
```

#### 2. Access Web Interface

Open browser: `https://your-server-ip:8006`

Login: `root` with your password

#### 3. Create Ubuntu VM for HR Portal

1. Click **Create VM**
2. Configure:
   - **OS:** Ubuntu Server 22.04
   - **CPU:** 4 cores
   - **RAM:** 8GB
   - **Disk:** 100GB
3. Start VM and install Ubuntu
4. Install Docker and deploy HR Portal (same as Option 2)

#### 4. Setup Backup Schedule

1. Go to **Datacenter** → **Backup**
2. Click **Add**
3. Configure:
   - **Schedule:** Daily at 2 AM
   - **Selection:** Your HR Portal VM
   - **Storage:** Local or NAS
   - **Mode:** Snapshot
   - **Retention:** Keep 7 daily backups

#### 5. Create Snapshots Before Changes

```bash
# In Proxmox web UI
# Select VM → Snapshots → Take Snapshot
# Name: "Before-upgrade-YYYY-MM-DD"

# Make changes to VM

# If something breaks, restore snapshot:
# Select snapshot → Rollback
```

### Proxmox Benefits

- ✅ **Professional Infrastructure** - Enterprise-grade virtualization
- ✅ **Easy Backups** - Automated snapshot backups
- ✅ **Disaster Recovery** - Restore VMs in minutes
- ✅ **Multiple Apps** - Run other services on same hardware
- ✅ **High Availability** - Cluster multiple servers (optional)

---

## 🔒 OPTION 5: Private Network with Tailscale

**Best for:** Secure remote access without exposing to public internet

Tailscale creates a secure mesh VPN, allowing you to access your local application from anywhere without opening ports.

### Setup Steps

#### 1. Install Tailscale on Server

```bash
# On your server (where app runs)
curl -fsSL https://tailscale.com/install.sh | sh

# Authenticate
sudo tailscale up

# Note the Tailscale IP (e.g., 100.x.x.x)
tailscale ip -4
```

#### 2. Install Tailscale on Client Devices

- **Windows/macOS:** Download from https://tailscale.com/download
- **Mobile:** Install from App Store / Play Store

#### 3. Access Application

Instead of `localhost:5000`, use `http://100.x.x.x:5000` (your Tailscale IP)

### Tailscale Benefits

- ✅ **Zero Configuration** - No firewall rules, no port forwarding
- ✅ **Microsoft SSO** - Login with work account
- ✅ **End-to-End Encrypted** - Military-grade security
- ✅ **Access from Anywhere** - Phone, laptop, tablet
- ✅ **Free for Personal Use** - Up to 20 devices

---

## 📋 Deployment Decision Matrix

### Choose Local Desktop If:
- ✅ Only you will use the application
- ✅ You work from one location
- ✅ You want maximum privacy
- ✅ You have a reliable laptop

### Choose Docker Desktop If:
- ✅ You want easy portability
- ✅ You might move to cloud later
- ✅ You want isolated environment
- ✅ You're comfortable with basic Docker

### Choose On-Premise Server If:
- ✅ 5-20 people need access
- ✅ You have office space for server
- ✅ You need 24/7 availability
- ✅ You have basic IT support

### Choose Oracle Cloud Free If:
- ✅ You need always-on cloud access
- ✅ You want zero hosting costs
- ✅ You're okay with Oracle's infrastructure
- ✅ You have basic Linux skills

### Choose Proxmox If:
- ✅ You have IT expertise
- ✅ You want enterprise features
- ✅ You run multiple applications
- ✅ You need advanced backup/recovery

---

## 🔧 Quick Start Scripts

### One-Command Docker Setup

Create `deploy.sh`:

```bash
#!/bin/bash

echo "🚀 Starting HR Portal deployment..."

# Check Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Installing..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
fi

# Create environment file if missing
if [ ! -f .env ]; then
    echo "📝 Creating environment file..."
    cat > .env << EOF
DB_PASSWORD=$(openssl rand -hex 16)
AUTH_SECRET_KEY=$(openssl rand -hex 32)
EOF
fi

# Start services
echo "🐳 Starting containers..."
docker compose up -d

echo "✅ Deployment complete!"
echo "📱 Frontend: http://localhost:5000"
echo "🔧 Backend: http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/docs"
```

Make executable and run:
```bash
chmod +x deploy.sh
./deploy.sh
```

---

## 📊 Cost Comparison (Annual)

| Option | Hardware | Software | Maintenance | Total/Year |
|--------|----------|----------|-------------|------------|
| Local Desktop | $0 (existing) | $0 | $0 | **$0** |
| Docker Desktop | $0 (existing) | $0 | $0 | **$0** |
| On-Premise Server | $500-1000 | $0 | $100 | **$600-1100** |
| Oracle Cloud Free | $0 | $0 | $0 | **$0** |
| Proxmox VE | $800-2000 | $0 | $200 | **$1000-2200** |
| Azure Container | $0 | $360-600 | $0 | **$360-600** |

---

## 🎯 Recommended Path

### Phase 1: Start Local (Week 1)
1. Install Docker Desktop
2. Deploy with Docker Compose
3. Test with real data
4. Train HR team

### Phase 2: Evaluate Usage (Month 1)
- How many users?
- Remote access needed?
- Performance requirements?

### Phase 3: Scale if Needed (Month 2-3)
**If solo user:** Stay on local Docker  
**If 5-20 users:** Deploy on-premise server  
**If remote access:** Add Tailscale  
**If always-on cloud:** Move to Oracle Cloud Free

---

## 📚 Additional Resources

### Docker Learning
- [Docker Get Started Guide](https://docs.docker.com/get-started/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)

### Server Management
- [Ubuntu Server Guide](https://ubuntu.com/server/docs)
- [Proxmox Documentation](https://pve.proxmox.com/pve-docs/)

### Security Best Practices
- [OWASP Security Guidelines](https://owasp.org/www-project-top-ten/)
- [CIS Benchmarks](https://www.cisecurity.org/cis-benchmarks/)

---

<p align="center">
  <strong>Privacy-First Deployment</strong><br>
  Your data, your infrastructure, your control
</p>
