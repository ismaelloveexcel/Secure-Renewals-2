from fastapi import Depends, Header, HTTPException, status
from typing import List, Optional

ALLOWED_ROLES = {"admin", "hr", "viewer"}


def sanitize_text(value: str) -> str:
    """Basic input sanitization to avoid script injection."""
    import html

    return html.escape(value.strip())


def require_role(allowed: Optional[List[str]] = None):
    async def role_dependency(x_role: Optional[str] = Header(default=None, convert_underscores=False)):
        if x_role is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Role header missing")
        role = x_role.lower().strip()
        if role not in ALLOWED_ROLES:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid role")
        if allowed and role not in allowed:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient role")
        return role

    return role_dependency
