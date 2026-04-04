import { useMemo, useState } from "react";
import { FileDown } from "lucide-react";
import HealthIndexWidget from "../components/HealthIndexWidget";
import SpeedPanel from "../components/SpeedPanel";
import AlertsPanel from "../components/AlertsPanel";
import EnergyPanel from "../components/EnergyPanel";
import PressureTempPanel from "../components/PressureTempPanel";
import ElectricPanel from "../components/ElectricPanel";
import { useTelemetry } from "../contexts/TelemetryContext";
import type { TelemetryResponse } from "../types/telemetry";
import { downloadDispatchSummaryCsv } from "../utils/dispatchExport";

interface TrainRow {
  id: string;
  label: string;
  snapshot: TelemetryResponse | null;
}

function categoryClass(cat: string | undefined) {
  if (cat === "Норма") return "status-normal";
  if (cat === "Внимание") return "status-warning";
  if (cat === "Критично") return "status-critical";
  return "";
}

function formatIndex(v: number | undefined) {
  return typeof v === "number" && !Number.isNaN(v) ? v.toFixed(1) : "—";
}

export default function DispatcherView() {
  const { data, isConnected } = useTelemetry();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const rows: TrainRow[] = useMemo(() => {
    const liveId = data?.telemetry.locomotive_id ?? "—";
    return [
      {
        id: liveId,
        label: liveId === "—" ? "Поезд (ожидание)" : `Поезд ${liveId}`,
        snapshot: data,
      },
      {
        id: "pending-2",
        label: "Резервный состав (нет потока)",
        snapshot: null,
      },
    ];
  }, [data]);

  const effectiveSelected = selectedId ?? rows[0]?.id ?? null;
  const selectedRow = rows.find((r) => r.id === effectiveSelected) ?? rows[0];
  const display = selectedRow?.snapshot;

  const telemetry = display?.telemetry;
  const health = display?.health;

  const alertHistory = telemetry?.alerts ?? [];

  return (
    <div className="dispatch-page">
      <header className="dispatch-header">
        <div className="dispatch-header-row">
          <div>
            <h2 className="dispatch-title">Диспетчерский контроль</h2>
            <p className="dispatch-sub">Список составов и детальный срез выбранного поезда</p>
          </div>
          <button
            type="button"
            className="btn btn-primary dispatch-export-btn"
            onClick={() => downloadDispatchSummaryCsv(rows, isConnected)}
            title="Скачать сводку по строкам таблицы составов"
          >
            <FileDown size={18} aria-hidden />
            Экспорт сводки
          </button>
        </div>
      </header>

      <div className="dispatch-layout">
        <section className="panel train-list-panel" aria-label="Список поездов">
          <h3 className="title">Поезда</h3>
          <table className="train-table">
            <thead>
              <tr>
                <th>Состав</th>
                <th>Связь</th>
                <th>Индекс</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const snap = row.snapshot;
                const cat = snap?.health.status_category;
                const idx = snap?.health.global_index;
                const liveRow = row.snapshot !== null;
                return (
                  <tr
                    key={row.id}
                    className={effectiveSelected === row.id ? "selected" : ""}
                    onClick={() => setSelectedId(row.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedId(row.id);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-current={effectiveSelected === row.id ? "true" : undefined}
                  >
                    <td>{row.label}</td>
                    <td>
                      {liveRow ? (
                        <span className={isConnected ? "status-badge status-normal" : "status-badge status-critical"}>
                          {isConnected ? "Онлайн" : "Нет канала"}
                        </span>
                      ) : (
                        <span className="status-badge" style={{ background: "var(--border)", color: "var(--text-muted)" }}>
                          Нет данных
                        </span>
                      )}
                    </td>
                    <td>{formatIndex(idx)}</td>
                    <td>
                      {cat ? (
                        <span className={`status-badge ${categoryClass(cat)}`}>{cat}</span>
                      ) : (
                        <span className="status-badge" style={{ background: "var(--border)", color: "var(--text-muted)" }}>
                          —
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        <section className="dispatch-detail">
          {!display ? (
            <div className="panel">
              <p className="panel-hint">Выберите состав с активным потоком телеметрии или дождитесь симулятора.</p>
            </div>
          ) : (
            <div className="dispatch-grid">
              <HealthIndexWidget
                globalIndex={health?.global_index}
                category={health?.status_category}
                topFactors={health?.top_factors}
              />
              <SpeedPanel speed={telemetry?.speed} acceleration={telemetry?.acceleration} />
              <AlertsPanel alerts={alertHistory} />
              <EnergyPanel fuelLevel={telemetry?.fuel_level} energyConsumption={telemetry?.energy_consumption} />
              <PressureTempPanel
                oilTemperature={telemetry?.oil_temperature}
                oilPressure={telemetry?.oil_pressure}
                coolantTemperature={telemetry?.coolant_temperature}
                brakePipePressure={telemetry?.brake_pipe_pressure}
                brakeCylinderPressure={telemetry?.brake_cylinder_pressure}
              />
              <ElectricPanel
                tractionCurrent={telemetry?.traction_current}
                tractionVoltage={telemetry?.traction_voltage}
                engineRpm={telemetry?.engine_rpm}
              />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
