from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.core.config import get_settings
from app.core.logging import configure_logging, get_logger
from app.routers import health, renewals

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
    app.include_router(renewals.router, prefix=settings.api_prefix)

    @app.on_event("startup")
    async def on_startup():
        logger.info("Application startup", extra={"env": settings.app_env})

    @app.on_event("shutdown")
    async def on_shutdown():
        logger.info("Application shutdown")

    return app


app = create_app()
