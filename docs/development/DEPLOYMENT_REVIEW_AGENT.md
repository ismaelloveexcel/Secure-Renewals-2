# Deployment & Repo Review Agent

**Purpose:** A hands-on agent that reviews the repository, understands the app layout, initiates local deployment, and proactively flags issues. Use this when you need a local run fast and want early warnings about blockers.

## How to Use
1) Open this file in your IDE so Copilot can load the context.  
2) Ask Copilot in chat, e.g.:
   - “Review this repo structure and summarize the app modules.”
   - “Walk me through local deployment and check for common pitfalls.”
   - “Suggest GitHub resources to fix build errors or enhance features.”

## Core Responsibilities
- **Repo Review:** Summarize backend/frontend structure, key services, and critical scripts (e.g., `scripts/oneclick-local.sh`, `deploy-docker.sh`, `scripts/proactive_scan.py`).
- **Local Deployment:** Guide macOS/Linux/Windows setup using `scripts/oneclick-local.sh` or Docker (`deploy-docker.sh` / `deploy-docker.bat`), ensuring `.env` files exist and dependencies install.
- **Proactive Issue Detection:** Run/interpret health checks (e.g., `python scripts/proactive_scan.py`, `uv run alembic upgrade head`, `npm run lint/test` where applicable) and surface likely failures (ports, missing env vars, DB connectivity, migrations).
- **GitHub Resource Guidance:** Recommend relevant repos/gists/docs for fixes or improvements (UI/UX, backend patterns, DevOps), pointing to examples and keywords to search.
- **Hands-Free Execution:** Execute the full local deployment flow end-to-end (no prompts) by running the commands below on behalf of the user.

## Quick Playbooks

### Repo & App Understanding
- Map layout: `backend/` (FastAPI + Alembic), `frontend/` (React/Vite), infra scripts (`docker-compose.yml`, `deploy-docker.sh`, `oneclick-local.sh`), utilities in `scripts/`.
- Check entrypoints: `backend/app/main.py` (API), `frontend/src` (UI), migrations under `backend/alembic/`.
- Run fast scan: `python scripts/proactive_scan.py` for hotspots.

### Local Deployment on Your Disk (preferred flow)
```bash
chmod +x scripts/oneclick-local.sh
./scripts/oneclick-local.sh
# Backend: http://localhost:8000/docs
# Frontend: http://localhost:5000
```
This runs entirely on your local disk (no cloud services): dependencies, generated `.env` files, and database/cache data stay on your machine.
If you prefer containers only:
```bash
./scripts/deploy-docker.sh   # Linux/macOS
scripts\\deploy-docker.bat   # Windows
```
Key checkpoints:
- Ensure Docker is running (for DB/Redis) or have local PostgreSQL at `localhost:5432`.
- Verify generated `.env` in `backend/` and `frontend/`.
- Watch for migration errors (`uv run alembic upgrade head`).

### Full Hands-Free Autopilot (no manual intervention)
The agent should execute these steps sequentially:
```bash
# From repo root
chmod +x scripts/oneclick-local.sh
./scripts/oneclick-local.sh
```
What this does automatically:
- Generates `.env` files if missing (backend + frontend) — confirm by reading `scripts/oneclick-local.sh` steps
- Starts Postgres/Redis via Docker Compose when available
- Installs backend deps (`uv sync`) and runs migrations (`uv run alembic upgrade head`)
- Installs frontend deps and starts both backend (port 8000) and frontend (port 5000)
- If Docker is unavailable, verify PostgreSQL manually before continuing, e.g.:
  - Check service: `pg_isready -h localhost -p 5432`
  - Test connection: `psql "postgresql://hruser:YOURPASS@localhost:5432/secure_renewals" -c "SELECT 1"`

### Troubleshooting Signals
- **Ports busy:** 5000/8000/5432 in use → stop existing processes or change ports in `.env`.
- **DB auth errors:** Confirm `DATABASE_URL` password in `backend/.env`; ensure Postgres reachable.
- **Node/uv missing:** Install via `scripts/install.sh` or follow prompts in `oneclick-local.sh`.
- **Frontend 404 to API:** Check `VITE_API_BASE_URL` in `frontend/.env` and CORS origins in backend `.env`.

### Proactive Checks
- Security/quality scan: `python scripts/proactive_scan.py`
- Backend health: `uv sync && uv run pytest` (if tests present), `uv run alembic upgrade head`
- Frontend lint/tests (if configured): `npm install && npm run lint && npm test`
- Containers up: `docker compose ps` and logs via `docker compose logs backend frontend postgres`

### GitHub Resource Recommendations
- For FastAPI patterns: search `fastapi role based access` or `fastapi alembic asyncpg`.
- For React/Vite UI/UX: search `vite react dashboard template` or `react accessibility hooks`.
- For DevOps: `docker compose fastapi react postgres redis`, `github actions python node monorepo`.
- For HR-specific features: look for `hr portal onboarding fastapi`, `employee compliance tracker`, `attendance fastapi react`.

## When to Escalate
- Repeated migration failures after verifying DB connectivity.
- Security scan flags high/critical issues in auth, SQL handling, or secrets.
- Persistent CORS or proxy issues between frontend/backed despite correct envs.
