from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime

class TelemetryData(BaseModel):
    locomotive_id: str
    timestamp: datetime
    speed: float = Field(..., description="Скорость локомотива, км/ч")
    acceleration: float = Field(..., description="Ускорение, м/с2")
    traction_current: float = Field(..., description="Тяговый ток, А")
    traction_voltage: float = Field(..., description="Напряжение, В")
    engine_rpm: float = Field(..., description="Обороты двигателя, об/мин")
    oil_temperature: float = Field(..., description="Температура масла, °C")
    oil_pressure: float = Field(..., description="Давление масла, бар")
    coolant_temperature: float = Field(..., description="Температура охл. жидкости, °C")
    brake_pipe_pressure: float = Field(..., description="Тормозная магистраль, бар")
    brake_cylinder_pressure: float = Field(..., description="Тормозной цилиндр, бар")
    fuel_level: float = Field(..., description="Уровень топлива, %")
    energy_consumption: float = Field(..., description="Потребление энергии, кВт*ч")
    alerts: List[str] = Field(default_factory=list)

    class Config:
        from_attributes = True

class HealthIndexData(BaseModel):
    global_index: float
    status_category: str
    sub_engine_traction: float
    sub_brakes: float
    sub_electric: float
    sub_energy: float
    sub_diagnostics: float
    top_factors: Dict[str, float]

class TelemetryResponse(BaseModel):
    telemetry: TelemetryData
    health: HealthIndexData
