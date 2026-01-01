from typing import Any

from fastapi import APIRouter, Depends, Header, HTTPException, status
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.database import get_session
from app.schemas.employee import (
    LoginRequest,
    LoginResponse,
    PasswordChangeRequest,
)
from app.services.employees import employee_service

router = APIRouter(prefix="/auth", tags=["authentication"])


async def get_current_employee_id(authorization: str = Header(...)) -> str:
    """Extract employee ID from JWT token."""
    try:
        scheme, _, token = authorization.partition(" ")
        if scheme.lower() != "bearer" or not token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authorization header",
            )
        settings = get_settings()
        payload = jwt.decode(token, settings.auth_secret_key, algorithms=["HS256"])
        employee_id = payload.get("sub")
        if not employee_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
            )
        return employee_id
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )


@router.post(
    "/login",
    response_model=LoginResponse,
    summary="Login with Employee ID and password",
)
async def login(
    request: LoginRequest,
    session: AsyncSession = Depends(get_session),
):
    """
    Authenticate with Employee ID and password.
    
    - **First-time login**: Use DOB in DDMMYYYY format as password
    - **Subsequent logins**: Use your custom password
    
    If `requires_password_change` is true, you must change your password.
    """
    return await employee_service.login(session, request)


@router.post(
    "/change-password",
    status_code=status.HTTP_200_OK,
    summary="Change password",
)
async def change_password(
    request: PasswordChangeRequest,
    employee_id: str = Depends(get_current_employee_id),
    session: AsyncSession = Depends(get_session),
):
    """
    Change your password. Requires authentication.
    
    Password requirements:
    - Minimum 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one digit
    """
    success = await employee_service.change_password(session, employee_id, request)
    return {"success": success, "message": "Password changed successfully"}
