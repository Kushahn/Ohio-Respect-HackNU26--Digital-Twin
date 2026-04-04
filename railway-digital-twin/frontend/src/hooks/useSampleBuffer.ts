import { useEffect, useRef, useState } from "react";
import type { TelemetryResponse, TrendPoint, TrendWindowMinutes } from "../types/telemetry";

const MAX_POINTS = 2500;

function parseTimeMs(iso: string | undefined): number {
  if (!iso) return Date.now();
  const s = iso.replace("Z", "+00:00");
  const d = Date.parse(s);
  return Number.isFinite(d) ? d : Date.now();
}

export function useSampleBuffer(
  live: TelemetryResponse | null,
  windowMinutes: TrendWindowMinutes
): TrendPoint[] {
  const [points, setPoints] = useState<TrendPoint[]>([]);
  const windowRef = useRef(windowMinutes);
  windowRef.current = windowMinutes;

  useEffect(() => {
    if (!live) return;
    const t = parseTimeMs(live.telemetry.timestamp);
    setPoints((prev) => {
      const next: TrendPoint[] = [
        ...prev,
        {
          t,
          speed: live.telemetry.speed,
          traction_current: live.telemetry.traction_current,
          oil_temperature: live.telemetry.oil_temperature,
        },
      ];
      const cut = next.length > MAX_POINTS ? next.slice(-MAX_POINTS) : next;
      const winMs = windowRef.current * 60 * 1000;
      const newest = cut[cut.length - 1]?.t ?? t;
      return cut.filter((p) => p.t >= newest - winMs);
    });
  }, [live]);

  useEffect(() => {
    setPoints((prev) => {
      if (prev.length === 0) return prev;
      const winMs = windowMinutes * 60 * 1000;
      const newest = prev[prev.length - 1].t;
      return prev.filter((p) => p.t >= newest - winMs);
    });
  }, [windowMinutes]);

  return points;
}

export function filterPointsByWindow(
  points: TrendPoint[],
  windowMinutes: TrendWindowMinutes
): TrendPoint[] {
  if (points.length === 0) return points;
  const winMs = windowMinutes * 60 * 1000;
  const newest = points[points.length - 1].t;
  return points.filter((p) => p.t >= newest - winMs);
}
