from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, constr, field_validator

from app.core.security import sanitize_text


class EmployeeBase(BaseModel):
    """Base employee schema with minimal required fields."""

    employee_id: constr(min_length=1, max_length=50) = Field(..., description="Unique employee identifier")
    name: constr(min_length=1, max_length=120) = Field(..., description="Employee full name")
    email: Optional[str] = Field(None, description="Company email address")
    department: Optional[str] = Field(None, description="Department name")
    date_of_birth: date = Field(..., description="Date of birth (used for initial password)")
    role: str = Field(default="viewer", description="Role: admin, hr, or viewer")

    model_config = ConfigDict(from_attributes=True)

    @field_validator("name")
    @classmethod
    def sanitize_name(cls, value: str) -> str:
        return sanitize_text(value)


class EmployeeCreate(BaseModel):
    """Schema for creating a new employee (minimal fields for HR)."""
    
    employee_id: constr(min_length=1, max_length=50) = Field(..., description="Unique employee identifier")
    name: constr(min_length=1, max_length=120) = Field(..., description="Employee full name")
    email: Optional[str] = Field(None, description="Company email address")
    department: Optional[str] = Field(None, description="Department name")
    date_of_birth: date = Field(..., description="Date of birth")
    role: str = Field(default="viewer", description="Role: admin, hr, or viewer")
    
    job_title: Optional[str] = Field(None, description="Job title")
    function: Optional[str] = Field(None, description="Function/level")
    location: Optional[str] = Field(None, description="Work location")
    joining_date: Optional[date] = Field(None, description="Date of joining")

    @field_validator("name")
    @classmethod
    def sanitize_name(cls, value: str) -> str:
        return sanitize_text(value)


class EmployeeUpdate(BaseModel):
    """Schema for updating employee (HR-managed fields)."""
    
    name: Optional[str] = None
    email: Optional[str] = None
    department: Optional[str] = None
    job_title: Optional[str] = None
    function: Optional[str] = None
    location: Optional[str] = None
    work_schedule: Optional[str] = None
    gender: Optional[str] = None
    nationality: Optional[str] = None
    company_phone: Optional[str] = None
    line_manager_id: Optional[int] = None
    line_manager_name: Optional[str] = None
    line_manager_email: Optional[str] = None
    joining_date: Optional[date] = None
    last_promotion_date: Optional[date] = None
    last_increment_date: Optional[date] = None
    probation_start_date: Optional[date] = None
    probation_end_date: Optional[date] = None
    one_month_eval_date: Optional[date] = None
    three_month_eval_date: Optional[date] = None
    six_month_eval_date: Optional[date] = None
    probation_status: Optional[str] = None
    employment_status: Optional[str] = None
    years_of_service: Optional[int] = None
    annual_leave_entitlement: Optional[int] = None
    overtime_type: Optional[str] = None
    security_clearance: Optional[str] = None
    visa_status: Optional[str] = None
    
    # UAE Compliance - Visa tracking
    visa_number: Optional[str] = None
    visa_issue_date: Optional[date] = None
    visa_expiry_date: Optional[date] = None
    
    # UAE Compliance - Emirates ID
    emirates_id_number: Optional[str] = None
    emirates_id_expiry: Optional[date] = None
    
    # UAE Compliance - Medical Fitness
    medical_fitness_date: Optional[date] = None
    medical_fitness_expiry: Optional[date] = None
    
    # UAE Compliance - ILOE (Insurance)
    iloe_status: Optional[str] = None
    iloe_expiry: Optional[date] = None
    
    # UAE Compliance - Contract
    contract_type: Optional[str] = None
    contract_start_date: Optional[date] = None
    contract_end_date: Optional[date] = None
    
    medical_insurance_provider: Optional[str] = None
    medical_insurance_category: Optional[str] = None
    basic_salary: Optional[Decimal] = None
    housing_allowance: Optional[Decimal] = None
    transportation_allowance: Optional[Decimal] = None
    air_ticket_entitlement: Optional[Decimal] = None
    other_allowance: Optional[Decimal] = None
    consultancy_fees: Optional[Decimal] = None
    air_fare_allowance: Optional[Decimal] = None
    family_air_ticket_allowance: Optional[Decimal] = None
    net_salary: Optional[Decimal] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None


