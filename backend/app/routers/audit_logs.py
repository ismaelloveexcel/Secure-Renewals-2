from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.audit_log import AuditLogService
from app.repositories.audit_log import AuditLogRepository
from app.schemas.audit_log import AuditLogBase, AuditLogResponse
from app.auth.dependencies import require_role
from app.database import get_session
from typing import List, Optional

router = APIRouter(prefix="/api/audit-logs", tags=["audit-logs"])
service = AuditLogService(AuditLogRepository())

@router.post("", response_model=AuditLogResponse)
async def log_action(
    data: AuditLogBase,
    session: AsyncSession = Depends(get_session),
    user = Depends(require_role(["admin", "hr"]))
):
    return await service.log_action(session, data)

@router.get("", response_model=List[AuditLogResponse])
async def list_logs(
    entity: Optional[str] = None,
    user_id: Optional[str] = None,
    session: AsyncSession = Depends(get_session),
    user = Depends(require_role(["admin"]))
):
    return await service.list(session, entity, user_id)
