"""initial tables

Revision ID: 20241001_0001
Revises: 
Create Date: 2024-10-01 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "20241001_0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "renewals",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("employee_name", sa.String(length=120), nullable=False),
        sa.Column("contract_end_date", sa.Date(), nullable=False),
        sa.Column("renewal_period_months", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("created_by_role", sa.String(length=20), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            server_onupdate=sa.func.now(),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_renewals_id"), "renewals", ["id"], unique=False)

    op.create_table(
        "renewal_audit_log",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("renewal_id", sa.Integer(), nullable=False),
        sa.Column("action", sa.String(length=50), nullable=False),
        sa.Column("performed_by_role", sa.String(length=20), nullable=False),
        sa.Column("performed_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("snapshot", sa.JSON(), nullable=False),
        sa.ForeignKeyConstraint(["renewal_id"], ["renewals.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_renewal_audit_log_id"), "renewal_audit_log", ["id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_renewal_audit_log_id"), table_name="renewal_audit_log")
    op.drop_table("renewal_audit_log")
    op.drop_index(op.f("ix_renewals_id"), table_name="renewals")
    op.drop_table("renewals")
