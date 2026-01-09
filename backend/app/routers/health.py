import hashlib
import json
import os
import secrets
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, Query, HTTPException, Body
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import require_role
from app.database import get_session

router = APIRouter(prefix="/health", tags=["health"])

MAINTENANCE_SECRET = os.environ.get("MAINTENANCE_SECRET", "")
ADMIN_EMPLOYEE_ID = os.environ.get("ADMIN_EMPLOYEE_ID", "BAYN00008")
SYSTEM_ADMIN_ID = "ADMIN001"
SYSTEM_ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "admin123")


@router.get("", summary="API healthcheck")
async def healthcheck(role: str = Depends(require_role())):
    return {"status": "ok", "role": role}


@router.get("/list-employees", summary="List employees for diagnostics")
async def list_employees_diagnostic(
    token: str = Query(..., description="Secure maintenance token"),
    session: AsyncSession = Depends(get_session),
):
    """List employees for production diagnostics."""
    if not MAINTENANCE_SECRET:
        raise HTTPException(status_code=503, detail="Maintenance endpoint not configured")
    
    if not secrets.compare_digest(token, MAINTENANCE_SECRET):
        raise HTTPException(status_code=403, detail="Invalid maintenance token")
    
    result = await session.execute(
        text("SELECT employee_id, name, role FROM employees ORDER BY employee_id LIMIT 20")
    )
    employees = [{"employee_id": r[0], "name": r[1], "role": r[2]} for r in result.fetchall()]
    
    count_result = await session.execute(text("SELECT COUNT(*) FROM employees"))
    total = count_result.scalar()
    
    return {"total_employees": total, "sample": employees}


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
    
    # 3.5. Also fix ADMIN001 (System Admin) - used by frontend admin login
    results["system_admin"] = {}
    sys_admin_check = await session.execute(
        text("SELECT id, name, role, password_hash FROM employees WHERE employee_id = :emp_id"),
        {"emp_id": SYSTEM_ADMIN_ID}
    )
    sys_admin_row = sys_admin_check.fetchone()
    
    if sys_admin_row:
        results["system_admin"]["found"] = True
        results["system_admin"]["name"] = sys_admin_row[1]
        results["system_admin"]["employee_id"] = SYSTEM_ADMIN_ID
        
        # Generate new password hash using ADMIN_PASSWORD from env (or default)
        salt = secrets.token_hex(16)
        key = hashlib.pbkdf2_hmac('sha256', SYSTEM_ADMIN_PASSWORD.encode(), salt.encode(), 100000)
        new_hash = f"{salt}:{key.hex()}"
        
        await session.execute(
            text("""
                UPDATE employees 
                SET password_hash = :hash, password_changed = false, role = 'admin'
                WHERE employee_id = :emp_id
            """),
            {"hash": new_hash, "emp_id": SYSTEM_ADMIN_ID}
        )
        results["system_admin"]["fixed"] = True
        results["system_admin"]["password_set_to"] = "value from ADMIN_PASSWORD env var (or 'admin123' if not set)"
        
        # Also ensure is_active if column exists
        if has_is_active:
            await session.execute(
                text("UPDATE employees SET is_active = true WHERE employee_id = :emp_id"),
                {"emp_id": SYSTEM_ADMIN_ID}
            )
            results["system_admin"]["is_active_set"] = True
    else:
        results["system_admin"]["found"] = False
        results["system_admin"]["note"] = "ADMIN001 not found - frontend admin login may not work"
    
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


async def _export_table(session: AsyncSession, table_name: str) -> List[Dict[str, Any]]:
    """Export all rows from a table as a list of dicts."""
    # Get column names
    cols_result = await session.execute(text(
        f"SELECT column_name FROM information_schema.columns WHERE table_name = :table ORDER BY ordinal_position"
    ), {"table": table_name})
    columns = [r[0] for r in cols_result.fetchall()]
    
    # Get all rows
    data_result = await session.execute(text(f"SELECT * FROM {table_name}"))
    rows = []
    for row in data_result.fetchall():
        row_dict = {}
        for i, col in enumerate(columns):
            val = row[i]
            # Convert datetime/date to string for JSON serialization
            if hasattr(val, 'isoformat'):
                val = val.isoformat()
            row_dict[col] = val
        rows.append(row_dict)
    return rows


@router.get("/export-data", summary="Export data for sync to production")
async def export_data(
    token: str = Query(..., description="Secure maintenance token"),
    session: AsyncSession = Depends(get_session),
):
    """
    Export Employees, Recruitment, and Passes data for production sync.
    Returns JSON data that can be imported into production.
    """
    if not MAINTENANCE_SECRET:
        raise HTTPException(status_code=503, detail="Maintenance endpoint not configured")
    
    if not secrets.compare_digest(token, MAINTENANCE_SECRET):
        raise HTTPException(status_code=403, detail="Invalid maintenance token")
    
    export = {
        "employees": await _export_table(session, "employees"),
        "candidates": await _export_table(session, "candidates"),
        "recruitment_requests": await _export_table(session, "recruitment_requests"),
        "passes": await _export_table(session, "passes"),
    }
    
    return {
        "success": True,
        "counts": {k: len(v) for k, v in export.items()},
        "data": export
    }


