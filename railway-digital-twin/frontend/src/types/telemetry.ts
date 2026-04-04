export interface TelemetryData {
  locomotive_id: string;
  timestamp: string;
  speed: number;
  acceleration: number;
  traction_current: number;
  traction_voltage: number;
  engine_rpm: number;
  oil_temperature: number;
  oil_pressure: number;
  coolant_temperature: number;
  brake_pipe_pressure: number;
  brake_cylinder_pressure: number;
  fuel_level: number;
  energy_consumption: number;
  alerts: string[];
}

export interface HealthIndexData {
  global_index: number;
  status_category: string;
  sub_engine_traction: number;
  sub_brakes: number;
  sub_electric: number;
  sub_energy: number;
  sub_diagnostics: number;
  top_factors: Record<string, number>;
}

export interface TelemetryResponse {
  telemetry: TelemetryData;
  health: HealthIndexData;
  /** Режим симулятора на backend: NORMAL ≈1 Гц, HIGHLOAD ≈10 Гц */
  simulator_mode?: "NORMAL" | "HIGHLOAD";
  target_ingest_hz?: number;
}

export interface HistoryApiResponse {
  locomotive_id: string;
  from: string;
  to: string;
  data: TelemetryResponse[];
}

export type TrendWindowMinutes = 5 | 10 | 15;

export interface TrendPoint {
  t: number;
  speed: number;
  traction_current: number;
  oil_temperature: number;
}
