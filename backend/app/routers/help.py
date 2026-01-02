from fastapi import APIRouter, HTTPException
from app.core.config import is_feature_enabled

router = APIRouter(prefix="/help", tags=["help"])

@router.get("/context", summary="Get help for current context")
def get_help(context: str):
    if not is_feature_enabled("help"):
        raise HTTPException(status_code=403, detail="Help feature disabled")
    # Demo: return simple help text; extend as needed
    help_texts = {
        "dashboard": "This is your admin dashboard. Use the menu to navigate.",
        "attendance": "Check in/out employees and view attendance logs.",
        "passes": "Generate, view, and manage access passes.",
        "onboarding": "Follow the wizard to onboard new employees.",
    }
    return {"help": help_texts.get(context, "No help available for this context.")}
