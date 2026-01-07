from datetime import datetime
from typing import List, Optional
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.activity_log import ActivityLog
from app.schemas.activity_log import ActivityLogCreate


class ActivityLogService:
    async def create_log(
        self,
        session: AsyncSession,
        data: ActivityLogCreate
    ) -> ActivityLog:
        log_entry = ActivityLog(
            entity_type=data.entity_type,
            entity_id=data.entity_id,
            stage=data.stage,
            action_type=data.action_type,
            action_description=data.action_description,
            performed_by=data.performed_by,
            performed_by_id=data.performed_by_id,
            timestamp=datetime.utcnow(),
            visibility=data.visibility,
            extra_data=data.extra_data
        )
        session.add(log_entry)
        await session.commit()
        await session.refresh(log_entry)
        return log_entry

    async def get_logs_by_entity(
        self,
        session: AsyncSession,
        entity_type: str,
        entity_id: str,
        visibility_filter: Optional[str] = None,
        limit: int = 50
    ) -> List[ActivityLog]:
        query = select(ActivityLog).where(
            ActivityLog.entity_type == entity_type,
            ActivityLog.entity_id == entity_id
        )
        
        if visibility_filter:
            query = query.where(ActivityLog.visibility == visibility_filter)
        
        query = query.order_by(desc(ActivityLog.timestamp)).limit(limit)
        
        result = await session.execute(query)
        return list(result.scalars().all())

    async def get_candidate_logs(
        self,
        session: AsyncSession,
        candidate_id: str,
        include_internal: bool = False
    ) -> List[ActivityLog]:
        query = select(ActivityLog).where(
            ActivityLog.entity_type == "candidate",
            ActivityLog.entity_id == candidate_id
        )
        
        if not include_internal:
            query = query.where(ActivityLog.visibility == "candidate")
        
        query = query.order_by(desc(ActivityLog.timestamp))
        
        result = await session.execute(query)
        return list(result.scalars().all())

    async def log_action(
        self,
        session: AsyncSession,
        entity_type: str,
        entity_id: str,
        stage: str,
        action_type: str,
        description: str,
        performed_by: str,
        performed_by_id: Optional[str] = None,
        visibility: str = "internal",
        extra_data: Optional[dict] = None
    ) -> ActivityLog:
        data = ActivityLogCreate(
            entity_type=entity_type,
            entity_id=entity_id,
            stage=stage,
            action_type=action_type,
            action_description=description,
            performed_by=performed_by,
            performed_by_id=performed_by_id,
            visibility=visibility,
            extra_data=extra_data
        )
        return await self.create_log(session, data)


activity_log_service = ActivityLogService()
