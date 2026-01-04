from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.schemas.template import TemplateCreate, TemplateUpdate, TemplateResponse
from app.services.template import TemplateService
from app.repositories.template import TemplateRepository
from app.auth.dependencies import require_role, authenticate_token
from app.database import get_session
from typing import List, Optional, Any

router = APIRouter(prefix="/api/templates", tags=["templates"])
service = TemplateService(TemplateRepository())

@router.post("", response_model=TemplateResponse, status_code=status.HTTP_201_CREATED)
async def create_template(
    data: TemplateCreate,
    session: AsyncSession = Depends(get_session),
    role: str = Depends(require_role(["admin", "hr"]))
):
    return await service.create(session, data, created_by="system")

@router.get("", response_model=List[TemplateResponse])
async def list_templates(
    type: Optional[str] = None,
    session: AsyncSession = Depends(get_session),
    claims: dict[str, Any] = Depends(authenticate_token)
):
    return await service.list(session, type)

@router.get("/{template_id}", response_model=TemplateResponse)
async def get_template(
    template_id: int,
    session: AsyncSession = Depends(get_session),
    claims: dict[str, Any] = Depends(authenticate_token)
):
    template = await service.get(session, template_id)
    if not template:
        raise HTTPException(404, "Template not found")
    return template

@router.put("/{template_id}", response_model=TemplateResponse)
async def update_template(
    template_id: int,
    data: TemplateUpdate,
    session: AsyncSession = Depends(get_session),
    role: str = Depends(require_role(["admin", "hr"]))
):
    updated = await service.update(session, template_id, data)
    if not updated:
        raise HTTPException(404, "Template not found")
    return updated

@router.post("/{template_id}/revision", response_model=TemplateResponse)
async def create_revision(
    template_id: int,
    data: TemplateCreate,
    session: AsyncSession = Depends(get_session),
    role: str = Depends(require_role(["admin", "hr"]))
):
    revision = await service.create_revision(session, template_id, data, created_by="system")
    if not revision:
        raise HTTPException(404, "Template not found")
    return revision

@router.delete("/{template_id}", response_model=TemplateResponse)
async def deactivate_template(
    template_id: int,
    session: AsyncSession = Depends(get_session),
    role: str = Depends(require_role(["admin", "hr"]))
):
    deactivated = await service.deactivate(session, template_id)
    if not deactivated:
        raise HTTPException(404, "Template not found")
    return deactivated
