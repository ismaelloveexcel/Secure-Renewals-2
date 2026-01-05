from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.core.config import get_settings
from app.core.logging import configure_logging, get_logger
from app.routers import admin, attendance, auth, employees, health, onboarding, passes, renewals

configure_logging()
settings = get_settings()
logger = get_logger(__name__)

limiter = Limiter(key_func=get_remote_address)


def create_app() -> FastAPI:
    app = FastAPI(title=settings.app_name, version="1.0.0")
    
    app.state.limiter = limiter

    @app.exception_handler(RateLimitExceeded)
    async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
        return JSONResponse(status_code=429, content={"detail": "Rate limit exceeded"})

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"]
    )

    app.include_router(health.router, prefix=settings.api_prefix)
    app.include_router(auth.router, prefix=settings.api_prefix)
    app.include_router(employees.router, prefix=settings.api_prefix)
    app.include_router(renewals.router, prefix=settings.api_prefix)
    app.include_router(passes.router, prefix=settings.api_prefix)
    app.include_router(onboarding.router, prefix=settings.api_prefix)
    app.include_router(attendance.router, prefix=settings.api_prefix)
    app.include_router(admin.router, prefix=settings.api_prefix)
    from app.routers import templates, audit_logs, notifications
    from app.routers import employee_compliance, employee_bank, employee_documents
    from app.routers import recruitment
    app.include_router(templates.router, prefix=settings.api_prefix)
    app.include_router(audit_logs.router, prefix=settings.api_prefix)
    app.include_router(notifications.router, prefix=settings.api_prefix)
    app.include_router(employee_compliance.router)
    app.include_router(employee_bank.router)
    app.include_router(employee_documents.router)
    # Recruitment module - under admin section
    app.include_router(recruitment.router, prefix=settings.api_prefix)

    @app.on_event("startup")
    async def on_startup():
        logger.info("Application startup", extra={"env": settings.app_env})

    @app.on_event("shutdown")
    async def on_shutdown():
        logger.info("Application shutdown")

    return app


app = create_app()