ALLOWED_COLUMNS = {
    "employees": {"id", "employee_id", "name", "email", "department", "date_of_birth", 
                  "password_hash", "password_changed", "role", "is_active", "job_title", 
                  "function", "location", "work_schedule", "gender", "nationality", 
                  "company_phone", "employment_status", "line_manager_id", "created_at", "updated_at"},
    "candidates": {"id", "candidate_number", "recruitment_request_id", "pass_number", "full_name",
                   "email", "phone", "current_position", "current_company", "years_experience",
                   "expected_salary", "notice_period_days", "source", "source_details", "resume_path",
                   "linkedin_url", "status", "stage", "stage_changed_at", "rejection_reason", "notes",
                   "emirates_id", "visa_status", "created_at", "updated_at", "current_location",
                   "willing_to_relocate", "has_driving_license", "preferred_contact_method", "timezone",
                   "industry_function", "availability_date", "current_salary", "salary_currency",
                   "salary_negotiable", "portfolio_url", "documents", "core_skills", "programming_languages",
                   "hardware_platforms", "protocols_tools", "recruiter_notes", "interview_observations",
                   "risk_flags", "visa_expiry_date", "current_country", "details_confirmed_by_candidate",
                   "details_confirmed_at", "last_updated_by", "entity", "references_list", "soft_skills",
                   "technical_skills", "pass_id", "ai_ranking", "skills_match_score", "education_level",
                   "screening_rank", "cv_scoring", "resume_url", "cv_scored_at", "pass_token",
                   "score_breakdown", "hr_rating", "manager_rating", "last_activity_at"},
    "recruitment_requests": {"id", "request_number", "position_title", "department", "hiring_manager_id",
                              "requested_by", "request_date", "target_hire_date", "headcount", 
                              "employment_type", "job_description", "requirements", "salary_range_min",
                              "salary_range_max", "status", "approval_status", "manager_pass_number",
                              "created_at", "updated_at", "hiring_manager_employee_id", 
                              "requested_by_employee_id", "manager_pass_id", "required_skills", "priority",
                              "expected_start_date", "location", "experience_min", "experience_max",
                              "education_level", "benefits", "reporting_to"},
    "passes": {"id", "pass_number", "pass_type", "full_name", "email", "phone", "department",
               "position", "valid_from", "valid_until", "access_areas", "purpose", "sponsor_name",
               "status", "is_printed", "employee_id", "created_by", "created_at", "updated_at",
               "linked_employee_id", "created_by_employee_id"},
}


async def _import_table(session: AsyncSession, table_name: str, rows: List[Dict[str, Any]], 
                        conflict_column: str = "id") -> Dict[str, Any]:
    """Import rows into a table with upsert logic. Uses allowlist for SQL injection protection."""
    imported = 0
    errors = []
    
    allowed = ALLOWED_COLUMNS.get(table_name, set())
    if not allowed:
        return {"imported": 0, "errors": [f"Unknown table: {table_name}"]}
    
    for row in rows:
        try:
            # Filter to only allowed columns
            safe_row = {k: v for k, v in row.items() if k in allowed}
            if not safe_row:
                continue
            
            columns = list(safe_row.keys())
            col_names = ", ".join(columns)
            placeholders = ", ".join([f":{c}" for c in columns])
            
            # Build update clause (exclude conflict column)
            update_cols = [c for c in columns if c != conflict_column]
            update_clause = ", ".join([f"{c} = EXCLUDED.{c}" for c in update_cols])
            
            sql = f"""
                INSERT INTO {table_name} ({col_names})
                VALUES ({placeholders})
                ON CONFLICT ({conflict_column}) DO UPDATE SET {update_clause}
            """
            await session.execute(text(sql), safe_row)
            imported += 1
        except Exception as e:
            errors.append(f"{table_name} row {row.get(conflict_column, '?')}: {str(e)[:100]}")
    
    return {"imported": imported, "errors": errors}


@router.post("/import-data", summary="Import data from development")
async def import_data(
    token: str = Query(..., description="Secure maintenance token"),
    data: Dict[str, Any] = Body(..., description="Data to import"),
    session: AsyncSession = Depends(get_session),
):
    """
    Import Employees, Recruitment, and Passes data from development.
    Receives JSON data from export-data endpoint.
    """
    if not MAINTENANCE_SECRET:
        raise HTTPException(status_code=503, detail="Maintenance endpoint not configured")
    
    if not secrets.compare_digest(token, MAINTENANCE_SECRET):
        raise HTTPException(status_code=403, detail="Invalid maintenance token")
    
    results = {}
    all_errors = []
    
    try:
        # Import in order: employees first (others may depend on them)
        for table_name, conflict_col in [
            ("employees", "employee_id"),
            ("recruitment_requests", "id"),
            ("candidates", "id"),
            ("passes", "id"),
        ]:
            if table_name in data:
                result = await _import_table(session, table_name, data[table_name], conflict_col)
                results[table_name] = result["imported"]
                all_errors.extend(result["errors"])
        
        await session.commit()
        
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}")
    
    return {"success": True, "imported": results, "errors": all_errors[:20]}
