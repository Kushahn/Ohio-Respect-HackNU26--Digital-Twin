import { apiFetch } from "./client";

export interface SimulatorModeResponse {
  mode: "NORMAL" | "HIGHLOAD";
  target_hz: number;
}

export async function getSimulatorMode(): Promise<SimulatorModeResponse> {
  return apiFetch<SimulatorModeResponse>("/api/simulator/mode");
}

export async function toggleSimulatorMode(): Promise<SimulatorModeResponse> {
  return apiFetch<SimulatorModeResponse>("/api/simulator/mode/toggle", { method: "POST" });
}
