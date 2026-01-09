"""Fix production data: normalize employment_status and ensure admin access

Revision ID: 0019_fix_prod_data
Revises: 20260108_0018_add_nominator_unique_constraint
Create Date: 2026-01-09
"""
from alembic import op
import sqlalchemy as sa
import hashlib
import secrets

revision = '20260109_0019'
down_revision = '20260108_0018'
branch_labels = None
depends_on = None


def generate_password_hash(password: str) -> str:
    """Generate password hash using PBKDF2."""
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100000)
    return f"{salt}:{key.hex()}"


def upgrade() -> None:
    conn = op.get_bind()
    
    # 1. Normalize employment_status to 'Active' (case-insensitive fix)
    conn.execute(sa.text("""
        UPDATE employees 
        SET employment_status = 'Active'
        WHERE LOWER(TRIM(employment_status)) = 'active'
        AND employment_status != 'Active'
    """))
    
    # 2. Ensure BAYN00008 has admin role
    conn.execute(sa.text("""
        UPDATE employees 
        SET role = 'admin'
        WHERE employee_id = 'BAYN00008'
        AND (role IS NULL OR role != 'admin')
    """))
    
    # 3. Reset BAYN00008 password to DOB format (16051988)
    # Generate the hash for the DOB password
    dob_password = "16051988"
    password_hash = generate_password_hash(dob_password)
    
    conn.execute(sa.text("""
        UPDATE employees 
        SET password_hash = :hash,
            password_changed = false
        WHERE employee_id = 'BAYN00008'
    """), {"hash": password_hash})


def downgrade() -> None:
    pass
