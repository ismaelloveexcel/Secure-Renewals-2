from fastapi import APIRouter, HTTPException
from app.core.config import is_feature_enabled

router = APIRouter(prefix="/notifications", tags=["notifications"])

notifications = []  # In-memory for demo

@router.post("/send", summary="Send notification")
def send_notification(message: str, type: str = "info"):
    if not is_feature_enabled("notifications"):
        raise HTTPException(status_code=403, detail="Notifications feature disabled")
    notifications.append({"message": message, "type": type})
    return {"status": "sent"}

@router.get("/list", summary="List notifications")
def list_notifications():
    if not is_feature_enabled("notifications"):
        raise HTTPException(status_code=403, detail="Notifications feature disabled")
    return notifications
