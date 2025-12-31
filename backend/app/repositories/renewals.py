from datetime import date
from typing import Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Renewal, RenewalAuditLog


class RenewalRepository:
    async def list(self, session: AsyncSession) -> Sequence[Renewal]:
        result = await session.execute(select(Renewal).order_by(Renewal.id))
        return result.scalars().all()

    async def create(
        self,
        session: AsyncSession,
        *,
        employee_name: str,
        contract_end_date: date,
        renewal_period_months: int,
        status: str,
        created_by_role: str,
    ) -> Renewal:
        renewal = Renewal(
            employee_name=employee_name,
            contract_end_date=contract_end_date,
            renewal_period_months=renewal_period_months,
            status=status,
            created_by_role=created_by_role,
        )
        session.add(renewal)
        await session.flush()
        await session.refresh(renewal)
        return renewal


class RenewalAuditLogRepository:
    async def log_action(
        self,
        session: AsyncSession,
        *,
        renewal_id: int,
        action: str,
        performed_by_role: str,
        snapshot: dict,
    ) -> RenewalAuditLog:
        entry = RenewalAuditLog(
            renewal_id=renewal_id,
            action=action,
            performed_by_role=performed_by_role,
            snapshot=snapshot,
        )
        session.add(entry)
        await session.flush()
        await session.refresh(entry)
        return entry
