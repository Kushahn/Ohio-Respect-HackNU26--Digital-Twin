from fastapi import APIRouter
from typing import Dict

router = APIRouter()

@router.get("/healthcheck")
async def health_check() -> Dict[str, str]:
    return {"status": "ok", "service": "Railway Digital Twin Backend", "version": "1.0.0"}
