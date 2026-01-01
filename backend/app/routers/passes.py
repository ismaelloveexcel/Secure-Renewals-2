from typing import List, Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import require_role
from app.database import get_session
from app.routers.auth import get_current_employee_id
from app.schemas.passes import (
    PassCreate,
    PassPrintData,
    PassResponse,
    PassStats,
    PassTypeInfo,
)
from app.services.passes import pass_service

router = APIRouter(prefix="/passes", tags=["passes"])


@router.get(
    "/types",
    response_model=List[PassTypeInfo],
    summary="Get available pass types",
)
async def get_pass_types():
    """
    Get list of available pass types.
    
    Types include:
    - recruitment: For candidates attending interviews
    - onboarding: For new employees during onboarding
    - visitor: For general visitors
    - contractor: For contractors and external workers
    - temporary: Short-term access
    """
    return pass_service.get_pass_types()


@router.get(
    "/stats",
    response_model=PassStats,
    summary="Get pass statistics",
)
async def get_pass_stats(
    role: str = Depends(require_role(["admin", "hr"])),
    session: AsyncSession = Depends(get_session),
):
    """
    Get pass statistics.
    
    **Admin and HR only.**
    """
    return await pass_service.get_pass_stats(session)


@router.get(
    "",
    response_model=List[PassResponse],
    summary="List passes",
)
async def list_passes(
    pass_type: Optional[str] = Query(None, description="Filter by pass type"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status"),
    role: str = Depends(require_role(["admin", "hr"])),
    session: AsyncSession = Depends(get_session),
):
    """
    List all passes with optional filters.
    
    **Admin and HR only.**
    """
    return await pass_service.list_passes(session, pass_type, status_filter)


@router.get(
    "/active",
    response_model=List[PassResponse],
    summary="List active passes",
)
async def list_active_passes(
    role: str = Depends(require_role(["admin", "hr"])),
    session: AsyncSession = Depends(get_session),
):
    """
    List all currently active passes.
    
    **Admin and HR only.**
    """
    return await pass_service.list_active_passes(session)


@router.get(
    "/expiring",
    response_model=List[PassResponse],
    summary="List expiring passes",
)
async def list_expiring_passes(
    days: int = Query(7, description="Days until expiry"),
    role: str = Depends(require_role(["admin", "hr"])),
    session: AsyncSession = Depends(get_session),
):
    """
    List passes expiring within specified days.
    
    **Admin and HR only.**
    """
    return await pass_service.list_expiring_passes(session, days)


@router.get(
    "/{pass_number}",
    response_model=PassResponse,
    summary="Get pass details",
)
async def get_pass(
    pass_number: str,
    role: str = Depends(require_role(["admin", "hr"])),
    session: AsyncSession = Depends(get_session),
):
    """
    Get pass details by pass number.
    
    **Admin and HR only.**
    """
    return await pass_service.get_pass(session, pass_number)


@router.post(
    "",
    response_model=PassResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new pass",
)
async def create_pass(
    data: PassCreate,
    employee_id: str = Depends(get_current_employee_id),
    role: str = Depends(require_role(["admin", "hr"])),
    session: AsyncSession = Depends(get_session),
):
    """
    Create a new pass.
    
    Pass number is auto-generated in format: TYPE-YYYYMMDD-XXXX
    (e.g., REC-20241231-0001 for recruitment pass)
    
    **Admin and HR only.**
    """
    return await pass_service.create_pass(session, data, employee_id)


@router.post(
    "/{pass_number}/revoke",
    status_code=status.HTTP_200_OK,
    summary="Revoke a pass",
)
async def revoke_pass(
    pass_number: str,
    role: str = Depends(require_role(["admin", "hr"])),
    session: AsyncSession = Depends(get_session),
):
    """
    Revoke a pass. Pass can no longer be used.
    
    **Admin and HR only.**
    """
    success = await pass_service.revoke_pass(session, pass_number)
    return {"success": success, "message": f"Pass {pass_number} revoked"}


@router.post(
    "/{pass_number}/print",
    response_model=PassPrintData,
    summary="Get pass print data",
)
async def get_print_data(
    pass_number: str,
    role: str = Depends(require_role(["admin", "hr"])),
    session: AsyncSession = Depends(get_session),
):
    """
    Get pass data for printing including QR code data.
    
    Also marks the pass as printed.
    
    **Admin and HR only.**
    """
    # Mark as printed
    await pass_service.mark_printed(session, pass_number)
    
    # Get print data
    return await pass_service.get_print_data(session, pass_number)
