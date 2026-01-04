from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.notification import NotificationService
from app.repositories.notification import NotificationRepository
from app.schemas.notification import NotificationCreate, NotificationResponse
from app.auth.dependencies import authenticate_token
from app.database import get_session
from typing import List, Optional, Any

router = APIRouter(prefix="/api/notifications", tags=["notifications"])
service = NotificationService(NotificationRepository())

@router.post("", response_model=NotificationResponse)
async def create_notification(
    data: NotificationCreate,
    session: AsyncSession = Depends(get_session),
    claims: dict[str, Any] = Depends(authenticate_token)
):
    return await service.create(session, data)

@router.get("", response_model=List[NotificationResponse])
async def list_notifications(
    unread_only: bool = False,
    session: AsyncSession = Depends(get_session),
    claims: dict[str, Any] = Depends(authenticate_token)
):
    employee_id = claims.get("sub")
    return await service.list(session, employee_id, unread_only)

@router.post("/{notification_id}/read", response_model=NotificationResponse)
async def mark_read(
    notification_id: int,
    session: AsyncSession = Depends(get_session),
    claims: dict[str, Any] = Depends(authenticate_token)
):
    return await service.mark_read(session, notification_id)
