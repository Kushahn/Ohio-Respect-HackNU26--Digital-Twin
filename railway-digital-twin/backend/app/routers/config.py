from fastapi import APIRouter
from typing import Dict, Any

router = APIRouter()

@router.get("/api/config")
async def get_config() -> Dict[str, Any]:
    return {
        "health_index_thresholds": {
            "warning": 85,
            "critical": 60
        },
        "formula_weights": {
            "engine": 0.3,
            "brakes": 0.3,
            "electric": 0.15,
            "energy": 0.05,
            "diagnostics": 0.2
        }
    }

@router.put("/api/config")
async def update_config(config_data: dict):
    # TODO: Protect with JWT Auth
    return {"status": "updated", "config": config_data}
