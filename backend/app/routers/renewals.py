from fastapi import APIRouter, Depends, status

from app.schemas.renewal import RenewalRequest, RenewalResponse
from app.services.renewals import renewal_service
from app.core.security import require_role

router = APIRouter(prefix="/renewals", tags=["renewals"])


@router.get("", response_model=list[RenewalResponse], summary="List renewal requests")
async def list_renewals(role: str = Depends(require_role())):
    return renewal_service.list_renewals()


@router.post(
    "",
    response_model=RenewalResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a renewal request",
)
async def create_renewal(request: RenewalRequest, role: str = Depends(require_role(["admin", "hr"]))):
    return renewal_service.create_renewal(request, created_by=role)
