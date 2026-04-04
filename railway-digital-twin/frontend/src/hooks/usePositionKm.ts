import { useEffect, useRef, useState } from "react";

function parseTimeMs(iso: string | undefined): number | null {
  if (!iso) return null;
  const d = Date.parse(iso.replace("Z", "+00:00"));
  return Number.isFinite(d) ? d : null;
}

/** Approximate path position (km) by integrating speed (km/h) over time between samples. */
export function usePositionKm(
  speedKmh: number | undefined,
  timestampIso: string | undefined
): number {
  const [km, setKm] = useState(0);
  const lastTRef = useRef<number | null>(null);

  useEffect(() => {
    const t = parseTimeMs(timestampIso);
    if (t === null || speedKmh === undefined || Number.isNaN(speedKmh)) return;

    const last = lastTRef.current;
    lastTRef.current = t;
    if (last === null) return;

    const dtSec = Math.max(0, (t - last) / 1000);
    const deltaKm = (speedKmh / 3600) * dtSec;
    setKm((k) => k + deltaKm);
  }, [speedKmh, timestampIso]);

  return km;
}
