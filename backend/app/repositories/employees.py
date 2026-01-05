from datetime import date, datetime, timezone
from typing import Optional, Sequence

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.employee import Employee


class EmployeeRepository:
    """Repository for employee database operations."""

    async def get_by_employee_id(self, session: AsyncSession, employee_id: str) -> Optional[Employee]:
        """Get employee by their employee ID."""
        result = await session.execute(
            select(Employee).where(Employee.employee_id == employee_id)
        )
        return result.scalar_one_or_none()

    async def get_by_id(self, session: AsyncSession, id: int) -> Optional[Employee]:
        """Get employee by internal ID."""
        result = await session.execute(select(Employee).where(Employee.id == id))
        return result.scalar_one_or_none()

    async def list_all(self, session: AsyncSession, active_only: bool = True) -> Sequence[Employee]:
        """List all employees with renewals eagerly loaded."""
        from sqlalchemy.orm import selectinload
        query = select(Employee).options(selectinload(Employee.renewals)).order_by(Employee.name)
        if active_only:
            query = query.where(Employee.is_active.is_(True))
        result = await session.execute(query)
        return result.scalars().all()

    async def create(
        self,
        session: AsyncSession,
        *,
        employee_id: str,
        name: str,
        date_of_birth: date,
        password_hash: str,
        email: Optional[str] = None,
        department: Optional[str] = None,
        role: str = "viewer",
    ) -> Employee:
        """Create a new employee."""
        employee = Employee(
            employee_id=employee_id,
            name=name,
            date_of_birth=date_of_birth,
            password_hash=password_hash,
            email=email,
            department=department,
            role=role,
            password_changed=False,
            is_active=True,
        )
        session.add(employee)
        await session.flush()
        await session.refresh(employee)
        return employee

    async def update_password(
        self, session: AsyncSession, employee_id: str, new_password_hash: str
    ) -> bool:
        """Update employee password and mark as changed."""
        result = await session.execute(
            update(Employee)
            .where(Employee.employee_id == employee_id)
            .values(password_hash=new_password_hash, password_changed=True)
        )
        return result.rowcount > 0

    async def reset_password_to_dob(
        self, session: AsyncSession, employee_id: str, dob_password_hash: str
    ) -> bool:
        """Reset password to DOB (admin function)."""
        result = await session.execute(
            update(Employee)
            .where(Employee.employee_id == employee_id)
            .values(password_hash=dob_password_hash, password_changed=False)
        )
        return result.rowcount > 0

    async def update_last_login(self, session: AsyncSession, employee_id: str) -> None:
        """Update last login timestamp."""
        await session.execute(
            update(Employee)
            .where(Employee.employee_id == employee_id)
            .values(last_login=datetime.now(timezone.utc))
        )

    async def deactivate(self, session: AsyncSession, employee_id: str) -> bool:
        """Deactivate an employee."""
        result = await session.execute(
            update(Employee)
            .where(Employee.employee_id == employee_id)
            .values(is_active=False)
        )
        return result.rowcount > 0

    async def exists(self, session: AsyncSession, employee_id: str) -> bool:
        """Check if employee exists."""
        result = await session.execute(
            select(Employee.id).where(Employee.employee_id == employee_id)
        )
        return result.scalar_one_or_none() is not None

    async def update(
        self, session: AsyncSession, employee_id: str, data: dict
    ) -> Optional[Employee]:
        """Update employee with provided data."""
        employee = await self.get_by_employee_id(session, employee_id)
        if not employee:
            return None
        
        for field, value in data.items():
            if hasattr(employee, field):
                setattr(employee, field, value)
        
        await session.flush()
        await session.refresh(employee)
        return employee

    async def get_all_active_for_compliance(
        self, session: AsyncSession
    ) -> Sequence[Employee]:
        """Get all active employees for compliance checking."""
        result = await session.execute(
            select(Employee)
            .where(Employee.is_active.is_(True))
            .order_by(Employee.name)
        )
        return result.scalars().all()
