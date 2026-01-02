from fastapi import APIRouter, HTTPException
from app.core.config import is_feature_enabled

router = APIRouter(prefix="/wizard", tags=["wizard"])

@router.get("/onboarding-steps", summary="Get onboarding wizard steps")
def onboarding_steps():
    if not is_feature_enabled("wizard"):
        raise HTTPException(status_code=403, detail="Wizard feature disabled")
    return [
        {"step": 1, "title": "Upload Employee Data", "description": "Import or enter employee details."},
        {"step": 2, "title": "Assign Roles", "description": "Set user roles and permissions."},
        {"step": 3, "title": "Generate Passes", "description": "Create and issue access passes."},
        {"step": 4, "title": "Review & Confirm", "description": "Preview and finalize onboarding."},
    ]
