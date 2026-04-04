import type { TelemetryResponse } from "../types/telemetry";
import { downloadTextFile, escapeCsvCell } from "./reportExport";

export type DispatchTrainRowInput = Readonly<{
  label: string;
  snapshot: TelemetryResponse | null;
}>;

function healthCategoryToCsv(cat: string | undefined): string {
  if (!cat) return "";
  if (cat === "Норма") return "НОРМА";
  if (cat === "Внимание") return "ВНИМАНИЕ";
  if (cat === "Критично") return "КРИТИЧНО";
  return cat.toUpperCase();
}

function connectionLabel(snapshot: TelemetryResponse | null, wsConnected: boolean): string {
  if (!snapshot) return "Нет данных";
  return wsConnected ? "Онлайн" : "Нет канала";
}

function compositionLabel(row: DispatchTrainRowInput): string {
  const id = row.snapshot?.telemetry.locomotive_id;
  if (id && id !== "—") return id;
  return row.label;
}

function formatLastUpdate(iso: string | undefined): string {
  if (!iso) return "";
  const t = Date.parse(iso.replace("Z", "+00:00"));
  if (!Number.isFinite(t)) return iso;
  return new Date(t).toLocaleString("ru-RU");
}

export function dispatchSummaryToCsv(rows: readonly DispatchTrainRowInput[], wsConnected: boolean): string {
  const headers = [
    "Состав",
    "Статус связи",
    "Индекс здоровья",
    "Статус (НОРМА/ВНИМАНИЕ/КРИТИЧНО)",
    "Скорость",
    "Уровень топлива",
    "Время последнего обновления",
  ];
  const lines = [headers.map(escapeCsvCell).join(",")];

  for (const row of rows) {
    const snap = row.snapshot;
    const h = snap?.health;
    const t = snap?.telemetry;
    const idx =
      typeof h?.global_index === "number" && !Number.isNaN(h.global_index)
        ? h.global_index.toFixed(1)
        : "";
    const speed =
      typeof t?.speed === "number" && !Number.isNaN(t.speed) ? t.speed.toFixed(1) : "";
    const fuel =
      typeof t?.fuel_level === "number" && !Number.isNaN(t.fuel_level)
        ? t.fuel_level.toFixed(1)
        : "";

    const cells = [
      escapeCsvCell(compositionLabel(row)),
      escapeCsvCell(connectionLabel(snap, wsConnected)),
      escapeCsvCell(idx),
      escapeCsvCell(healthCategoryToCsv(h?.status_category)),
      escapeCsvCell(speed),
      escapeCsvCell(fuel),
      escapeCsvCell(formatLastUpdate(t?.timestamp)),
    ];
    lines.push(cells.join(","));
  }

  return "\uFEFF" + lines.join("\n");
}

function reportFilenameDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function downloadDispatchSummaryCsv(rows: readonly DispatchTrainRowInput[], wsConnected: boolean): void {
  const csv = dispatchSummaryToCsv(rows, wsConnected);
  const name = `dispatch-report-${reportFilenameDate(new Date())}.csv`;
  downloadTextFile(name, csv, "text/csv;charset=utf-8");
}
