from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, constr, field_validator

from app.core.security import sanitize_text


class PassBase(BaseModel):
    """Base pass schema."""
    
    pass_type: str = Field(..., description="Type: recruitment, onboarding, visitor, contractor, temporary")
    full_name: constr(min_length=1, max_length=120) = Field(..., description="Full name of pass holder")
    email: Optional[str] = Field(None, description="Email address")
    phone: Optional[str] = Field(None, description="Phone number")
    department: Optional[str] = Field(None, description="Department")
    position: Optional[str] = Field(None, description="Position/Role")
    valid_from: date = Field(..., description="Pass valid from date")
    valid_until: date = Field(..., description="Pass valid until date")
    access_areas: Optional[str] = Field(None, description="Allowed access areas (comma-separated)")
    purpose: Optional[str] = Field(None, description="Purpose of visit/pass")
    sponsor_name: Optional[str] = Field(None, description="Name of employee sponsor")
    employee_id: Optional[str] = Field(None, description="Linked employee ID (for onboarding)")
    
    model_config = ConfigDict(from_attributes=True)
    
    @field_validator("full_name")
    @classmethod
    def sanitize_name(cls, value: str) -> str:
        return sanitize_text(value)
    
    @field_validator("pass_type")
    @classmethod
    def validate_pass_type(cls, value: str) -> str:
        valid_types = ["recruitment", "onboarding", "visitor", "contractor", "temporary"]
        if value.lower() not in valid_types:
            raise ValueError(f"Pass type must be one of: {', '.join(valid_types)}")
        return value.lower()


class PassCreate(PassBase):
    """Schema for creating a new pass."""
    pass


class PassUpdate(BaseModel):
    """Schema for updating a pass."""
    
    full_name: Optional[str] = Field(None, description="Full name of pass holder")
    email: Optional[str] = Field(None, description="Email address")
    phone: Optional[str] = Field(None, description="Phone number")
    department: Optional[str] = Field(None, description="Department")
    position: Optional[str] = Field(None, description="Position/Role")
    valid_until: Optional[date] = Field(None, description="Extend pass until date")
    access_areas: Optional[str] = Field(None, description="Allowed access areas")
    purpose: Optional[str] = Field(None, description="Purpose of visit/pass")
    sponsor_name: Optional[str] = Field(None, description="Name of employee sponsor")


class PassResponse(PassBase):
    """Schema for pass response."""
    
    id: int = Field(..., description="Pass ID")
    pass_number: str = Field(..., description="Unique pass number")
    status: str = Field(..., description="Pass status: active, expired, revoked")
    is_printed: bool = Field(..., description="Whether pass has been printed")
    created_by: str = Field(..., description="Created by employee ID")
    created_at: datetime = Field(..., description="Creation timestamp")


class PassTypeInfo(BaseModel):
    """Schema for pass type information."""
    
    key: str = Field(..., description="Pass type key")
    name: str = Field(..., description="Display name")
    description: str = Field(..., description="Description")


class PassStats(BaseModel):
    """Schema for pass statistics."""
    
    total_passes: int = Field(..., description="Total passes issued")
    active_passes: int = Field(..., description="Currently active passes")
    expired_passes: int = Field(..., description="Expired passes")
    revoked_passes: int = Field(..., description="Revoked passes")
    by_type: dict = Field(..., description="Counts by pass type")


class PassPrintData(BaseModel):
    """Schema for pass print data."""
    
    pass_number: str = Field(..., description="Pass number")
    pass_type: str = Field(..., description="Pass type")
    full_name: str = Field(..., description="Full name")
    department: Optional[str] = Field(None, description="Department")
    position: Optional[str] = Field(None, description="Position")
    valid_from: date = Field(..., description="Valid from")
    valid_until: date = Field(..., description="Valid until")
    access_areas: Optional[str] = Field(None, description="Access areas")
    qr_code_data: str = Field(..., description="Data for QR code")
