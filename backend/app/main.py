from fastapi import FastAPI
from starlette.middleware.httpsredirect import HTTPSRedirectMiddleware
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi.responses import JSONResponse

from app.core.config import get_settings
from app.core.logging import configure_logging, get_logger
from app.routers import admin, auth, employees, health, passes, renewals
from app.routers import attendance, admin_actions, wizard, help, notifications, audit_log, bulk

# Sentry integration for error monitoring
import os
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

SENTRY_DSN = os.getenv("SENTRY_DSN")  # Set this in your Replit Secrets
if SENTRY_DSN:
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        integrations=[FastApiIntegration()],
        traces_sample_rate=0.1,
        environment=os.getenv("APP_ENV", "production"),
    )

configure_logging()
settings = get_settings()
logger = get_logger(__name__)


def create_app() -> FastAPI:

    app = FastAPI(title=settings.app_name, version="1.0.0")

    # Add rate limiting middleware (SlowAPI)
    limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, lambda request, exc: JSONResponse(status_code=429, content={"detail": "Rate limit exceeded"}))
    limiter.init_app(app)

    # Enforce HTTPS in production
    if settings.app_env == "production":
        app.add_middleware(HTTPSRedirectMiddleware)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.allowed_origins],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"]
    )

    # Auth routes (no prefix for login)
    app.include_router(auth.router, prefix=settings.api_prefix)
    
    # API routes
    app.include_router(health.router, prefix=settings.api_prefix)
    app.include_router(renewals.router, prefix=settings.api_prefix)
    app.include_router(employees.router, prefix=settings.api_prefix)
    app.include_router(passes.router, prefix=settings.api_prefix)
    app.include_router(admin.router, prefix=settings.api_prefix)
    app.include_router(attendance.router, prefix=settings.api_prefix)
    app.include_router(admin_actions.router, prefix=settings.api_prefix)
    app.include_router(wizard.router, prefix=settings.api_prefix)
    app.include_router(help.router, prefix=settings.api_prefix)
    app.include_router(notifications.router, prefix=settings.api_prefix)
    app.include_router(audit_log.router, prefix=settings.api_prefix)
    app.include_router(bulk.router, prefix=settings.api_prefix)

    @app.on_event("startup")
    async def on_startup():
        logger.info("Application startup", extra={"env": settings.app_env})

    @app.on_event("shutdown")
    async def on_shutdown():
        logger.info("Application shutdown")

    return app


app = create_app()
