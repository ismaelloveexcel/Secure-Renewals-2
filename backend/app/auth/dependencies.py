from typing import Any, List, Optional

from fastapi import Depends, Header, HTTPException, status
import jwt
from jwt.exceptions import PyJWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.jwt import decode_jwt
from app.auth.roles import ALLOWED_ROLES, resolve_role_from_claims
from app.core.config import get_settings
from app.database import get_session


async def authenticate_token(authorization: Optional[str] = Header(default=None)) -> dict[str, Any]:
    """
    Authenticate JWT token and return claims.
    Uses HS256 local signing for employee authentication.
    Falls back to JWKS for SSO tokens if configured.
    """
    if authorization is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authorization header missing")

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authorization header")

    settings = get_settings()
    
    try:
        claims = jwt.decode(token.strip(), settings.auth_secret_key, algorithms=["HS256"])
        return claims
    except PyJWTError:
        pass
    
    try:
        return await decode_jwt(token.strip(), settings)
    except HTTPException:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")


def get_employee_id_from_token(authorization: Optional[str] = Header(default=None)) -> str:
    """Extract employee ID from JWT token using HS256 (local auth)."""
    if authorization is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authorization header missing")
    
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authorization header")
    
    try:
        settings = get_settings()
        payload = jwt.decode(token.strip(), settings.auth_secret_key, algorithms=["HS256"])
        employee_id = payload.get("sub")
        if not employee_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        return employee_id
    except PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")


async def require_auth(
    employee_id: str = Depends(get_employee_id_from_token),
    session: AsyncSession = Depends(get_session),
):
    """Get current authenticated employee."""
    from app.models import Employee
    
    result = await session.execute(
        select(Employee).where(Employee.employee_id == employee_id)
    )
    employee = result.scalar_one_or_none()
    
    if not employee:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Employee not found")
    
    if not employee.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account inactive")
    
    return employee


async def require_hr(
    employee_id: str = Depends(get_employee_id_from_token),
    session: AsyncSession = Depends(get_session),
):
    """Get current employee and verify HR/admin role."""
    from app.models import Employee
    
    result = await session.execute(
        select(Employee).where(Employee.employee_id == employee_id)
    )
    employee = result.scalar_one_or_none()
    
    if not employee:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Employee not found")
    
    if not employee.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account inactive")
    
    if employee.role not in ["hr", "admin"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="HR access required")
    
    return employee


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
