"""Backfill masterfile FK data from legacy string columns

Revision ID: 20260108_0015
Revises: 20260108_0014
Create Date: 2026-01-08

Populates the new FK columns from legacy string references where matches exist:
- Pass.linked_employee_id from Pass.employee_id (matching employees.employee_id)
- Pass.created_by_employee_id from Pass.created_by (matching employees.employee_id)
- RecruitmentRequest.hiring_manager_employee_id from hiring_manager_id
- RecruitmentRequest.requested_by_employee_id from requested_by
- Candidate.pass_id from pass_number (matching passes.pass_number)
"""
from alembic import op
import sqlalchemy as sa

revision = '20260108_0015'
down_revision = '20260108_0014'
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    
    bind.execute(sa.text("""
        UPDATE passes p
        SET linked_employee_id = e.id
        FROM employees e
        WHERE p.employee_id = e.employee_id
        AND p.linked_employee_id IS NULL
        AND p.employee_id IS NOT NULL
    """))
    
    bind.execute(sa.text("""
        UPDATE passes p
        SET created_by_employee_id = e.id
        FROM employees e
        WHERE p.created_by = e.employee_id
        AND p.created_by_employee_id IS NULL
    """))
    
    bind.execute(sa.text("""
        UPDATE recruitment_requests rr
        SET hiring_manager_employee_id = e.id
        FROM employees e
        WHERE rr.hiring_manager_id = e.employee_id
        AND rr.hiring_manager_employee_id IS NULL
        AND rr.hiring_manager_id IS NOT NULL
    """))
    
    bind.execute(sa.text("""
        UPDATE recruitment_requests rr
        SET requested_by_employee_id = e.id
        FROM employees e
        WHERE rr.requested_by = e.employee_id
        AND rr.requested_by_employee_id IS NULL
    """))
    
    bind.execute(sa.text("""
        UPDATE recruitment_requests rr
        SET manager_pass_id = p.id
        FROM passes p
        WHERE rr.manager_pass_number = p.pass_number
        AND rr.manager_pass_id IS NULL
        AND rr.manager_pass_number IS NOT NULL
    """))
    
    bind.execute(sa.text("""
        UPDATE candidates c
        SET pass_id = p.id
        FROM passes p
        WHERE c.pass_number = p.pass_number
        AND c.pass_id IS NULL
        AND c.pass_number IS NOT NULL
    """))


def downgrade():
    pass
