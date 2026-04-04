interface ElectricPanelProps {
  tractionCurrent?: number;
  tractionVoltage?: number;
  engineRpm?: number;
}

function fmt(n: number | undefined, digits: number, fallback: string) {
  return typeof n === "number" && !Number.isNaN(n) ? n.toFixed(digits) : fallback;
}

export default function ElectricPanel({
  tractionCurrent,
  tractionVoltage,
  engineRpm,
}: ElectricPanelProps) {
  const kv =
    typeof tractionVoltage === "number" && !Number.isNaN(tractionVoltage)
      ? (tractionVoltage / 1000).toFixed(1)
      : "—";

  return (
    <div className="panel">
      <h3 className="title">Электрика / тяга</h3>
      <div className="panel-metrics">
        <div>
          <div className="metric-label">Тяговый ток</div>
          <span className="value-large" style={{ fontSize: "1.85rem" }}>
            {fmt(tractionCurrent, 0, "—")}
          </span>
          <span className="unit">А</span>
        </div>
        <div>
          <div className="metric-label">Напряжение (КС / звено)</div>
          <span className="value-large" style={{ fontSize: "1.85rem" }}>
            {kv}
          </span>
          <span className="unit">кВ</span>
        </div>
        <div>
          <div className="metric-label">Обороты дизеля / аналог</div>
          <span className="value-large" style={{ fontSize: "1.5rem" }}>
            {fmt(engineRpm, 0, "—")}
          </span>
          <span className="unit">об/мин</span>
        </div>
      </div>
    </div>
  );
}
