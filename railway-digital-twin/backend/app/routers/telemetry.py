from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List

from app.services.telemetry_processor import telemetry_processor
from app.schemas import TelemetryResponse

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except:
                pass

ws_manager = ConnectionManager()

@router.websocket("/ws/telemetry")
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                import json
                payload = json.loads(data)
                
                # If it's a telemetry packet from the simulator
                if payload.get("type") == "RAW_TELEMETRY":
                    raw_data = payload.get("data", {})
                    # Process it, calculate health index, and broadcast
                    await telemetry_processor.process_message(
                        raw_data, 
                        publish_callback=ws_manager.broadcast
                    )
            except Exception as e:
                # Log parsing errors or ignore
                pass
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
