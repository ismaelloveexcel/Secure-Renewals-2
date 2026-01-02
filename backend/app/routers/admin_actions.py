from fastapi import APIRouter, HTTPException
from app.core.config import is_feature_enabled, undo, redo, log_action

router = APIRouter(prefix="/admin-actions", tags=["admin-actions"])

@router.post("/log", summary="Log admin action")
def log_admin_action(action: dict):
    if not is_feature_enabled("undo_redo"):
        raise HTTPException(status_code=403, detail="Undo/Redo feature disabled")
    log_action(action)
    return {"status": "logged"}

@router.post("/undo", summary="Undo last admin action")
def undo_action():
    if not is_feature_enabled("undo_redo"):
        raise HTTPException(status_code=403, detail="Undo/Redo feature disabled")
    action = undo()
    return {"undone": action}

@router.post("/redo", summary="Redo last undone admin action")
def redo_action():
    if not is_feature_enabled("undo_redo"):
        raise HTTPException(status_code=403, detail="Undo/Redo feature disabled")
    action = redo()
    return {"redone": action}
