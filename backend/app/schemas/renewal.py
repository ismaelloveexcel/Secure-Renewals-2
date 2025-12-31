from datetime import date
from pydantic import BaseModel, ConfigDict, Field, constr, field_validator

from app.core.security import sanitize_text


class RenewalBase(BaseModel):
    employee_name: constr(min_length=1, max_length=120) = Field(..., description="Employee full name")
    contract_end_date: date = Field(..., description="Current contract end date")
    renewal_period_months: int = Field(..., ge=1, le=36, description="Requested renewal period in months")

    model_config = ConfigDict(from_attributes=True)


class RenewalRequest(RenewalBase):
    model_config = ConfigDict(validate_assignment=True)

    @field_validator("employee_name")
    @classmethod
    def sanitize_name(cls, value: str) -> str:
        return sanitize_text(value)


class RenewalResponse(RenewalBase):
    id: int = Field(..., description="Internal identifier")
    status: str = Field(..., description="Current approval status")
