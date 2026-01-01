from typing import List, Optional, Sequence

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.system_settings import SystemSetting, DEFAULT_FEATURE_TOGGLES


class SystemSettingsRepository:
    """Repository for system settings database operations."""

    async def get_by_key(self, session: AsyncSession, key: str) -> Optional[SystemSetting]:
        """Get a setting by key."""
        result = await session.execute(
            select(SystemSetting).where(SystemSetting.key == key)
        )
        return result.scalar_one_or_none()

    async def list_all(self, session: AsyncSession) -> Sequence[SystemSetting]:
        """List all settings."""
        result = await session.execute(
            select(SystemSetting).order_by(SystemSetting.category, SystemSetting.key)
        )
        return result.scalars().all()

    async def list_by_category(self, session: AsyncSession, category: str) -> Sequence[SystemSetting]:
        """List settings by category."""
        result = await session.execute(
            select(SystemSetting)
            .where(SystemSetting.category == category)
            .order_by(SystemSetting.key)
        )
        return result.scalars().all()

    async def update_toggle(
        self, session: AsyncSession, key: str, is_enabled: bool
    ) -> bool:
        """Update a feature toggle."""
        result = await session.execute(
            update(SystemSetting)
            .where(SystemSetting.key == key)
            .values(is_enabled=is_enabled, value=str(is_enabled).lower())
        )
        return result.rowcount > 0

    async def is_feature_enabled(self, session: AsyncSession, key: str) -> bool:
        """Check if a feature is enabled."""
        setting = await self.get_by_key(session, key)
        return setting.is_enabled if setting else False

    async def count_enabled(self, session: AsyncSession) -> int:
        """Count enabled features."""
        result = await session.execute(
            select(SystemSetting).where(SystemSetting.is_enabled.is_(True))
        )
        return len(result.scalars().all())

    async def count_total(self, session: AsyncSession) -> int:
        """Count total features."""
        result = await session.execute(select(SystemSetting))
        return len(result.scalars().all())

    async def initialize_defaults(self, session: AsyncSession) -> int:
        """Initialize default feature toggles if not exists."""
        created = 0
        for toggle in DEFAULT_FEATURE_TOGGLES:
            existing = await self.get_by_key(session, toggle["key"])
            if not existing:
                setting = SystemSetting(
                    key=toggle["key"],
                    value=toggle["value"],
                    description=toggle["description"],
                    is_enabled=toggle["is_enabled"],
                    category=toggle["category"],
                )
                session.add(setting)
                created += 1
        
        if created > 0:
            await session.flush()
        
        return created

    async def disable_all(self, session: AsyncSession) -> int:
        """Disable all feature toggles (for system setup mode)."""
        result = await session.execute(
            update(SystemSetting).values(is_enabled=False, value="false")
        )
        return result.rowcount

    async def enable_core_only(self, session: AsyncSession) -> int:
        """Enable only core features."""
        # First disable all
        await session.execute(
            update(SystemSetting).values(is_enabled=False, value="false")
        )
        # Then enable core
        result = await session.execute(
            update(SystemSetting)
            .where(SystemSetting.category == "core")
            .values(is_enabled=True, value="true")
        )
        return result.rowcount
