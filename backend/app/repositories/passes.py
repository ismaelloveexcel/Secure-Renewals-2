from datetime import date
from typing import Optional, Sequence

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.passes import Pass


class PassRepository:
    """Repository for pass database operations."""

    async def get_by_id(self, session: AsyncSession, id: int) -> Optional[Pass]:
        """Get pass by ID."""
        result = await session.execute(select(Pass).where(Pass.id == id))
        return result.scalar_one_or_none()

    async def get_by_pass_number(self, session: AsyncSession, pass_number: str) -> Optional[Pass]:
        """Get pass by pass number."""
        result = await session.execute(
            select(Pass).where(Pass.pass_number == pass_number)
        )
        return result.scalar_one_or_none()

    async def list_all(self, session: AsyncSession, status: Optional[str] = None) -> Sequence[Pass]:
        """List all passes, optionally filtered by status."""
        query = select(Pass).order_by(Pass.created_at.desc())
        if status:
            query = query.where(Pass.status == status)
        result = await session.execute(query)
        return result.scalars().all()

    async def list_by_type(self, session: AsyncSession, pass_type: str) -> Sequence[Pass]:
        """List passes by type."""
        result = await session.execute(
            select(Pass)
            .where(Pass.pass_type == pass_type)
            .order_by(Pass.created_at.desc())
        )
        return result.scalars().all()

    async def list_active(self, session: AsyncSession) -> Sequence[Pass]:
        """List active passes."""
        today = date.today()
        result = await session.execute(
            select(Pass)
            .where(Pass.status == "active")
            .where(Pass.valid_until >= today)
            .order_by(Pass.valid_until)
        )
        return result.scalars().all()

    async def list_expiring_soon(self, session: AsyncSession, days: int = 7) -> Sequence[Pass]:
        """List passes expiring within specified days."""
        from datetime import timedelta
        today = date.today()
        end_date = today + timedelta(days=days)
        result = await session.execute(
            select(Pass)
            .where(Pass.status == "active")
            .where(Pass.valid_until >= today)
            .where(Pass.valid_until <= end_date)
            .order_by(Pass.valid_until)
        )
        return result.scalars().all()

    async def create(
        self,
        session: AsyncSession,
        *,
        pass_number: str,
        pass_type: str,
        full_name: str,
        valid_from: date,
        valid_until: date,
        created_by: str,
        email: Optional[str] = None,
        phone: Optional[str] = None,
        department: Optional[str] = None,
        position: Optional[str] = None,
        access_areas: Optional[str] = None,
        purpose: Optional[str] = None,
        sponsor_name: Optional[str] = None,
        employee_id: Optional[str] = None,
    ) -> Pass:
        """Create a new pass."""
        pass_obj = Pass(
            pass_number=pass_number,
            pass_type=pass_type,
            full_name=full_name,
            email=email,
            phone=phone,
            department=department,
            position=position,
            valid_from=valid_from,
            valid_until=valid_until,
            access_areas=access_areas,
            purpose=purpose,
            sponsor_name=sponsor_name,
            employee_id=employee_id,
            created_by=created_by,
            status="active",
            is_printed=False,
        )
        session.add(pass_obj)
        await session.flush()
        await session.refresh(pass_obj)
        return pass_obj

    async def update_status(
        self, session: AsyncSession, pass_number: str, status: str
    ) -> bool:
        """Update pass status."""
        result = await session.execute(
            update(Pass)
            .where(Pass.pass_number == pass_number)
            .values(status=status)
        )
        return result.rowcount > 0

    async def mark_printed(self, session: AsyncSession, pass_number: str) -> bool:
        """Mark pass as printed."""
        result = await session.execute(
            update(Pass)
            .where(Pass.pass_number == pass_number)
            .values(is_printed=True)
        )
        return result.rowcount > 0

    async def revoke(self, session: AsyncSession, pass_number: str) -> bool:
        """Revoke a pass."""
        return await self.update_status(session, pass_number, "revoked")

    async def count_by_status(self, session: AsyncSession) -> dict:
        """Count passes by status."""
        result = await session.execute(
            select(Pass.status, func.count(Pass.id))
            .group_by(Pass.status)
        )
        return {row[0]: row[1] for row in result.all()}

    async def count_by_type(self, session: AsyncSession) -> dict:
        """Count passes by type."""
        result = await session.execute(
            select(Pass.pass_type, func.count(Pass.id))
            .group_by(Pass.pass_type)
        )
        return {row[0]: row[1] for row in result.all()}

    async def get_next_pass_number(self, session: AsyncSession, pass_type: str) -> str:
        """Generate next pass number."""
        # Format: TYPE-YYYYMMDD-XXXX (e.g., REC-20241231-0001)
        from datetime import datetime
        
        prefix_map = {
            "recruitment": "REC",
            "onboarding": "ONB",
            "visitor": "VIS",
            "contractor": "CON",
            "temporary": "TMP",
        }
        prefix = prefix_map.get(pass_type, "PAS")
        date_str = datetime.now().strftime("%Y%m%d")
        
        # Get count for today
        today_prefix = f"{prefix}-{date_str}-"
        result = await session.execute(
            select(func.count(Pass.id))
            .where(Pass.pass_number.like(f"{today_prefix}%"))
        )
        count = result.scalar() or 0
        
        return f"{today_prefix}{count + 1:04d}"
