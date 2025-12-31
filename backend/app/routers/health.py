from fastapi import APIRouter, Depends

from app.core.security import require_role

router = APIRouter(prefix="/health", tags=["health"])


@router.get("", summary="API healthcheck")
async def healthcheck(role: str = Depends(require_role())):
    return {"status": "ok", "role": role}
