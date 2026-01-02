from typing import Any, List, Optional

from fastapi import Depends, Header, HTTPException, status

from app.auth.jwt import decode_jwt
from app.auth.roles import ALLOWED_ROLES, resolve_role_from_claims
from app.core.config import get_settings


async def authenticate_token(authorization: Optional[str] = Header(default=None)) -> dict[str, Any]:
    if authorization is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authorization header missing")

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authorization header")

    settings = get_settings()
    return await decode_jwt(token.strip(), settings)


def require_role(allowed: Optional[List[str]] = None):
    async def dependency(claims: dict[str, Any] = Depends(authenticate_token)) -> str:
        role = resolve_role_from_claims(claims)
        if role not in ALLOWED_ROLES:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid role")
        if allowed and role not in allowed:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient role")
        return role

    return dependency


# Placeholder for SSO login integration (extend as needed)
def sso_login():
    # Integrate with your SSO provider here
    pass
