import os
from threading import Lock

_VALID = frozenset({"NORMAL", "HIGHLOAD"})


class SimulatorModeState:
    """Режим частоты симулятора: NORMAL ≈1 Гц, HIGHLOAD ≈10 Гц (управляется API и опрашивается симулятором)."""

    def __init__(self) -> None:
        self._lock = Lock()
        initial = os.getenv("SIMULATOR_MODE", "NORMAL").strip().upper()
        self._mode: str = "HIGHLOAD" if initial == "HIGHLOAD" else "NORMAL"

    def get(self) -> tuple[str, int]:
        with self._lock:
            if self._mode == "HIGHLOAD":
                return "HIGHLOAD", 10
            return "NORMAL", 1

    def set_mode(self, mode: str) -> None:
        m = mode.strip().upper()
        if m not in _VALID:
            return
        with self._lock:
            self._mode = m

    def toggle(self) -> str:
        with self._lock:
            self._mode = "HIGHLOAD" if self._mode == "NORMAL" else "NORMAL"
            return self._mode


simulator_mode_state = SimulatorModeState()
