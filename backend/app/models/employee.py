from datetime import date, datetime
from decimal import Decimal
from typing import Optional, TYPE_CHECKING

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.renewal import Base

if TYPE_CHECKING:
    from app.models.employee_profile import EmployeeProfile
    from app.models.onboarding_token import OnboardingToken


class Employee(Base):
    """Employee model for authentication and management.
    
    Contains HR-managed fields that are set during onboarding and managed by HR.
    Employee self-service fields are in the EmployeeProfile model.
    """

    __tablename__ = "employees"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    employee_id: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    department: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    date_of_birth: Mapped[date] = mapped_column(Date, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    password_changed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    role: Mapped[str] = mapped_column(String(20), default="viewer", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    
    # Job information
    job_title: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    function: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    work_schedule: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    
    # Personal information
    gender: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    nationality: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    company_phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    
    # Line manager (self-referential)
    line_manager_id: Mapped[Optional[int]] = mapped_column(ForeignKey("employees.id"), nullable=True)
    line_manager_name: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    line_manager_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    # Employment dates
    joining_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    last_promotion_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    last_increment_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    
    # Probation tracking
    probation_start_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    probation_end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    one_month_eval_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    three_month_eval_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    six_month_eval_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    probation_status: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    
    # Employment status
    employment_status: Mapped[Optional[str]] = mapped_column(String(50), default="Active", nullable=True)
    years_of_service: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Leave and overtime
    annual_leave_entitlement: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    overtime_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    
    # Compliance
    security_clearance: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    visa_status: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    
    # UAE Compliance - Visa tracking (detailed)
    visa_number: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    visa_issue_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    visa_expiry_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    
    # UAE Compliance - Emirates ID
    emirates_id_number: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    emirates_id_expiry: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    
    # UAE Compliance - Medical Fitness
    medical_fitness_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    medical_fitness_expiry: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    
    # UAE Compliance - ILOE (Insurance)
    iloe_status: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    iloe_expiry: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    
    # UAE Compliance - Contract
    contract_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    contract_start_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    contract_end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    
    # Medical insurance
    medical_insurance_provider: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    medical_insurance_category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    # Compensation (sensitive - HR only)
    basic_salary: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True)
    housing_allowance: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True)
    transportation_allowance: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True)
    air_ticket_entitlement: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True)
    other_allowance: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True)
    consultancy_fees: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True)
    air_fare_allowance: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True)
    family_air_ticket_allowance: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True)
    net_salary: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True)
    
    # Profile completion status
    profile_status: Mapped[str] = mapped_column(String(30), default="incomplete", nullable=False)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
    last_login: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    profile: Mapped[Optional["EmployeeProfile"]] = relationship(
        back_populates="employee", uselist=False, cascade="all, delete-orphan"
    )
    onboarding_tokens: Mapped[list["OnboardingToken"]] = relationship(
        back_populates="employee", cascade="all, delete-orphan"
    )
    line_manager: Mapped[Optional["Employee"]] = relationship(
        "Employee", remote_side=[id], foreign_keys=[line_manager_id]
    )
    renewals: Mapped[list["Renewal"]] = relationship(
        "Renewal", back_populates="employee", cascade="all, delete-orphan"
    )
