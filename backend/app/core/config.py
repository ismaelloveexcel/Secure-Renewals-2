from functools import lru_cache
from pydantic import AnyHttpUrl, BaseSettings, Field, validator
from typing import List


class Settings(BaseSettings):
    app_name: str = Field(default="Secure Renewals API", description="Application name")
    app_env: str = Field(default="development", description="Current runtime environment")
    api_prefix: str = Field(default="/api", description="API prefix for routing")
    log_level: str = Field(default="INFO", description="Logging level")
    database_url: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/secure_renewals",
        description="PostgreSQL connection string using asyncpg driver",
    )
    allowed_origins: List[AnyHttpUrl] = Field(
        default_factory=lambda: ["http://localhost:5000", "http://0.0.0.0:5000"],
        description="List of allowed CORS origins",
    )
    auth_issuer: str = Field(
        default="https://login.microsoftonline.com/<tenant-id>/v2.0",
        description="Expected token issuer (IdP)",
    )
    auth_audience: str = Field(
        default="api://secure-renewals",
        description="Expected audience / application ID URI",
    )
    auth_jwks_url: str = Field(
        default="https://login.microsoftonline.com/common/discovery/v2.0/keys",
        description="JWKS endpoint for verifying JWTs",
    )
    dev_auth_bypass: bool = Field(
        default=False,
        description="Allow static token validation for local development",
    )
    dev_static_token: str | None = Field(
        default=None,
        description="Pre-issued JWT used when dev_auth_bypass is enabled",
    )

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False

    @validator("allowed_origins", pre=True)
    def split_origins(cls, value):
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value


@lru_cache()
def get_settings() -> Settings:
    return Settings()
