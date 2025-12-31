from typing import List

from app.schemas.renewal import RenewalRequest, RenewalResponse


class RenewalService:
    def __init__(self) -> None:
        self._storage: List[RenewalResponse] = []
        self._counter: int = 1

    def list_renewals(self) -> List[RenewalResponse]:
        return self._storage

    def create_renewal(self, payload: RenewalRequest, created_by: str) -> RenewalResponse:
        renewal = RenewalResponse(
            id=self._counter,
            employee_name=payload.employee_name,
            contract_end_date=payload.contract_end_date,
            renewal_period_months=payload.renewal_period_months,
            status="pending" if created_by != "admin" else "approved",
        )
        self._counter += 1
        self._storage.append(renewal)
        return renewal


renewal_service = RenewalService()
