from typing import List, Optional

from fastapi import Depends, Header, HTTPException, status
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.database import get_session

ALLOWED_ROLES = {"admin", "hr", "viewer"}


def sanitize_text(value: str) -> str:
    """Basic input sanitization to avoid script injection."""
    import html

    return html.escape(value.strip())


def require_role(allowed: Optional[List[str]] = None):
    """
    Dependency that authenticates via JWT token and validates role.
    """
    async def dependency(
        authorization: str | None = Header(default=None),
        session: AsyncSession = Depends(get_session),
    ) -> str:
        from app.models import Employee
        
        role = None
        
        if authorization:
            scheme, _, token = authorization.partition(" ")
            if scheme.lower() == "bearer" and token:
                try:
                    settings = get_settings()
                    payload = jwt.decode(token.strip(), settings.auth_secret_key, algorithms=["HS256"])
                    employee_id = payload.get("sub")
                    if employee_id:
                        result = await session.execute(
                            select(Employee).where(Employee.employee_id == employee_id)
                        )
                        employee = result.scalar_one_or_none()
                        if employee and employee.is_active:
                            role = employee.role
                except JWTError:
                    pass
        
        if not role:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")

        if role not in ALLOWED_ROLES:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid role")
        if allowed and role not in allowed:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient role")
        return role

    return dependency