class EmployeeResponse(BaseModel):
    """Schema for employee response."""

    id: int = Field(..., description="Internal identifier")
    employee_id: str
    name: str
    email: Optional[str] = None
    department: Optional[str] = None
    date_of_birth: date
    role: str
    is_active: bool
    password_changed: bool
    
    job_title: Optional[str] = None
    function: Optional[str] = None
    location: Optional[str] = None
    work_schedule: Optional[str] = None
    gender: Optional[str] = None
    nationality: Optional[str] = None
    company_phone: Optional[str] = None
    line_manager_name: Optional[str] = None
    line_manager_email: Optional[str] = None
    joining_date: Optional[date] = None
    probation_status: Optional[str] = None
    employment_status: Optional[str] = None
    annual_leave_entitlement: Optional[int] = None
    profile_status: str = "incomplete"
    
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class EmployeeDetailResponse(EmployeeResponse):
    """Full employee details (for HR/Admin view)."""
    
    line_manager_id: Optional[int] = None
    last_promotion_date: Optional[date] = None
    last_increment_date: Optional[date] = None
    probation_start_date: Optional[date] = None
    probation_end_date: Optional[date] = None
    one_month_eval_date: Optional[date] = None
    three_month_eval_date: Optional[date] = None
    six_month_eval_date: Optional[date] = None
    years_of_service: Optional[int] = None
    overtime_type: Optional[str] = None
    security_clearance: Optional[str] = None
    visa_status: Optional[str] = None
    
    # UAE Compliance - Visa tracking
    visa_number: Optional[str] = None
    visa_issue_date: Optional[date] = None
    visa_expiry_date: Optional[date] = None
    
    # UAE Compliance - Emirates ID
    emirates_id_number: Optional[str] = None
    emirates_id_expiry: Optional[date] = None
    
    # UAE Compliance - Medical Fitness
    medical_fitness_date: Optional[date] = None
    medical_fitness_expiry: Optional[date] = None
    
    # UAE Compliance - ILOE (Insurance)
    iloe_status: Optional[str] = None
    iloe_expiry: Optional[date] = None
    
    # UAE Compliance - Contract
    contract_type: Optional[str] = None
    contract_start_date: Optional[date] = None
    contract_end_date: Optional[date] = None
    
    medical_insurance_provider: Optional[str] = None
    medical_insurance_category: Optional[str] = None
    basic_salary: Optional[Decimal] = None
    housing_allowance: Optional[Decimal] = None
    transportation_allowance: Optional[Decimal] = None
    air_ticket_entitlement: Optional[Decimal] = None
    other_allowance: Optional[Decimal] = None
    net_salary: Optional[Decimal] = None
    updated_at: datetime
    last_login: Optional[datetime] = None


class EmployeeCSVRow(BaseModel):
    """Schema for CSV import row - matches actual Baynunah employee database format."""

    employee_id: str = Field(..., alias="Employee No", description="Unique employee identifier")
    name: str = Field(..., alias="Employee Name", description="Employee full name")
    job_title: Optional[str] = Field(None, alias="Job Title")
    function: Optional[str] = Field(None, alias="Function")
    annual_leave_entitlement: Optional[int] = Field(None, alias="Annual Leave Entitlement")
    overtime_type: Optional[str] = Field(None, alias="Overtime Type")
    date_of_birth: Optional[str] = Field(None, alias="DOB")
    gender: Optional[str] = Field(None, alias="Gender")
    nationality: Optional[str] = Field(None, alias="Nationality")
    line_manager_name: Optional[str] = Field(None, alias="Line Manager")
    line_manager_email: Optional[str] = Field(None, alias="Line Manager's Email (from Line Manager)")
    department: Optional[str] = Field(None, alias="Department")
    location: Optional[str] = Field(None, alias="Location")
    work_schedule: Optional[str] = Field(None, alias="Work Schedule")
    joining_date: Optional[str] = Field(None, alias="Joining Date")
    one_month_eval_date: Optional[str] = Field(None, alias="1 Month Eval Date")
    three_month_eval_date: Optional[str] = Field(None, alias="3 Month Eval Date")
    six_month_eval_date: Optional[str] = Field(None, alias="6 Month Eval Date")
    probation_status: Optional[str] = Field(None, alias="Probation Status")
    employment_status: Optional[str] = Field(None, alias="Employment Status")
    email: Optional[str] = Field(None, alias="Company Email Address")
    company_phone: Optional[str] = Field(None, alias="Company Phone Number")
    last_promotion_date: Optional[str] = Field(None, alias="Last Promotion Date")
    last_increment_date: Optional[str] = Field(None, alias="Last Increment Date")
    years_of_service: Optional[int] = Field(None, alias="Years of Service")
    security_clearance: Optional[str] = Field(None, alias="Security Clearance")
    visa_status: Optional[str] = Field(None, alias="Visa Status")
    medical_insurance_provider: Optional[str] = Field(None, alias="Medical Insurance Provider")
    medical_insurance_category: Optional[str] = Field(None, alias="Medical Insurance Category")
    basic_salary: Optional[str] = Field(None, alias="Basic Salary")
    housing_allowance: Optional[str] = Field(None, alias="Housing")
    transportation_allowance: Optional[str] = Field(None, alias="Transportation")
    air_ticket_entitlement_amount: Optional[str] = Field(None, alias="Air Ticket Entitlement")
    other_allowance: Optional[str] = Field(None, alias="Other Allowance")
    consultancy_fees: Optional[str] = Field(None, alias="Consultancy Fees")
    air_fare_allowance: Optional[str] = Field(None, alias="Air Fare Allowance")
    family_air_ticket_allowance: Optional[str] = Field(None, alias="Family Air Ticket Allowance")
    net_salary: Optional[str] = Field(None, alias="Net Salary")

    model_config = ConfigDict(populate_by_name=True)


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


