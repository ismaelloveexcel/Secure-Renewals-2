import hashlib
import os
import secrets
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import require_role
from app.database import get_session

router = APIRouter(prefix="/health", tags=["health"])

MAINTENANCE_SECRET = os.environ.get("MAINTENANCE_SECRET", "")
ADMIN_EMPLOYEE_ID = os.environ.get("ADMIN_EMPLOYEE_ID", "BAYN00008")


@router.get("", summary="API healthcheck")
async def healthcheck(role: str = Depends(require_role())):
    return {"status": "ok", "role": role}


@router.post("/fix-production", summary="One-time production data fix")
async def fix_production_data(
    token: str = Query(..., description="Secure maintenance token from environment"),
    session: AsyncSession = Depends(get_session),
):
    """
    One-time endpoint to fix production data issues.
    Requires MAINTENANCE_SECRET environment variable.
    """
    if not MAINTENANCE_SECRET:
        raise HTTPException(status_code=503, detail="Maintenance endpoint not configured")
    
    if not secrets.compare_digest(token, MAINTENANCE_SECRET):
        raise HTTPException(status_code=403, detail="Invalid maintenance token")
    
    results = {"employment_status": {}, "admin": {}}
    
    # 1. Check current employment_status values
    check_result = await session.execute(
        text("SELECT DISTINCT employment_status, COUNT(*) as cnt FROM employees GROUP BY employment_status ORDER BY cnt DESC")
    )
    results["employment_status"]["before"] = {row[0]: row[1] for row in check_result.fetchall()}
    
    # 2. Normalize employment_status to 'Active'
    update_result = await session.execute(
        text("""
            UPDATE employees 
            SET employment_status = 'Active' 
            WHERE LOWER(TRIM(COALESCE(employment_status, ''))) = 'active' 
            AND (employment_status IS NULL OR employment_status != 'Active')
        """)
    )
    results["employment_status"]["normalized"] = update_result.rowcount if hasattr(update_result, 'rowcount') else 0
    
    # 2.5. Check if is_active column exists and set it for all active employees
    has_is_active = False
    try:
        is_active_check = await session.execute(
            text("""
                SELECT column_name FROM information_schema.columns 
                WHERE table_name = 'employees' AND column_name = 'is_active'
            """)
        )
        has_is_active = is_active_check.fetchone() is not None
        results["schema"] = {"has_is_active_column": has_is_active}
        
        if has_is_active:
            # Ensure is_active matches employment_status for Active employees
            is_active_fix = await session.execute(
                text("""
                    UPDATE employees 
                    SET is_active = true 
                    WHERE LOWER(TRIM(COALESCE(employment_status, ''))) = 'active'
                    AND (is_active IS NULL OR is_active = false)
                """)
            )
            results["schema"]["is_active_fixed"] = is_active_fix.rowcount if hasattr(is_active_fix, 'rowcount') else 0
    except Exception as e:
        results["schema"] = {"error": str(e)}
    
    # 3. Check admin user
    admin_check = await session.execute(
        text("SELECT id, name, role, password_hash FROM employees WHERE employee_id = :emp_id"),
        {"emp_id": ADMIN_EMPLOYEE_ID}
    )
    admin_row = admin_check.fetchone()
    
    if admin_row:
        results["admin"]["found"] = True
        results["admin"]["name"] = admin_row[1]
        results["admin"]["current_role"] = admin_row[2]
        results["admin"]["employee_id"] = ADMIN_EMPLOYEE_ID
        results["admin"]["expected_password"] = "16051988"
        
        # Check if password works
        current_hash = admin_row[3]
        results["admin"]["has_password_hash"] = current_hash is not None
        results["admin"]["hash_format_valid"] = False
        password_works = False
        
        if current_hash:
            results["admin"]["hash_length"] = len(current_hash)
            try:
                parts = current_hash.split(':')
                results["admin"]["hash_parts"] = len(parts)
                if len(parts) == 2:
                    results["admin"]["hash_format_valid"] = True
                    salt, stored_key = parts
                    key = hashlib.pbkdf2_hmac('sha256', "16051988".encode(), salt.encode(), 100000)
                    password_works = (key.hex() == stored_key)
            except Exception as e:
                results["admin"]["hash_error"] = str(e)
        
        results["admin"]["password_valid"] = password_works
        
        # ALWAYS fix admin password to ensure it works
        # Generate new password hash for DOB password
        salt = secrets.token_hex(16)
        key = hashlib.pbkdf2_hmac('sha256', "16051988".encode(), salt.encode(), 100000)
        new_hash = f"{salt}:{key.hex()}"
        
        await session.execute(
            text("""
                UPDATE employees 
                SET password_hash = :hash, password_changed = false, role = 'admin'
                WHERE employee_id = :emp_id
            """),
            {"hash": new_hash, "emp_id": ADMIN_EMPLOYEE_ID}
        )
        results["admin"]["fixed"] = True
        results["admin"]["new_password"] = "16051988"
        
        # Also ensure admin is_active if column exists
        if has_is_active:
            await session.execute(
                text("UPDATE employees SET is_active = true WHERE employee_id = :emp_id"),
                {"emp_id": ADMIN_EMPLOYEE_ID}
            )
            results["admin"]["is_active_set"] = True
    else:
        results["admin"]["found"] = False
        results["admin"]["error"] = f"Employee {ADMIN_EMPLOYEE_ID} not found in database"
        # List available employees for debugging
        all_emp = await session.execute(text("SELECT employee_id, name FROM employees LIMIT 5"))
        results["admin"]["sample_employees"] = [{"id": r[0], "name": r[1]} for r in all_emp.fetchall()]
    
    await session.commit()
    
    # 4. Verify managers now show (safely handle missing columns)
    try:
        # Check if the newer columns exist before querying them
        column_check = await session.execute(
            text("""
                SELECT column_name FROM information_schema.columns 
                WHERE table_name = 'employees' 
                AND column_name IN ('line_manager_id', 'is_active', 'function')
            """)
        )
        existing_columns = {row[0] for row in column_check.fetchall()}
        
        if {'line_manager_id', 'is_active', 'function'}.issubset(existing_columns):
            manager_check = await session.execute(
                text("""
                    SELECT COUNT(DISTINCT e.line_manager_id) 
                    FROM employees e 
                    WHERE e.line_manager_id IS NOT NULL 
                    AND e.is_active = true 
                    AND LOWER(TRIM(e.employment_status)) = 'active'
                    AND LOWER(TRIM(e.function)) IN ('officer', 'coordinator', 'skilled labour', 'non skilled labour')
                """)
            )
            results["managers_with_eligible_reports"] = manager_check.scalar() or 0
        else:
            results["managers_with_eligible_reports"] = "skipped - schema not fully migrated"
            results["missing_columns"] = list({'line_manager_id', 'is_active', 'function'} - existing_columns)
    except Exception as e:
        results["managers_with_eligible_reports"] = f"skipped - {str(e)}"
    
    return {"success": True, "fixes_applied": results}
