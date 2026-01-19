#!/bin/bash
# ============================================
# One-Click Local Deployment (macOS/Linux)
# ============================================
# This script sets up and launches the HR Portal locally with a single command.
# It will:
#   1) Verify prerequisites
#   2) Install backend/frontend dependencies
#   3) Create .env files if missing
#   4) Run database migrations
#   5) Start backend and frontend together
#
# Usage:
#   chmod +x scripts/oneclick-local.sh
#   ./scripts/oneclick-local.sh
# ============================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Database defaults (override with env vars if needed)
DB_USER="${DB_USER:-hruser}"
DB_NAME="${DB_NAME:-secure_renewals}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_PASSWORD="${DB_PASSWORD:-}"

info() { echo -e "➡️  $*"; }
success() { echo -e "✅ $*"; }
warn() { echo -e "⚠️  $*"; }
error_exit() { echo -e "❌ $*"; exit 1; }

check_command() {
    local cmd="$1"
    if ! command -v "$cmd" >/dev/null 2>&1; then
        error_exit "Required command '$cmd' not found. Please install it and retry."
    fi
}

extract_password_from_env() {
    local env_file="$PROJECT_DIR/backend/.env"
    if [ ! -f "$env_file" ]; then
        return
    fi
    local url_line
    url_line=$(grep -E '^DATABASE_URL=' "$env_file" || true)
    if [ -z "$url_line" ]; then
        return
    fi
    local parsed
    parsed=$(python3 - <<'PY'
import os, sys
from urllib.parse import urlparse
url = urlparse(sys.argv[1])
print(url.password or "")
PY
"${url_line#DATABASE_URL=}")
    if [ -n "$parsed" ]; then
        DB_PASSWORD="$parsed"
    fi
}

generate_password() {
    python3 - <<'PY'
import secrets, string
alphabet = string.ascii_letters + string.digits
print(''.join(secrets.choice(alphabet) for _ in range(24)))
PY
}

if [ -z "$DB_PASSWORD" ]; then
    extract_password_from_env
fi

if [ -z "$DB_PASSWORD" ]; then
    DB_PASSWORD="$(generate_password)"
fi

ensure_backend_env() {
    local env_file="$PROJECT_DIR/backend/.env"
    if [ -f "$env_file" ]; then
        return
    fi

    cat > "$env_file" <<EOF
APP_ENV=development
API_PREFIX=/api
ALLOWED_ORIGINS=http://localhost:5000,http://127.0.0.1:5000
DATABASE_URL=postgresql+asyncpg://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}
AUTH_SECRET_KEY=${AUTH_SECRET_KEY:-dev-secret-key-change-in-production}
SESSION_TIMEOUT_HOURS=8
PASSWORD_MIN_LENGTH=8
DEV_AUTH_BYPASS=true
EOF
    success "Created backend/.env with local defaults (PostgreSQL on ${DB_HOST}:${DB_PORT})"
}

ensure_frontend_env() {
    local env_file="$PROJECT_DIR/frontend/.env"
    if [ -f "$env_file" ]; then
        return
    fi

    echo "VITE_API_BASE_URL=http://localhost:8000/api" > "$env_file"
    success "Created frontend/.env pointing to local API"
}

ensure_services() {
    # Start Postgres/Redis via Docker Compose when available.
    if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
        info "Starting local database/cache (docker compose up -d postgres redis)..."
        (cd "$PROJECT_DIR" && DB_PASSWORD="$DB_PASSWORD" docker compose up -d postgres redis)
        success "Database/cache containers ensured"
        STARTED_CONTAINERS=1
    else
        warn "Docker not available. Ensure PostgreSQL is running at ${DB_HOST}:${DB_PORT} before continuing."
        STARTED_CONTAINERS=0
    fi
}

stop_pid() {
    local pid="$1"
    if [ -z "${pid:-}" ]; then
        return
    fi

    kill -TERM "$pid" 2>/dev/null || true
    for _ in $(seq 1 5); do
        if ! kill -0 "$pid" 2>/dev/null; then
            return
        fi
        sleep 1
    done
    kill -KILL "$pid" 2>/dev/null || true
}

cleanup() {
    echo ""
    echo "Stopping HR Portal..."
    stop_pid "$BACKEND_PID"
    stop_pid "$FRONTEND_PID"

    if [ "${STARTED_CONTAINERS:-0}" -eq 1 ]; then
        warn "Docker containers were started for you. Stop them later with: docker compose down"
    fi
    exit 0
}

echo "============================================"
echo "  SECURE RENEWALS - ONE CLICK LOCAL DEPLOY"
echo "============================================"
echo "Project: $PROJECT_DIR"
echo ""

info "Checking prerequisites..."
check_command python3
check_command node
check_command npm

if ! command -v uv >/dev/null 2>&1; then
    info "Installing uv package manager..."
    pip3 install --user "uv>=0.4,<1.0"
    export PATH="$(python3 -m site --user-base)/bin:${PATH}"
fi
check_command uv
success "Prerequisites ready"

ensure_backend_env
ensure_frontend_env
ensure_services

info "Installing backend dependencies..."
cd "$PROJECT_DIR/backend"
uv sync
success "Backend dependencies installed"

info "Running database migrations..."
if ! uv run alembic upgrade head; then
    error_exit "Database migration failed. Ensure PostgreSQL is reachable and rerun the script."
fi
success "Database ready"

info "Starting backend (port 8000)..."
uv run uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload &
BACKEND_PID=$!

wait_for_port() {
    local host="$1"
    local port="$2"
    local timeout="${3:-60}"
    python3 - "$host" "$port" "$timeout" <<'PY'
import socket, time, sys
host, port, timeout = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
start = time.time()
while time.time() - start < timeout:
    with socket.socket() as s:
        s.settimeout(1)
        if s.connect_ex((host, port)) == 0:
            sys.exit(0)
    time.sleep(1)
sys.exit(1)
PY
}

if ! wait_for_port 127.0.0.1 8000 90; then
    error_exit "Backend did not become ready on port 8000."
fi

info "Installing frontend dependencies..."
cd "$PROJECT_DIR/frontend"
npm install
success "Frontend dependencies installed"

info "Starting frontend (port 5000)..."
npx vite dev --host 127.0.0.1 --port 5000 &
FRONTEND_PID=$!

if ! wait_for_port 127.0.0.1 5000 90; then
    error_exit "Frontend did not become ready on port 5000."
fi

trap cleanup SIGINT SIGTERM

echo ""
echo "============================================"
echo "  HR PORTAL IS RUNNING"
echo "============================================"
echo "Application: http://localhost:5000"
echo "API Docs:    http://localhost:8000/docs"
echo ""
echo "Use Ctrl+C to stop both services."
echo "============================================"

wait