# Employee Profile Schemas

class EmployeeProfileBase(BaseModel):
    """Base schema for employee self-service profile."""
    
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    emergency_contact_relationship: Optional[str] = None
    emergency_contact_2_name: Optional[str] = None
    emergency_contact_2_phone: Optional[str] = None
    emergency_contact_2_relationship: Optional[str] = None
    personal_phone: Optional[str] = None
    personal_email: Optional[str] = None
    current_address: Optional[str] = None
    permanent_address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    bank_name: Optional[str] = None
    bank_account_number: Optional[str] = None
    bank_iban: Optional[str] = None
    bank_swift_code: Optional[str] = None
    passport_number: Optional[str] = None
    passport_expiry: Optional[str] = None
    national_id_number: Optional[str] = None
    uae_id_number: Optional[str] = None
    uae_id_expiry: Optional[str] = None
    driving_license_number: Optional[str] = None
    driving_license_expiry: Optional[str] = None
    driving_license_country: Optional[str] = None
    highest_education: Optional[str] = None
    education_institution: Optional[str] = None
    graduation_year: Optional[int] = None
    shirt_size: Optional[str] = None
    pants_size: Optional[str] = None
    shoe_size: Optional[str] = None
    dietary_restrictions: Optional[str] = None
    medical_conditions: Optional[str] = None
    additional_notes: Optional[str] = None


class EmployeeProfileSubmit(EmployeeProfileBase):
    """Schema for employee submitting their profile."""
    pass


class EmployeeProfileResponse(EmployeeProfileBase):
    """Schema for profile response."""
    
    id: int
    employee_id: int
    submitted_at: Optional[datetime] = None
    reviewed_at: Optional[datetime] = None
    reviewed_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# UAE Compliance Alert Schemas

class ComplianceAlertItem(BaseModel):
    """Single compliance alert item."""
    
    employee_id: str = Field(..., description="Employee ID")
    name: str = Field(..., description="Employee name")
    document_type: str = Field(..., description="Type of document (Visa, Emirates ID, etc.)")
    expiry_date: str = Field(..., description="Expiry date (ISO format)")
    days_remaining: int = Field(..., description="Days until expiry (negative if expired)")
    days_overdue: Optional[int] = Field(None, description="Days overdue (if expired)")


class ComplianceAlertsResponse(BaseModel):
    """Response schema for compliance alerts."""
    
    expired: list[ComplianceAlertItem] = Field(default_factory=list, description="Expired documents")
    days_7: list[ComplianceAlertItem] = Field(default_factory=list, description="Expiring within 7 days")
    days_30: list[ComplianceAlertItem] = Field(default_factory=list, description="Expiring within 30 days")
    days_custom: list[ComplianceAlertItem] = Field(default_factory=list, description="Expiring within specified days")
    
    @property
    def total_alerts(self) -> int:
        """Total number of alerts."""
        return len(self.expired) + len(self.days_7) + len(self.days_30) + len(self.days_custom)


# Onboarding Token Schemas

class OnboardingTokenCreate(BaseModel):
    """Schema for creating an onboarding invite."""
    
    employee_id: str = Field(..., description="Employee ID to create invite for")
    expires_in_days: int = Field(default=7, description="Days until token expires")


class OnboardingTokenResponse(BaseModel):
    """Schema for onboarding token response."""
    
    token: str
    employee_id: str
    employee_name: str
    expires_at: datetime
    onboarding_url: str
    is_used: bool = False

    model_config = ConfigDict(from_attributes=True)


class OnboardingValidation(BaseModel):
    """Schema for token validation response."""
    
    valid: bool
    employee_id: Optional[str] = None
    employee_name: Optional[str] = None
    message: str


class OnboardingWelcome(BaseModel):
    """Schema for onboarding welcome data (shown to new joiner)."""
    
    employee_id: str
    name: str
    email: Optional[str] = None
    department: Optional[str] = None
    job_title: Optional[str] = None
    joining_date: Optional[date] = None
    line_manager_name: Optional[str] = None
    location: Optional[str] = None
