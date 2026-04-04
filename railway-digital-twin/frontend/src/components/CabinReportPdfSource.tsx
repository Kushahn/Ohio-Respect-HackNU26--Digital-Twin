import { forwardRef } from "react";
import type { HealthIndexData, TelemetryData } from "../types/telemetry";

export interface CabinReportPdfPayload {
  telemetry: TelemetryData;
  health: HealthIndexData;
  exportTime: Date;
  rowCount: number;
}

const CabinReportPdfSource = forwardRef<HTMLDivElement, { payload: CabinReportPdfPayload }>(
  function CabinReportPdfSource({ payload }, ref) {
    const { telemetry, health, exportTime, rowCount } = payload;
    const top = Object.entries(health.top_factors ?? {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    const alerts = telemetry.alerts ?? [];

    return (
      <div ref={ref} className="cabin-report-pdf-source">
        <h1 className="crp-title">Отчёт по индексу состояния</h1>
        <p className="crp-meta">
          Сформировано: {exportTime.toLocaleString("ru-RU")} · Локомотив:{" "}
          <strong>{telemetry.locomotive_id}</strong>
        </p>
        <p className="crp-meta">
          К CSV приложено строк телеметрии за последние 15 минут: <strong>{rowCount}</strong>
        </p>

        <h2 className="crp-h2">Индекс состояния</h2>
        <p className="crp-line">
          <strong>{health.global_index}</strong> / 100 — категория: <strong>{health.status_category}</strong>
        </p>

        <h2 className="crp-h2">Топ-5 факторов снижения</h2>
        {top.length === 0 ? (
          <p className="crp-line">Нет штрафующих факторов (индекс без деградаций по правилам движка).</p>
        ) : (
          <ol className="crp-list">
            {top.map(([name, val]) => (
              <li key={name}>
                {name} — <strong>{val.toFixed(1)}</strong> б.
              </li>
            ))}
          </ol>
        )}

        <h2 className="crp-h2">Активные алерты</h2>
        {alerts.length === 0 ? (
          <p className="crp-line">Активных алертов нет.</p>
        ) : (
          <ul className="crp-list">
            {alerts.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        )}

        <p className="crp-footer">Цифровой двойник локомотива · прототип · синтетические данные</p>
      </div>
    );
  }
);

export default CabinReportPdfSource;
