from datetime import datetime
from typing import List

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories import RenewalAuditLogRepository, RenewalRepository
from app.schemas.renewal import RenewalRequest, RenewalResponse


class RenewalService:
    def __init__(
        self,
        renewal_repository: RenewalRepository,
        audit_repository: RenewalAuditLogRepository,
    ) -> None:
        self._renewals = renewal_repository
        self._audits = audit_repository

    async def list_renewals(self, session: AsyncSession) -> List[RenewalResponse]:
        renewals = await self._renewals.list(session)
        return [RenewalResponse.model_validate(renewal) for renewal in renewals]

    async def create_renewal(
        self, session: AsyncSession, payload: RenewalRequest, created_by: str
    ) -> RenewalResponse:
        status = "approved" if created_by == "admin" else "pending"

        async with session.begin():
            renewal = await self._renewals.create(
                session,
                employee_name=payload.employee_name,
                contract_end_date=payload.contract_end_date,
                renewal_period_months=payload.renewal_period_months,
                status=status,
                created_by_role=created_by,
            )

            snapshot = {
                "id": renewal.id,
                "employee_name": renewal.employee_name,
                "contract_end_date": renewal.contract_end_date.isoformat(),
                "renewal_period_months": renewal.renewal_period_months,
                "status": renewal.status,
                "created_by_role": renewal.created_by_role,
                "created_at": _isoformat(renewal.created_at),
                "updated_at": _isoformat(renewal.updated_at),
            }

            await self._audits.log_action(
                session,
                renewal_id=renewal.id,
                action="created",
                performed_by_role=created_by,
                snapshot=snapshot,
            )

        return RenewalResponse.model_validate(renewal)


def _isoformat(value: datetime | None) -> str | None:
    if value is None:
        return None
    return value.isoformat()


renewal_service = RenewalService(RenewalRepository(), RenewalAuditLogRepository())
