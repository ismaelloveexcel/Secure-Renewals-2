from fastapi import APIRouter, Depends, status

from app.core.security import require_role
from app.database import get_session
from app.schemas.renewal import RenewalRequest, RenewalResponse
from app.services.renewals import renewal_service
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/renewals", tags=["renewals"])


@router.get("", response_model=list[RenewalResponse], summary="List renewal requests")
async def list_renewals(
    role: str = Depends(require_role()), session: AsyncSession = Depends(get_session)
):
    return await renewal_service.list_renewals(session)


@router.post(
    "",
    response_model=RenewalResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a renewal request",
)
async def create_renewal(
    request: RenewalRequest,
    role: str = Depends(require_role(["admin", "hr"])),
    session: AsyncSession = Depends(get_session),
):
    return await renewal_service.create_renewal(session, request, created_by=role)
