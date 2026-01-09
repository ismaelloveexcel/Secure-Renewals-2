"""
Startup migrations to ensure production data consistency.
These run once when the application starts.
"""
import hashlib
import json
import logging
import os
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

ADMIN_EMPLOYEE_ID = "BAYN00008"
ADMIN_PASSWORD_HASH = "3543bc93f69b085852270bb3edfac94a:7e8f4f92a9b90a1260bc005304f5b30f014dd4603056cacb0b6170d05049b832"


async def run_startup_migrations(session: AsyncSession):
    """Run all startup migrations to ensure data consistency."""
    try:
        await seed_empty_database(session)
        await normalize_employment_status(session)
        await ensure_admin_access(session)
        await backfill_line_manager_ids(session)
        await seed_nomination_settings(session)
        await session.commit()
        logger.info("Startup migrations completed successfully")
    except Exception as e:
        logger.error(f"Startup migration error: {e}")
        await session.rollback()
        raise


async def seed_empty_database(session: AsyncSession):
    """Seed the database with initial employee data if it's empty."""
    result = await session.execute(text("SELECT COUNT(*) FROM employees"))
    count = result.scalar() or 0
    
    if count > 0:
        logger.info(f"Database has {count} employees, skipping seed")
        return
    
    logger.info("Database is empty, seeding with initial employee data...")
    
    seed_file = os.path.join(os.path.dirname(__file__), 'seed_employees.json')
    if not os.path.exists(seed_file):
        logger.warning(f"Seed file not found: {seed_file}")
        return
    
    with open(seed_file, 'r') as f:
        employees = json.load(f)
    
    for emp in employees:
        await session.execute(
            text("""
                INSERT INTO employees (
                    id, employee_id, name, email, department, date_of_birth,
                    password_hash, password_changed, role, is_active, job_title,
                    line_manager_name, line_manager_email, line_manager_id,
                    employment_status, location, nationality, gender, function
                ) VALUES (
                    :id, :employee_id, :name, :email, :department, :date_of_birth,
                    :password_hash, :password_changed, :role, :is_active, :job_title,
                    :line_manager_name, :line_manager_email, :line_manager_id,
                    :employment_status, :location, :nationality, :gender, :function
                ) ON CONFLICT (id) DO NOTHING
            """),
            {
                'id': emp['id'],
                'employee_id': emp['employee_id'],
                'name': emp['name'],
                'email': emp.get('email'),
                'department': emp.get('department'),
                'date_of_birth': emp.get('date_of_birth'),
                'password_hash': emp['password_hash'],
                'password_changed': emp.get('password_changed', False),
                'role': emp.get('role', 'viewer'),
                'is_active': emp.get('is_active', True),
                'job_title': emp.get('job_title'),
                'line_manager_name': emp.get('line_manager_name'),
                'line_manager_email': emp.get('line_manager_email'),
                'line_manager_id': emp.get('line_manager_id'),
                'employment_status': emp.get('employment_status', 'Active'),
                'location': emp.get('location'),
                'nationality': emp.get('nationality'),
                'gender': emp.get('gender'),
                'function': emp.get('function')
            }
        )
    
    max_id = max(emp['id'] for emp in employees)
    await session.execute(
        text(f"SELECT setval('employees_id_seq', {max_id}, true)")
    )
    
    logger.info(f"Seeded {len(employees)} employees into the database")


async def seed_nomination_settings(session: AsyncSession):
    """Seed default nomination settings if not present."""
    result = await session.execute(text("SELECT COUNT(*) FROM nomination_settings WHERE year = 2026"))
    count = result.scalar() or 0
    
    if count > 0:
        return
    
    logger.info("Seeding nomination settings for 2026...")
    await session.execute(
        text("""
            INSERT INTO nomination_settings (
                year, is_open, start_date, end_date,
                invitation_email_subject, invitation_email_body, emails_sent_count
            ) VALUES (
                2026, true, NOW(), NOW() + INTERVAL '30 days',
                'Employee of the Year 2026 - Submit Your Nomination',
                'Dear Manager,

You are invited to nominate an outstanding team member for the Employee of the Year 2026 award.

Please click the link below to access the nomination portal and submit your nomination.

Important notes:
- Each manager may submit one nomination per year.
- The nomination period will close on the deadline specified in the portal.

Best regards,
HR Team',
                0
            ) ON CONFLICT (year) DO NOTHING
        """)
    )
    logger.info("Seeded nomination settings for 2026")


async def normalize_employment_status(session: AsyncSession):
    """Normalize employment_status values to proper 'Active' casing."""
    # First, check what values exist in production
    check_result = await session.execute(
        text("SELECT DISTINCT employment_status, COUNT(*) FROM employees GROUP BY employment_status")
    )
    rows = check_result.fetchall()
    for row in rows:
        logger.info(f"Production employment_status: '{row[0]}' = {row[1]} records")
    
    # Normalize any variation of 'active' to 'Active'
    result = await session.execute(
        text("""
            UPDATE employees 
            SET employment_status = 'Active' 
            WHERE LOWER(TRIM(COALESCE(employment_status, ''))) = 'active' 
            AND (employment_status IS NULL OR employment_status != 'Active')
        """)
    )
    row_count = result.rowcount if hasattr(result, 'rowcount') else 0
    if row_count and row_count > 0:
        logger.info(f"Normalized {row_count} employment_status values to 'Active'")


