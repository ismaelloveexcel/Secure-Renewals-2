from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.schemas.activity_log import ActivityLogResponse, ActivityLogListResponse
from app.services.activity_log import activity_log_service

router = APIRouter(prefix="/activity-logs", tags=["activity-logs"])


@router.get(
    "/entity/{entity_type}/{entity_id}",
    response_model=List[ActivityLogResponse],
    summary="Get activity logs for an entity",
)
async def get_entity_logs(
    entity_type: str,
    entity_id: str,
    visibility: Optional[str] = Query(None, description="Filter by visibility"),
    limit: int = Query(50, le=100),
    session: AsyncSession = Depends(get_session),
):
    """
    Get activity logs for a specific entity (candidate, requisition, etc.)
    
    Visibility filter options:
    - internal: HR/Manager only logs
    - candidate: Logs visible to candidate
    - manager: Logs visible to manager
    """
    logs = await activity_log_service.get_logs_by_entity(
        session, entity_type, entity_id, visibility, limit
    )
    return logs


@router.get(
    "/candidate/{candidate_id}",
    response_model=List[ActivityLogResponse],
    summary="Get candidate-visible activity logs",
)
async def get_candidate_logs(
    candidate_id: str,
    include_internal: bool = Query(False, description="Include internal logs (HR only)"),
    session: AsyncSession = Depends(get_session),
):
    """
    Get activity logs for a candidate.
    
    By default, only returns logs with visibility='candidate'.
    Set include_internal=true to see all logs (requires HR/Admin role).
    """
    logs = await activity_log_service.get_candidate_logs(
        session, candidate_id, include_internal
    )
    return logs
