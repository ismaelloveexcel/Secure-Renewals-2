from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.models.renewal import Base


class SystemSetting(Base):
    """System settings with feature toggles for admin configuration."""

    __tablename__ = "system_settings"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    key: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    value: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    category: Mapped[str] = mapped_column(String(50), default="general", nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )


# Default feature toggles to be inserted on first run
DEFAULT_FEATURE_TOGGLES = [
    # Core Features
    {
        "key": "feature_renewals",
        "value": "true",
        "description": "Contract Renewals Module - Track and manage employee contract renewals",
        "is_enabled": True,
        "category": "core"
    },
    {
        "key": "feature_employees",
        "value": "true",
        "description": "Employee Management - Add, edit, and manage employee records",
        "is_enabled": True,
        "category": "core"
    },
    {
        "key": "feature_csv_import",
        "value": "true",
        "description": "CSV Bulk Import - Import employees from CSV files",
        "is_enabled": True,
        "category": "core"
    },
    
    # Authentication Features
    {
        "key": "feature_password_change",
        "value": "true",
        "description": "Password Change - Allow employees to change their password",
        "is_enabled": True,
        "category": "auth"
    },
    {
        "key": "feature_password_reset",
        "value": "true",
        "description": "Admin Password Reset - Admin can reset employee passwords to DOB",
        "is_enabled": True,
        "category": "auth"
    },
    {
        "key": "feature_force_password_change",
        "value": "true",
        "description": "Force Password Change - Require password change on first login",
        "is_enabled": True,
        "category": "auth"
    },
    
    # Notification Features (Future)
    {
        "key": "feature_email_notifications",
        "value": "false",
        "description": "Email Notifications - Send automated email reminders for contract expiry",
        "is_enabled": False,
        "category": "notifications"
    },
    {
        "key": "feature_expiry_reminders",
        "value": "false",
        "description": "Expiry Reminders - Automated 30/60/90 day contract expiry alerts",
        "is_enabled": False,
        "category": "notifications"
    },
    
    # Onboarding Features (Future)
    {
        "key": "feature_onboarding",
        "value": "false",
        "description": "Onboarding Module - Manage new employee onboarding checklists",
        "is_enabled": False,
        "category": "onboarding"
    },
    {
        "key": "feature_auto_onboarding",
        "value": "false",
        "description": "Auto-Assign Onboarding - Automatically assign onboarding tasks to new employees",
        "is_enabled": False,
        "category": "onboarding"
    },
    
    # External Users Features (Future)
    {
        "key": "feature_external_users",
        "value": "false",
        "description": "External Users Module - Manage contractors and external personnel",
        "is_enabled": False,
        "category": "external"
    },
    
    # Approval Workflow Features (Future)
    {
        "key": "feature_approval_workflow",
        "value": "false",
        "description": "Approval Workflows - Multi-level approval for renewals and changes",
        "is_enabled": False,
        "category": "workflow"
    },
    
    # Reporting Features (Future)
    {
        "key": "feature_reports",
        "value": "false",
        "description": "Reports Module - Generate and export HR reports",
        "is_enabled": False,
        "category": "reports"
    },
    {
        "key": "feature_auto_reports",
        "value": "false",
        "description": "Auto Reports - Schedule automatic weekly/monthly report generation",
        "is_enabled": False,
        "category": "reports"
    },
    
    # Document Generation (Future)
    {
        "key": "feature_document_generation",
        "value": "false",
        "description": "Document Generation - Auto-generate offer letters, contracts, etc.",
        "is_enabled": False,
        "category": "documents"
    },
    
    # Pass Generation
    {
        "key": "feature_passes",
        "value": "true",
        "description": "Pass Generation - Generate recruitment, onboarding, visitor passes",
        "is_enabled": True,
        "category": "passes"
    },
    {
        "key": "feature_recruitment_pass",
        "value": "true",
        "description": "Recruitment Pass - Generate passes for interview candidates",
        "is_enabled": True,
        "category": "passes"
    },
    {
        "key": "feature_onboarding_pass",
        "value": "true",
        "description": "Onboarding Pass - Generate passes for new employees during onboarding",
        "is_enabled": True,
        "category": "passes"
    },
    {
        "key": "feature_visitor_pass",
        "value": "true",
        "description": "Visitor Pass - Generate passes for office visitors",
        "is_enabled": True,
        "category": "passes"
    },
    {
        "key": "feature_contractor_pass",
        "value": "true",
        "description": "Contractor Pass - Generate passes for contractors and external workers",
        "is_enabled": True,
        "category": "passes"
    },
]
