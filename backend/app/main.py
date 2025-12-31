from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.logging import configure_logging, get_logger
from app.routers import health, renewals


configure_logging()
settings = get_settings()
logger = get_logger(__name__)


def create_app() -> FastAPI:
    app = FastAPI(title=settings.app_name, version="1.0.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.allowed_origins],
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
