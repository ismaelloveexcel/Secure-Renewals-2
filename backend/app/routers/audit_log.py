from fastapi import APIRouter, HTTPException
from app.core.config import is_feature_enabled

router = APIRouter(prefix="/audit-log", tags=["audit-log"])

audit_log = []  # In-memory for demo

@router.post("/add", summary="Add audit log entry")
def add_audit_log(entry: dict):
    if not is_feature_enabled("audit_log"):
        raise HTTPException(status_code=403, detail="Audit log feature disabled")
    audit_log.append(entry)
    return {"status": "logged"}

@router.get("/list", summary="List audit log entries")
def list_audit_log():
    if not is_feature_enabled("audit_log"):
        raise HTTPException(status_code=403, detail="Audit log feature disabled")
    return audit_log
