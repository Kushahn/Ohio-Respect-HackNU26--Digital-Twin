from datetime import datetime
from sqlalchemy import Column, Integer, Float, String, DateTime, JSON
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class TelemetrySample(Base):
    __tablename__ = "telemetry_samples"
    
    id = Column(Integer, primary_key=True, index=True)
    locomotive_id = Column(String, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Movement
    speed = Column(Float)
    acceleration = Column(Float)
    
    # Electric / Traction
    traction_current = Column(Float)
    traction_voltage = Column(Float)
    
    # Engine / Diesel (or Trafo)
    engine_rpm = Column(Float)
    oil_temperature = Column(Float)
    oil_pressure = Column(Float)
    coolant_temperature = Column(Float)
    
    # Brakes
    brake_pipe_pressure = Column(Float)
    brake_cylinder_pressure = Column(Float)
    
    # Fuel / Energy
    fuel_level = Column(Float)
    energy_consumption = Column(Float)
    
    # Diagnostics
    alerts = Column(JSON) # List of alert strings codes

class HealthIndexSnapshot(Base):
    __tablename__ = "health_index_snapshots"
    
    id = Column(Integer, primary_key=True, index=True)
    locomotive_id = Column(String, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    
    global_index = Column(Float)
    status_category = Column(String) # Normal, Warning, Critical
    
    sub_engine_traction = Column(Float)
    sub_brakes = Column(Float)
    sub_electric = Column(Float)
    sub_energy = Column(Float)
    sub_diagnostics = Column(Float)
    
    top_factors = Column(JSON) # Dictionary explaining degradation
