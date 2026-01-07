from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class ActivityLogCreate(BaseModel):
    entity_type: str
    entity_id: str
    stage: str
    action_type: str
    action_description: str
    performed_by: str
    performed_by_id: Optional[str] = None
    visibility: str = "internal"
    extra_data: Optional[dict] = None


class ActivityLogResponse(BaseModel):
    id: int
    entity_type: str
    entity_id: str
    stage: str
    action_type: str
    action_description: str
    performed_by: str
    performed_by_id: Optional[str]
    timestamp: datetime
    visibility: str
    extra_data: Optional[dict]

    class Config:
        from_attributes = True


class ActivityLogListResponse(BaseModel):
    items: List[ActivityLogResponse]
    total: int
