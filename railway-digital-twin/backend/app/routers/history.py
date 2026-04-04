from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Query

from app.services.telemetry_processor import telemetry_processor

router = APIRouter()


@router.get("/api/history/{locomotive_id}")
async def get_history(
    locomotive_id: str,
    from_time: Optional[datetime] = Query(None, alias="from"),
    to_time: Optional[datetime] = Query(None, alias="to"),
) -> Dict[str, Any]:
    now = datetime.now(timezone.utc)
    effective_to = to_time or now
    effective_from = from_time or (effective_to - timedelta(minutes=15))

    data: List[Dict[str, Any]] = telemetry_processor.get_history(
        locomotive_id,
        from_time=effective_from,
        to_time=effective_to,
    )

    return {
        "locomotive_id": locomotive_id,
        "from": effective_from.isoformat(),
        "to": effective_to.isoformat(),
        "data": data,
    }
