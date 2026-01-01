"""add passes table

Revision ID: 20241231_0004
Revises: 20241231_0003
Create Date: 2024-12-31 02:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "20241231_0004"
down_revision: Union[str, None] = "20241231_0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "passes",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("pass_number", sa.String(length=50), nullable=False),
        sa.Column("pass_type", sa.String(length=50), nullable=False),
        sa.Column("full_name", sa.String(length=120), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("phone", sa.String(length=50), nullable=True),
        sa.Column("department", sa.String(length=100), nullable=True),
        sa.Column("position", sa.String(length=100), nullable=True),
        sa.Column("valid_from", sa.Date(), nullable=False),
        sa.Column("valid_until", sa.Date(), nullable=False),
        sa.Column("access_areas", sa.Text(), nullable=True),
        sa.Column("purpose", sa.Text(), nullable=True),
        sa.Column("sponsor_name", sa.String(length=120), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="active"),
        sa.Column("is_printed", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("employee_id", sa.String(length=50), nullable=True),
        sa.Column("created_by", sa.String(length=50), nullable=False),
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
    op.create_index(op.f("ix_passes_id"), "passes", ["id"], unique=False)
    op.create_index(op.f("ix_passes_pass_number"), "passes", ["pass_number"], unique=True)


def downgrade() -> None:
    op.drop_index(op.f("ix_passes_pass_number"), table_name="passes")
    op.drop_index(op.f("ix_passes_id"), table_name="passes")
    op.drop_table("passes")
