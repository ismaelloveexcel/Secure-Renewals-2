from functools import lru_cache
from typing import List, Optional

from pydantic import AnyHttpUrl, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


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
    
    # Email settings (SMTP)
    smtp_host: Optional[str] = Field(default=None, description="SMTP server hostname")
    smtp_port: int = Field(default=587, description="SMTP server port")
    smtp_user: Optional[str] = Field(default=None, description="SMTP username")
    smtp_password: Optional[str] = Field(default=None, description="SMTP password")
    smtp_from_email: str = Field(default="hr@baynunah.ae", description="From email address")
    smtp_from_name: str = Field(default="Baynunah HR", description="From name")
    smtp_use_tls: bool = Field(default=True, description="Use TLS for SMTP")
    app_base_url: str = Field(default="http://localhost:5173", description="Base URL for email links")
    
    # Authentication settings (Employee ID + Password)
    auth_secret_key: str = Field(
        default="dev-secret-key-change-in-production",
        description="Secret key for JWT signing",
    )
    session_timeout_hours: int = Field(
        default=8,
        description="Session timeout in hours",
    )
    password_min_length: int = Field(
        default=8,
        description="Minimum password length",
    )
    
    # Legacy Azure AD settings (kept for backwards compatibility)
    auth_issuer: str = Field(
        default="https://login.microsoftonline.com/<tenant-id>/v2.0",
        description="Expected token issuer (IdP) - legacy",
    )
    auth_audience: str = Field(
        default="api://secure-renewals",
        description="Expected audience / application ID URI - legacy",
    )
    auth_jwks_url: str = Field(
        default="https://login.microsoftonline.com/common/discovery/v2.0/keys",
        description="JWKS endpoint for verifying JWTs - legacy",
    )
    dev_auth_bypass: bool = Field(
        default=False,
        description="Allow static token validation for local development",
    )
    dev_static_token: str | None = Field(
        default=None,
        description="Pre-issued JWT used when dev_auth_bypass is enabled",
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    @field_validator("allowed_origins", mode="before")
    @classmethod
    def split_origins(cls, value):
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value


@lru_cache()
def get_settings() -> Settings:
    return Settings()