async def ensure_admin_access(session: AsyncSession):
    """Ensure admin user has admin role and working password."""
    import hashlib
    
    # First check if admin exists
    check_result = await session.execute(
        text("""
            SELECT id, password_hash, role, password_changed, name
            FROM employees 
            WHERE employee_id = :emp_id
        """),
        {"emp_id": ADMIN_EMPLOYEE_ID}
    )
    row = check_result.fetchone()
    
    if not row:
        logger.error(f"CRITICAL: Admin employee {ADMIN_EMPLOYEE_ID} NOT FOUND in production database!")
        # List all employees to debug
        all_emp = await session.execute(text("SELECT employee_id, name FROM employees LIMIT 10"))
        for emp in all_emp.fetchall():
            logger.info(f"  Found employee: {emp[0]} - {emp[1]}")
        return
    
    emp_id, current_hash, current_role, password_changed, name = row
    logger.info(f"Found admin: {name} (id={emp_id}, role={current_role}, password_changed={password_changed})")
    logger.info(f"Current hash prefix: {current_hash[:50] if current_hash else 'NULL'}...")
    
    # Always ensure admin role
    if current_role != 'admin':
        await session.execute(
            text("UPDATE employees SET role = 'admin' WHERE employee_id = :emp_id"),
            {"emp_id": ADMIN_EMPLOYEE_ID}
        )
        logger.info(f"Set admin role for {ADMIN_EMPLOYEE_ID}")
    
    # Check if current password works
    dob_password = "16051988"
    password_works = False
    
    if current_hash:
        try:
            parts = current_hash.split(':')
            if len(parts) == 2:
                salt, stored_key = parts
                key = hashlib.pbkdf2_hmac('sha256', dob_password.encode(), salt.encode(), 100000)
                password_works = (key.hex() == stored_key)
                logger.info(f"Password verification result: {password_works}")
        except Exception as e:
            logger.error(f"Password verification error: {e}")
    
    # ALWAYS reset password in this migration to ensure it works
    if not password_works:
        await session.execute(
            text("""
                UPDATE employees 
                SET password_hash = :hash,
                    password_changed = false,
                    role = 'admin'
                WHERE employee_id = :emp_id
            """),
            {"hash": ADMIN_PASSWORD_HASH, "emp_id": ADMIN_EMPLOYEE_ID}
        )
        logger.info(f"Reset password and role for {ADMIN_EMPLOYEE_ID}")
    else:
        logger.info(f"Admin {ADMIN_EMPLOYEE_ID} password already valid")


async def backfill_line_manager_ids(session: AsyncSession):
    """Backfill line_manager_id from line_manager_name for nominations system."""
    # Check how many employees have line_manager_name but no line_manager_id
    check_result = await session.execute(
        text("""
            SELECT COUNT(*) FROM employees 
            WHERE line_manager_name IS NOT NULL 
            AND line_manager_name != ''
            AND line_manager_id IS NULL
        """)
    )
    missing_count = check_result.scalar() or 0
    
    if missing_count == 0:
        logger.info("All line_manager_id fields already populated")
        return
    
    logger.info(f"Found {missing_count} employees with line_manager_name but no line_manager_id")
    
    # Backfill line_manager_id by matching line_manager_name to employee names
    result = await session.execute(
        text("""
            UPDATE employees e
            SET line_manager_id = m.id
            FROM employees m
            WHERE e.line_manager_name IS NOT NULL 
            AND e.line_manager_name != ''
            AND e.line_manager_id IS NULL
            AND LOWER(TRIM(e.line_manager_name)) = LOWER(TRIM(m.name))
        """)
    )
    exact_matches = result.rowcount if hasattr(result, 'rowcount') else 0
    logger.info(f"Backfilled {exact_matches} line_manager_id values (exact name match)")
    
    # Also try matching with normalized whitespace
    result2 = await session.execute(
        text("""
            UPDATE employees e
            SET line_manager_id = m.id
            FROM employees m
            WHERE e.line_manager_name IS NOT NULL 
            AND e.line_manager_name != ''
            AND e.line_manager_id IS NULL
            AND LOWER(regexp_replace(e.line_manager_name, '\\s+', ' ', 'g')) = 
                LOWER(regexp_replace(m.name, '\\s+', ' ', 'g'))
        """)
    )
    fuzzy_matches = result2.rowcount if hasattr(result2, 'rowcount') else 0
    if fuzzy_matches > 0:
        logger.info(f"Backfilled {fuzzy_matches} more line_manager_id values (whitespace normalized)")
    
    # Ensure is_active matches employment_status
    is_active_result = await session.execute(
        text("""
            UPDATE employees 
            SET is_active = true 
            WHERE LOWER(TRIM(COALESCE(employment_status, ''))) = 'active'
            AND (is_active IS NULL OR is_active = false)
        """)
    )
    is_active_fixed = is_active_result.rowcount if hasattr(is_active_result, 'rowcount') else 0
    if is_active_fixed > 0:
        logger.info(f"Fixed {is_active_fixed} is_active flags to match employment_status")
