# Secure Renewals

Internal application for securely managing employee contract renewals and onboarding checks. The project is split into a FastAPI backend and a Vite + TypeScript + Tailwind frontend to keep responsibilities isolated and deployment-ready.

## Project Structure
- `backend/` – FastAPI service exposing renewal APIs and OpenAPI docs.
- `frontend/` – Vite + React client that consumes the API via a typed service layer.
- `.gitignore` – Repository hygiene rules.

## Tech Stack
- **Backend:** Python 3.11+, FastAPI, Uvicorn, Pydantic Settings
- **Frontend:** Vite, React, TypeScript, TailwindCSS

## Backend Setup
1. Navigate to `backend/`.
2. Create an `.env` file (see `.env.example`).
3. Install dependencies with `uv sync` (or `pip install -r` from a generated requirements list if preferred).
4. Run the API: `uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`

The API serves OpenAPI docs at `http://localhost:8000/docs` and enforces simple role headers (`X-Role`: admin | hr | viewer).

## Frontend Setup
1. Navigate to `frontend/`.
2. Install dependencies: `npm install`.
3. Create a `.env` file with `VITE_API_BASE_URL=http://localhost:8000/api`.
4. Start the dev server: `npm run dev` (defaults to `http://localhost:5173`).

## Deployment Notes
- Configure HTTPS termination at your ingress or proxy layer.
- Set `ALLOWED_ORIGINS` in the backend `.env` to the deployed frontend URL (comma-separated for multiples).
- Run backend and frontend as separate services or containers; no Replit-specific files remain.
- Update `backend/uv.lock` via `uv lock` in a networked environment before production deployment.
