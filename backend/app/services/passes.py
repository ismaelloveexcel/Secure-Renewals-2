from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.passes import Pass, PASS_TYPES
from app.repositories.passes import PassRepository
from app.schemas.passes import (
    PassCreate,
    PassPrintData,
    PassResponse,
    PassStats,
    PassTypeInfo,
    PassUpdate,
)


class PassService:
    """Service for pass generation and management."""

    def __init__(self, repository: PassRepository) -> None:
        self._repo = repository

    async def create_pass(
        self, session: AsyncSession, data: PassCreate, created_by: str
    ) -> PassResponse:
        """Create a new pass."""
        # Generate pass number
        pass_number = await self._repo.get_next_pass_number(session, data.pass_type)
        
        # Create pass
        pass_obj = await self._repo.create(
            session,
            pass_number=pass_number,
            pass_type=data.pass_type,
            full_name=data.full_name,
            email=data.email,
            phone=data.phone,
            department=data.department,
            position=data.position,
            valid_from=data.valid_from,
            valid_until=data.valid_until,
            access_areas=data.access_areas,
            purpose=data.purpose,
            sponsor_name=data.sponsor_name,
            employee_id=data.employee_id,
            created_by=created_by,
        )
        await session.commit()
        
        return PassResponse.model_validate(pass_obj)

    async def get_pass(self, session: AsyncSession, pass_number: str) -> PassResponse:
        """Get pass by pass number."""
        pass_obj = await self._repo.get_by_pass_number(session, pass_number)
        if not pass_obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Pass {pass_number} not found",
            )
        return PassResponse.model_validate(pass_obj)

    async def list_passes(
        self, session: AsyncSession, pass_type: Optional[str] = None, status_filter: Optional[str] = None
    ) -> List[PassResponse]:
        """List passes with optional filters."""
        if pass_type:
            passes = await self._repo.list_by_type(session, pass_type)
        elif status_filter:
            passes = await self._repo.list_all(session, status=status_filter)
        else:
            passes = await self._repo.list_all(session)
        
        return [PassResponse.model_validate(p) for p in passes]

    async def list_active_passes(self, session: AsyncSession) -> List[PassResponse]:
        """List all active passes."""
        passes = await self._repo.list_active(session)
        return [PassResponse.model_validate(p) for p in passes]

    async def list_expiring_passes(
        self, session: AsyncSession, days: int = 7
    ) -> List[PassResponse]:
        """List passes expiring soon."""
        passes = await self._repo.list_expiring_soon(session, days)
        return [PassResponse.model_validate(p) for p in passes]

    async def revoke_pass(self, session: AsyncSession, pass_number: str) -> bool:
        """Revoke a pass."""
        pass_obj = await self._repo.get_by_pass_number(session, pass_number)
        if not pass_obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Pass {pass_number} not found",
            )
        
        result = await self._repo.revoke(session, pass_number)
        await session.commit()
        return result

    async def mark_printed(self, session: AsyncSession, pass_number: str) -> bool:
        """Mark pass as printed."""
        pass_obj = await self._repo.get_by_pass_number(session, pass_number)
        if not pass_obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Pass {pass_number} not found",
            )
        
        result = await self._repo.mark_printed(session, pass_number)
        await session.commit()
        return result

    async def get_pass_stats(self, session: AsyncSession) -> PassStats:
        """Get pass statistics."""
        by_status = await self._repo.count_by_status(session)
        by_type = await self._repo.count_by_type(session)
        
        total = sum(by_status.values())
        active = by_status.get("active", 0)
        expired = by_status.get("expired", 0)
        revoked = by_status.get("revoked", 0)
        
        return PassStats(
            total_passes=total,
            active_passes=active,
            expired_passes=expired,
            revoked_passes=revoked,
            by_type=by_type,
        )

    async def get_print_data(self, session: AsyncSession, pass_number: str) -> PassPrintData:
        """Get pass data for printing."""
        pass_obj = await self._repo.get_by_pass_number(session, pass_number)
        if not pass_obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Pass {pass_number} not found",
            )
        
        # Generate QR code data (pass number + validity)
        qr_data = f"{pass_number}|{pass_obj.valid_from}|{pass_obj.valid_until}"
        
        return PassPrintData(
            pass_number=pass_obj.pass_number,
            pass_type=pass_obj.pass_type,
            full_name=pass_obj.full_name,
            department=pass_obj.department,
            position=pass_obj.position,
            valid_from=pass_obj.valid_from,
            valid_until=pass_obj.valid_until,
            access_areas=pass_obj.access_areas,
            qr_code_data=qr_data,
        )

    def get_pass_types(self) -> List[PassTypeInfo]:
        """Get available pass types."""
        return [PassTypeInfo(**pt) for pt in PASS_TYPES]


# Singleton instance
pass_service = PassService(PassRepository())
