from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import require_role
from app.database import get_session
from app.schemas.system_settings import (
    AdminDashboard,
    FeaturesByCategory,
    FeatureToggle,
    FeatureToggleBulkUpdate,
    FeatureToggleUpdate,
)
from app.services.admin import admin_service

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get(
    "/dashboard",
    response_model=AdminDashboard,
    summary="Get admin dashboard overview",
)
async def get_dashboard(
    role: str = Depends(require_role(["admin"])),
    session: AsyncSession = Depends(get_session),
):
    """
    Get admin dashboard with system overview.
    
    Shows:
    - Employee counts (total, active)
    - Pending renewals
    - Feature toggle counts
    - System status (setup, partial, active)
    
    **Admin only.**
    """
    return await admin_service.get_dashboard(session)


@router.get(
    "/features",
    response_model=List[FeatureToggle],
    summary="List all feature toggles",
)
async def list_features(
    role: str = Depends(require_role(["admin"])),
    session: AsyncSession = Depends(get_session),
):
    """
    List all feature toggles with their current state.
    
    **Admin only.**
    """
    return await admin_service.get_all_features(session)


@router.get(
    "/features/by-category",
    response_model=FeaturesByCategory,
    summary="Get features grouped by category",
)
async def get_features_by_category(
    role: str = Depends(require_role(["admin"])),
    session: AsyncSession = Depends(get_session),
):
    """
    Get all feature toggles grouped by category.
    
    Categories:
    - core: Essential system features
    - auth: Authentication features
    - notifications: Email and alert features
    - onboarding: New employee onboarding
    - external: External users management
    - workflow: Approval workflows
    - reports: Reporting features
    - documents: Document generation
    
    **Admin only.**
    """
    return await admin_service.get_features_by_category(session)


@router.put(
    "/features/{key}",
    response_model=FeatureToggle,
    summary="Toggle a feature on/off",
)
async def update_feature(
    key: str,
    is_enabled: bool,
    role: str = Depends(require_role(["admin"])),
    session: AsyncSession = Depends(get_session),
):
    """
    Enable or disable a specific feature.
    
    **Admin only.**
    """
    return await admin_service.update_feature(session, key, is_enabled)


@router.put(
    "/features",
    response_model=List[FeatureToggle],
    summary="Bulk update feature toggles",
)
async def update_features_bulk(
    updates: FeatureToggleBulkUpdate,
    role: str = Depends(require_role(["admin"])),
    session: AsyncSession = Depends(get_session),
):
    """
    Update multiple feature toggles at once.
    
    **Admin only.**
    """
    return await admin_service.update_features_bulk(session, updates.toggles)


@router.post(
    "/setup-mode",
    summary="Enter setup mode (disable all features)",
)
async def enter_setup_mode(
    role: str = Depends(require_role(["admin"])),
    session: AsyncSession = Depends(get_session),
):
    """
    Enter setup mode by disabling all features.
    
    Use this when setting up the system for the first time.
    Admin can then enable features one by one as needed.
    
    **Admin only.**
    """
    result = await admin_service.enter_setup_mode(session)
    return {
        "success": True,
        "message": "System is now in setup mode. All features disabled.",
        **result,
    }


@router.post(
    "/enable-core",
    summary="Enable only core features",
)
async def enable_core_features(
    role: str = Depends(require_role(["admin"])),
    session: AsyncSession = Depends(get_session),
):
    """
    Enable only core features (renewals, employees, CSV import).
    
    Disables all other features. Use this for a minimal setup.
    
    **Admin only.**
    """
    result = await admin_service.enable_core_features(session)
    return {
        "success": True,
        "message": "Core features enabled. Other features disabled.",
        **result,
    }


@router.get(
    "/features/{key}/status",
    summary="Check if a feature is enabled",
)
async def check_feature_status(
    key: str,
    role: str = Depends(require_role(["admin", "hr"])),
    session: AsyncSession = Depends(get_session),
):
    """
    Check if a specific feature is enabled.
    
    **Admin and HR.**
    """
    is_enabled = await admin_service.is_feature_enabled(session, key)
    return {"key": key, "is_enabled": is_enabled}
