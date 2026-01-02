from fastapi import APIRouter, Depends, HTTPException, status
from app.core.config import is_feature_enabled
from datetime import datetime
from typing import List, Dict

router = APIRouter(prefix="/attendance", tags=["attendance"])

attendance_log: List[Dict] = []  # In-memory for demo; use DB in production

@router.post("/check-in", summary="Employee check-in")
def check_in(employee_id: str):
    if not is_feature_enabled("attendance"):
        raise HTTPException(status_code=403, detail="Attendance feature disabled")
    now = datetime.utcnow().isoformat()
    attendance_log.append({"employee_id": employee_id, "action": "check-in", "timestamp": now})
    return {"status": "checked_in", "timestamp": now}

@router.post("/check-out", summary="Employee check-out")
def check_out(employee_id: str):
    if not is_feature_enabled("attendance"):
        raise HTTPException(status_code=403, detail="Attendance feature disabled")
    now = datetime.utcnow().isoformat()
    attendance_log.append({"employee_id": employee_id, "action": "check-out", "timestamp": now})
    return {"status": "checked_out", "timestamp": now}

@router.get("/log", summary="Get attendance log")
def get_log():
    if not is_feature_enabled("attendance"):
        raise HTTPException(status_code=403, detail="Attendance feature disabled")
    return attendance_log

@router.get("/analytics", summary="Attendance analytics")
def analytics():
    if not is_feature_enabled("attendance_analytics"):
        raise HTTPException(status_code=403, detail="Attendance analytics disabled")
    present = len([a for a in attendance_log if a["action"] == "check-in"])
    absent = 0  # Demo only
    total = present + absent
    return {"present": present, "absent": absent, "total": total}
