import { apiFetch } from "./client";
import type { HistoryApiResponse } from "../types/telemetry";

function toIsoParam(d: Date): string {
  return d.toISOString();
}

export async function getHistory(
  locomotiveId: string,
  from: Date,
  to: Date
): Promise<HistoryApiResponse> {
  const q = new URLSearchParams({
    from: toIsoParam(from),
    to: toIsoParam(to),
  });
  return apiFetch<HistoryApiResponse>(
    `/api/history/${encodeURIComponent(locomotiveId)}?${q.toString()}`
  );
}
