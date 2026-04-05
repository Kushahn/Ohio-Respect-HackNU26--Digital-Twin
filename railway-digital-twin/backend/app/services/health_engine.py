from typing import Dict, Any, List

class HealthEngine:
    """
    Deterministic Health Index calculation for SIL-3 compatibility.
    No ML used. Based on physics and nominal ranges.
    """
    
    def calculate_health(self, t: Dict[str, Any]) -> Dict[str, Any]:
        penalties = {}
        
        # 1. Engine & Traction Health (0-100)
        # Oil Temp: Nominal 80-95. Warning > 105. Critical > 115.
        oil_temp = t.get("oil_temperature", 90.0)
        engine_h = 100.0
        if oil_temp > 95:
            pen = (oil_temp - 95) * 2.0
            engine_h -= pen
            penalties['Высокая температура масла'] = pen
            
        oil_press = t.get("oil_pressure", 5.0)
        if oil_press < 3.0:
            pen = (3.0 - oil_press) * 10.0
            engine_h -= pen
            penalties['Низкое давление масла'] = pen
        
        # 2. Brake System Health
        # Brake pipe pressure: Nominal 5.0 - 5.2. 
        bp_press = t.get("brake_pipe_pressure", 5.0)
        brake_h = 100.0
        if abs(bp_press - 5.0) > 0.2:
            pen = abs(bp_press - 5.0) * 15.0
            brake_h -= pen
            penalties['Отклонение давления ТМ'] = pen
            
        # 3. Electric & Power
        # Voltage: Nominal 25000 (KZ8A typical)
        volt = t.get("traction_voltage", 25000.0)
        elec_h = 100.0
        if volt < 21000:
            pen = (21000 - volt) / 100.0
            elec_h -= pen
            penalties['Низкое напряжение КС'] = pen
            
        # 4. Energy/Fuel Efficiency
        fuel_level = t.get("fuel_level", 50.0)
        energy_h = 100.0
        if fuel_level < 15.0:
            pen = (15.0 - fuel_level) * 3.0
            energy_h -= pen
            penalties['Низкий уровень топлива'] = pen
            
        # 5. Diagnostics (Alerts)
        diag_h = 100.0
        alerts: List[str] = t.get("alerts", [])
        for a in alerts:
            diag_h -= 15.0
            penalties[f'Неисправность: {a}'] = 15.0
            
        # Clamp bounds
        engine_h = max(0.0, min(100.0, engine_h))
        brake_h = max(0.0, min(100.0, brake_h))
        elec_h = max(0.0, min(100.0, elec_h))
        energy_h = max(0.0, min(100.0, energy_h))
        diag_h = max(0.0, min(100.0, diag_h))
        
        # Global Index
        weights = {
            'engine': 0.3,
            'brakes': 0.3,
            'electric': 0.15,
            'energy': 0.05,
            'diagnostics': 0.2
        }
        
        global_idx = (
            engine_h * weights['engine'] +
            brake_h * weights['brakes'] +
            elec_h * weights['electric'] +
            energy_h * weights['energy'] +
            diag_h * weights['diagnostics']
        )
        
        # Category
        cat = "Норма"
        if global_idx < 50:
            cat = "Опасно"
        elif global_idx < 80:
            cat = "Внимание"
            
        # Top factors
        sorted_factors = sorted(penalties.items(), key=lambda item: item[1], reverse=True)[:5]
        
        return {
            "global_index": round(global_idx, 1),
            "status_category": cat,
            "sub_engine_traction": round(engine_h, 1),
            "sub_brakes": round(brake_h, 1),
            "sub_electric": round(elec_h, 1),
            "sub_energy": round(energy_h, 1),
            "sub_diagnostics": round(diag_h, 1),
            "top_factors": dict(sorted_factors)
        }
        
health_engine = HealthEngine()
