import { getHistory } from "../api/history";
import type { HealthIndexData, TelemetryData, TelemetryResponse } from "../types/telemetry";

export function parseTimestampMs(iso: string | undefined): number {
  if (!iso) return NaN;
  const t = Date.parse(iso.replace("Z", "+00:00"));
  return Number.isFinite(t) ? t : NaN;
}

export function filterFramesLastMinutes(
  frames: TelemetryResponse[],
  minutes: number,
  nowMs: number = Date.now()
): TelemetryResponse[] {
  const start = nowMs - minutes * 60 * 1000;
  return frames
    .filter((f) => {
      const t = parseTimestampMs(f.telemetry.timestamp);
      return Number.isFinite(t) && t >= start && t <= nowMs;
    })
    .sort((a, b) => parseTimestampMs(a.telemetry.timestamp) - parseTimestampMs(b.telemetry.timestamp));
}

/** Объединяет кадры по секунде времени (последний выигрывает). */
export function mergeBySecondBucket(a: TelemetryResponse[], b: TelemetryResponse[]): TelemetryResponse[] {
  const map = new Map<number, TelemetryResponse>();
  for (const f of [...a, ...b]) {
    const t = parseTimestampMs(f.telemetry.timestamp);
    const key = Number.isFinite(t) ? Math.floor(t / 1000) : Math.floor(Math.random() * 1e12);
    map.set(key, f);
  }
  return Array.from(map.values()).sort(
    (x, y) => parseTimestampMs(x.telemetry.timestamp) - parseTimestampMs(y.telemetry.timestamp)
  );
}

export async function loadFramesLast15Minutes(
  locomotiveId: string,
  localFrames: TelemetryResponse[]
): Promise<TelemetryResponse[]> {
  const to = new Date();
  const from = new Date(to.getTime() - 15 * 60 * 1000);
  let apiFrames: TelemetryResponse[] = [];
  try {
    const res = await getHistory(locomotiveId, from, to);
    apiFrames = Array.isArray(res.data) ? res.data : [];
  } catch {
    /* только локальный буфер */
  }
  const merged = mergeBySecondBucket(apiFrames, localFrames);
  return filterFramesLastMinutes(merged, 15);
}

function escapeCsvCell(v: string): string {
  if (/[",\n\r]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

function num(n: number | undefined): string {
  return typeof n === "number" && !Number.isNaN(n) ? String(n) : "";
}

export function telemetryFramesToCsv(frames: TelemetryResponse[]): string {
  const headers = [
    "timestamp_iso",
    "locomotive_id",
    "speed_kmh",
    "acceleration_m_s2",
    "traction_current_a",
    "traction_voltage_v",
    "engine_rpm",
    "oil_temp_c",
    "oil_pressure_bar",
    "coolant_temp_c",
    "brake_pipe_bar",
    "brake_cylinder_bar",
    "fuel_level_pct",
    "energy_consumption",
    "alerts",
    "health_global_index",
    "health_category",
    "sub_engine",
    "sub_brakes",
    "sub_electric",
    "sub_energy",
    "sub_diagnostics",
  ];
  const lines = [headers.join(",")];
  for (const f of frames) {
    const t: TelemetryData = f.telemetry;
    const h: HealthIndexData = f.health;
    const alerts = (t.alerts ?? []).join("; ");
    const row = [
      escapeCsvCell(t.timestamp),
      escapeCsvCell(t.locomotive_id),
      num(t.speed),
      num(t.acceleration),
      num(t.traction_current),
      num(t.traction_voltage),
      num(t.engine_rpm),
      num(t.oil_temperature),
      num(t.oil_pressure),
      num(t.coolant_temperature),
      num(t.brake_pipe_pressure),
      num(t.brake_cylinder_pressure),
      num(t.fuel_level),
      num(t.energy_consumption),
      escapeCsvCell(alerts),
      num(h.global_index),
      escapeCsvCell(h.status_category),
      num(h.sub_engine_traction),
      num(h.sub_brakes),
      num(h.sub_electric),
      num(h.sub_energy),
      num(h.sub_diagnostics),
    ];
    lines.push(row.join(","));
  }
  return "\uFEFF" + lines.join("\n");
}

export function downloadTextFile(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  a.click();
  URL.revokeObjectURL(url);
}

export function formatExportStamp(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}
