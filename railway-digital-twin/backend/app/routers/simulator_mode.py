from fastapi import APIRouter

from app.services.simulator_mode import simulator_mode_state

router = APIRouter()


@router.get("/api/simulator/mode")
def get_simulator_mode() -> dict:
    mode, hz = simulator_mode_state.get()
    return {"mode": mode, "target_hz": hz}


@router.post("/api/simulator/mode/toggle")
def toggle_simulator_mode() -> dict:
    simulator_mode_state.toggle()
    mode, hz = simulator_mode_state.get()
    return {"mode": mode, "target_hz": hz}
