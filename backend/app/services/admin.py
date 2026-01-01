from typing import Dict, List

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.system_settings import SystemSetting
from app.repositories.system_settings import SystemSettingsRepository
from app.repositories.employees import EmployeeRepository
from app.repositories.renewals import RenewalRepository
from app.schemas.system_settings import (
    AdminDashboard,
    FeaturesByCategory,
    FeatureToggle,
    FeatureToggleUpdate,
)


class AdminService:
    """Service for admin operations and feature management."""

    def __init__(
        self,
        settings_repo: SystemSettingsRepository,
        employee_repo: EmployeeRepository,
        renewal_repo: RenewalRepository,
    ) -> None:
        self._settings = settings_repo
        self._employees = employee_repo
        self._renewals = renewal_repo

    async def get_dashboard(self, session: AsyncSession) -> AdminDashboard:
        """Get admin dashboard overview."""
        # Initialize defaults if needed
        await self._settings.initialize_defaults(session)
        await session.commit()
        
        # Get counts
        employees = await self._employees.list_all(session, active_only=False)
        active_employees = await self._employees.list_all(session, active_only=True)
        renewals = await self._renewals.list_pending(session)
        features_enabled = await self._settings.count_enabled(session)
        features_total = await self._settings.count_total(session)
        
        # Determine system status
        if features_enabled == 0:
            system_status = "setup"
        elif features_enabled < features_total // 2:
            system_status = "partial"
        else:
            system_status = "active"
        
        return AdminDashboard(
            total_employees=len(employees),
            active_employees=len(active_employees),
            pending_renewals=len(renewals) if renewals else 0,
            features_enabled=features_enabled,
            features_total=features_total,
            system_status=system_status,
        )

    async def get_all_features(self, session: AsyncSession) -> List[FeatureToggle]:
        """Get all feature toggles."""
        await self._settings.initialize_defaults(session)
        await session.commit()
        
        settings = await self._settings.list_all(session)
        return [
            FeatureToggle(
                key=s.key,
                description=s.description or "",
                is_enabled=s.is_enabled,
                category=s.category,
            )
            for s in settings
        ]

    async def get_features_by_category(self, session: AsyncSession) -> FeaturesByCategory:
        """Get features grouped by category."""
        await self._settings.initialize_defaults(session)
        await session.commit()
        
        settings = await self._settings.list_all(session)
        
        result = FeaturesByCategory()
        for s in settings:
            toggle = FeatureToggle(
                key=s.key,
                description=s.description or "",
                is_enabled=s.is_enabled,
                category=s.category,
            )
            if s.category == "core":
                result.core.append(toggle)
            elif s.category == "auth":
                result.auth.append(toggle)
            elif s.category == "notifications":
                result.notifications.append(toggle)
            elif s.category == "onboarding":
                result.onboarding.append(toggle)
            elif s.category == "external":
                result.external.append(toggle)
            elif s.category == "workflow":
                result.workflow.append(toggle)
            elif s.category == "reports":
                result.reports.append(toggle)
            elif s.category == "documents":
                result.documents.append(toggle)
        
        return result

    async def update_feature(
        self, session: AsyncSession, key: str, is_enabled: bool
    ) -> FeatureToggle:
        """Update a single feature toggle."""
        setting = await self._settings.get_by_key(session, key)
        if not setting:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Feature '{key}' not found",
            )
        
        await self._settings.update_toggle(session, key, is_enabled)
        await session.commit()
        
        return FeatureToggle(
            key=setting.key,
            description=setting.description or "",
            is_enabled=is_enabled,
            category=setting.category,
        )

    async def update_features_bulk(
        self, session: AsyncSession, updates: List[FeatureToggleUpdate]
    ) -> List[FeatureToggle]:
        """Update multiple feature toggles."""
        results = []
        for update in updates:
            result = await self.update_feature(session, update.key, update.is_enabled)
            results.append(result)
        return results

    async def enter_setup_mode(self, session: AsyncSession) -> Dict[str, int]:
        """Disable all features for system setup."""
        await self._settings.initialize_defaults(session)
        disabled = await self._settings.disable_all(session)
        await session.commit()
        return {"disabled_features": disabled}

    async def enable_core_features(self, session: AsyncSession) -> Dict[str, int]:
        """Enable only core features."""
        await self._settings.initialize_defaults(session)
        enabled = await self._settings.enable_core_only(session)
        await session.commit()
        return {"enabled_features": enabled}

    async def is_feature_enabled(self, session: AsyncSession, key: str) -> bool:
        """Check if a specific feature is enabled."""
        return await self._settings.is_feature_enabled(session, key)


# Singleton instance
admin_service = AdminService(
    SystemSettingsRepository(),
    EmployeeRepository(),
    RenewalRepository(),
)
