from datetime import datetime, timedelta, timezone
from typing import Any, Dict

import httpx
import jwt
from jwt import PyJWKClient, PyJWK
from jwt.exceptions import PyJWTError
from fastapi import HTTPException, status

from app.core.config import Settings, get_settings
from app.core.logging import get_logger

logger = get_logger(__name__)

_JWKS_CACHE: dict[str, Dict[str, Any]] | None = None
_JWKS_FETCHED_AT: datetime | None = None
_JWKS_TTL_SECONDS = 300


def _is_cache_valid() -> bool:
    if _JWKS_CACHE is None or _JWKS_FETCHED_AT is None:
        return False
    return datetime.now(timezone.utc) - _JWKS_FETCHED_AT < timedelta(seconds=_JWKS_TTL_SECONDS)


async def _fetch_jwks(settings: Settings) -> dict[str, Dict[str, Any]]:
    global _JWKS_CACHE, _JWKS_FETCHED_AT

    if _is_cache_valid():
        return _JWKS_CACHE or {}

    if not settings.auth_jwks_url:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="JWKS URL not configured",
        )

    try:
        async with httpx.AsyncClient(timeout=5) as client:
            response = await client.get(settings.auth_jwks_url)
            response.raise_for_status()
            payload = response.json()
    except Exception as exc:  # noqa: BLE001 - intentional broad catch to normalize errors
        logger.error("Failed to fetch JWKS", exc_info=exc)
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="JWKS fetch failed")

    keys = payload.get("keys")
    if not keys:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="No JWKS keys available")

    _JWKS_CACHE = {key.get("kid"): key for key in keys if key.get("kid")}
    _JWKS_FETCHED_AT = datetime.now(timezone.utc)
    return _JWKS_CACHE or {}


def _decode_dev_token(token: str, settings: Settings) -> Dict[str, Any]:
    if not settings.dev_static_token:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Development token not configured",
        )

    if token != settings.dev_static_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid development token")

    try:
        return jwt.decode(token, options={"verify_signature": False})
    except PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Malformed development token")


async def decode_jwt(token: str, settings: Settings | None = None) -> Dict[str, Any]:
    global _JWKS_FETCHED_AT

    settings = settings or get_settings()

    if settings.dev_auth_bypass:
        return _decode_dev_token(token, settings)

    try:
        unverified_header = jwt.get_unverified_header(token)
    except PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token header")

    kid = unverified_header.get("kid")
    if not kid:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing key ID in token")
    jwks = await _fetch_jwks(settings)

    key_data = jwks.get(kid)
    if key_data is None:
        _JWKS_FETCHED_AT = None
        jwks = await _fetch_jwks(settings)
        key_data = jwks.get(kid)

    if key_data is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unknown token key")

    algorithm = key_data.get("alg", "RS256")
    try:
        signing_key = PyJWK.from_dict(key_data, algorithm=algorithm)
        claims = jwt.decode(
            token,
            signing_key.key,
            algorithms=[algorithm],
            audience=settings.auth_audience,
            issuer=settings.auth_issuer,
        )
    except PyJWTError as exc:
        logger.warning("Token validation failed", exc_info=exc)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token validation failed")

    exp = claims.get("exp")
    if exp is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing exp claim")

    try:
        expires_at = datetime.fromtimestamp(float(exp), tz=timezone.utc)
    except (ValueError, TypeError, OverflowError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid exp claim")

    if expires_at <= datetime.now(timezone.utc):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")

    return claims
