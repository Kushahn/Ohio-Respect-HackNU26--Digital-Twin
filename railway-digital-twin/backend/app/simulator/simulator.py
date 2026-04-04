import asyncio
import json
import random
import os
import time
from datetime import datetime
import websockets

# Configuration
WS_URL = os.getenv("WS_URL", "ws://localhost:8000/ws/telemetry")
LOCOMOTIVE_ID = os.getenv("LOCOMOTIVE_ID", "KZ8A-0001")
MODE = os.getenv("SIMULATOR_MODE", "NORMAL") # NORMAL | HIGHLOAD

# Simulation Physics & Limits
MAX_SPEED = 120.0 # km/h (KZ8A)
ACCELERATION_RATE = 1.2 # km/h per second
DECELERATION_RATE = 2.0

class TrainSimulator:
    def __init__(self):
        self.state = "ACCELERATING" # ACCELERATING, CRUISING, BRAKING, STOPPED
        self.speed = 0.0
        self.time_in_state = 0
        self.cruise_time = random.randint(60, 180) # Seconds to cruise

    def _generate_alerts(self, speed, oil_temp) -> list:
        alerts = []
        if random.random() < 0.01: # 1% chance every tick
            alerts.append("SENSOR_GLITCH")
        if oil_temp > 95:
            alerts.append("ENGINE_OIL_WARNING")
        if speed > MAX_SPEED * 1.05:
            alerts.append("OVERSPEED_WARNING")
        return alerts

    def get_next_telemetry(self) -> dict:
        # Determine Train State
        if self.state == "ACCELERATING":
            self.speed += ACCELERATION_RATE + random.uniform(-0.1, 0.1)
            if self.speed >= MAX_SPEED:
                self.speed = MAX_SPEED
                self.state = "CRUISING"
                self.time_in_state = 0
        elif self.state == "CRUISING":
            self.speed += random.uniform(-1.0, 1.0)
            self.time_in_state += 1
            if self.time_in_state > self.cruise_time:
                self.state = "BRAKING"
        elif self.state == "BRAKING":
            self.speed -= DECELERATION_RATE + random.uniform(0, 0.5)
            if self.speed <= 0:
                self.speed = 0
                self.state = "STOPPED"
                self.time_in_state = 0
        elif self.state == "STOPPED":
            self.time_in_state += 1
            if self.time_in_state > 10:
                self.state = "ACCELERATING"
                self.cruise_time = random.randint(60, 180)

        # Baseline parameters
        accel = ACCELERATION_RATE if self.state == "ACCELERATING" else (-DECELERATION_RATE if self.state == "BRAKING" else 0)
        
        # Traction parameters (High current when accelerating)
        traction_current = 0
        if self.state == "ACCELERATING":
             traction_current = random.uniform(700, 950)
        elif self.state == "CRUISING":
             traction_current = random.uniform(200, 400)
        
        # Traction voltage (25kV AC nominal)
        traction_voltage = random.gauss(25000, 200)
        if random.random() < 0.05:
            traction_voltage -= random.uniform(2000, 5000) # Voltage drop simulation

        # Engine/Transformers
        engine_rpm = 0 if self.state == "STOPPED" else (self.speed * 8.5 + random.uniform(0, 50))
        # Oil temperature rises when accelerating
        oil_temperature = 85.0 + (traction_current / 100.0) + random.uniform(-2, 2)
        oil_pressure = 4.5 + random.uniform(-0.2, 0.2)
        coolant_temperature = oil_temperature * 0.95

        # Brakes
        brake_pipe_pressure = 5.0 + random.uniform(-0.05, 0.05)
        brake_cylinder_pressure = 0.0
        if self.state == "BRAKING":
            brake_pipe_pressure -= random.uniform(0.5, 1.2)
            brake_cylinder_pressure = 3.5 + random.uniform(-0.2, 0.2)

        # Environment & Consumables
        fuel_level = max(0, 100.0 - (time.time() % 3600) / 36.0) # Slowly depletes
        energy_consumption = traction_current * traction_voltage / 1000.0 if traction_current > 0 else 0

        # Create alerts payload
        alerts = self._generate_alerts(self.speed, oil_temperature)

        return {
            "locomotive_id": LOCOMOTIVE_ID,
            "timestamp": datetime.utcnow().isoformat(),
            "speed": max(0, self.speed),
            "acceleration": accel,
            "traction_current": max(0, traction_current),
            "traction_voltage": traction_voltage,
            "engine_rpm": max(0, engine_rpm),
            "oil_temperature": oil_temperature,
            "oil_pressure": oil_pressure,
            "coolant_temperature": coolant_temperature,
            "brake_pipe_pressure": brake_pipe_pressure,
            "brake_cylinder_pressure": brake_cylinder_pressure,
            "fuel_level": fuel_level,
            "energy_consumption": energy_consumption,
            "alerts": alerts
        }

async def run_simulator():
    freq = 1.0 # NORMAL: 1 Hz
    if MODE == "HIGHLOAD":
        freq = 0.1 # HIGHLOAD: 10 Hz (10x faster)

    print(f"Starting Simulator for {LOCOMOTIVE_ID} in {MODE} mode...")
    
    # Simple backoff reconnection logic
    while True:
        try:
            print(f"Connecting to {WS_URL}...")
            async with websockets.connect(WS_URL) as websocket:
                print("Connected! Sending telemetry data...")
                sim = TrainSimulator()
                while True:
                    data = sim.get_next_telemetry()
                    # Include a flag so the backend knows this is raw simulator data
                    payload = {"type": "RAW_TELEMETRY", "data": data}
                    await websocket.send(json.dumps(payload))
                    
                    if MODE == "NORMAL":
                        print(f"Sent [{data['timestamp']}] Speed: {data['speed']:.1f} km/h, State: {sim.state}")
                        
                    await asyncio.sleep(freq)

        except websockets.exceptions.ConnectionClosed:
            print("WS Connection Closed. Reconnecting in 3s...")
            await asyncio.sleep(3)
        except Exception as e:
            print(f"Connection error: {e}. Retrying in 3s...")
            await asyncio.sleep(3)

if __name__ == "__main__":
    asyncio.run(run_simulator())
