from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, constr, field_validator

from app.core.security import sanitize_text


class EmployeeBase(BaseModel):
    """Base employee schema."""

    employee_id: constr(min_length=1, max_length=50) = Field(..., description="Unique employee identifier")
    name: constr(min_length=1, max_length=120) = Field(..., description="Employee full name")
    email: Optional[str] = Field(None, description="Employee email address")
    department: Optional[str] = Field(None, description="Department name")
    date_of_birth: date = Field(..., description="Date of birth (used for initial password)")
    role: str = Field(default="viewer", description="Role: admin, hr, or viewer")

    model_config = ConfigDict(from_attributes=True)

    @field_validator("name")
    @classmethod
    def sanitize_name(cls, value: str) -> str:
        return sanitize_text(value)


class EmployeeCreate(EmployeeBase):
    """Schema for creating a new employee."""

    pass


class EmployeeResponse(EmployeeBase):
    """Schema for employee response."""

    id: int = Field(..., description="Internal identifier")
    is_active: bool = Field(..., description="Whether employee is active")
    password_changed: bool = Field(..., description="Whether password has been changed from DOB")
    created_at: datetime = Field(..., description="Creation timestamp")


class EmployeeCSVRow(BaseModel):
    """Schema for CSV import row."""

    employee_id: str = Field(..., description="Unique employee identifier")
    name: str = Field(..., description="Employee full name")
    email: Optional[str] = Field(None, description="Employee email address")
    department: Optional[str] = Field(None, description="Department name")
    date_of_birth: str = Field(..., description="Date of birth in DDMMYYYY format")
    role: str = Field(default="viewer", description="Role: admin, hr, or viewer")


class LoginRequest(BaseModel):
    """Schema for login request."""

    employee_id: str = Field(..., description="Employee ID")
    password: str = Field(..., description="Password (DOB for first login, then custom password)")


class LoginResponse(BaseModel):
    """Schema for login response."""

    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(default="bearer", description="Token type")
    requires_password_change: bool = Field(..., description="Whether user must change password")
    employee_id: str = Field(..., description="Employee ID")
    name: str = Field(..., description="Employee name")
    role: str = Field(..., description="User role")


class PasswordChangeRequest(BaseModel):
    """Schema for password change request."""

    current_password: str = Field(..., description="Current password")
    new_password: constr(min_length=8) = Field(..., description="New password (min 8 characters)")

    @field_validator("new_password")
    @classmethod
    def validate_password_strength(cls, value: str) -> str:
        if not any(c.isupper() for c in value):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.islower() for c in value):
            raise ValueError("Password must contain at least one lowercase letter")
        if not any(c.isdigit() for c in value):
            raise ValueError("Password must contain at least one digit")
        return value


class PasswordResetRequest(BaseModel):
    """Schema for admin password reset."""

    employee_id: str = Field(..., description="Employee ID to reset")
