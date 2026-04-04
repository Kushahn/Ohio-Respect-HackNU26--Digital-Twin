from collections import deque
from datetime import datetime, timedelta, timezone
from typing import Any, Deque, Dict, List, Optional

import json

import numpy as np

from app.services.health_engine import health_engine
from app.services.simulator_mode import simulator_mode_state
from app.schemas import TelemetryData, HealthIndexData, TelemetryResponse

MAX_HISTORY_PER_LOCO = 8000


class TelemetryProcessor:
    def __init__(self):
        # Stores recent samples per loco for filtering
        self._buffers: Dict[str, Dict[str, List[float]]] = {}
        self._window_size = 5
        self._history: Dict[str, Deque[Dict[str, Any]]] = {}
        
    def _apply_ema(self, new_val: float, last_ema: float, alpha: float = 0.3) -> float:
        if last_ema is None:
            return new_val
        return alpha * new_val + (1 - alpha) * last_ema
        
    async def process_message(self, raw_data: Dict[str, Any], publish_callback=None) -> TelemetryResponse:
        loco_id = raw_data.get('locomotive_id', 'UNKNOWN')
        if loco_id not in self._buffers:
            self._buffers[loco_id] = {}
            
        # Apply median filtering on speed and traction to simulate signal de-noising
        for key in ['speed', 'traction_current']:
            val = raw_data.get(key, 0.0)
            if key not in self._buffers[loco_id]:
                self._buffers[loco_id][key] = []
            
            buf = self._buffers[loco_id][key]
            buf.append(float(val))
            if len(buf) > self._window_size:
                buf.pop(0)
            
            smoothed_val = float(np.median(buf))
            raw_data[key] = smoothed_val

        # Health Calculation
        health_data = health_engine.calculate_health(raw_data)
        
        resp = TelemetryResponse(
            telemetry=TelemetryData(**raw_data),
            health=HealthIndexData(**health_data)
        )

        self._append_history(resp)

        # Publish to WS if callback provided (e.g. broadcast directly)
        if publish_callback:
            mode, target_hz = simulator_mode_state.get()
            payload = resp.model_dump(mode="json")
            payload["simulator_mode"] = mode
            payload["target_ingest_hz"] = target_hz
            await publish_callback(json.dumps(payload))

        # TODO: Save to database asynchronously (SQLAlchemy + asyncpg)

        return resp

    def _append_history(self, resp: TelemetryResponse) -> None:
        loco = resp.telemetry.locomotive_id
        if loco not in self._history:
            self._history[loco] = deque(maxlen=MAX_HISTORY_PER_LOCO)
        self._history[loco].append(resp.model_dump(mode="json"))

    @staticmethod
    def _parse_timestamp(value: Any) -> Optional[datetime]:
        if value is None:
            return None
        if isinstance(value, datetime):
            dt = value
        elif isinstance(value, str):
            s = value.replace("Z", "+00:00")
            try:
                dt = datetime.fromisoformat(s)
            except ValueError:
                return None
        else:
            return None
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt

    def get_history(
        self,
        locomotive_id: str,
        from_time: Optional[datetime] = None,
        to_time: Optional[datetime] = None,
    ) -> List[Dict[str, Any]]:
        now = datetime.now(timezone.utc)
        if to_time is None:
            to_time = now
        if to_time.tzinfo is None:
            to_time = to_time.replace(tzinfo=timezone.utc)
        if from_time is None:
            from_time = to_time - timedelta(minutes=15)
        if from_time.tzinfo is None:
            from_time = from_time.replace(tzinfo=timezone.utc)

        buf = self._history.get(locomotive_id, deque())
        out: List[Dict[str, Any]] = []
        for item in buf:
            ts = self._parse_timestamp(item.get("telemetry", {}).get("timestamp"))
            if ts is None:
                continue
            if from_time <= ts <= to_time:
                out.append(item)
        return out


telemetry_processor = TelemetryProcessor()
