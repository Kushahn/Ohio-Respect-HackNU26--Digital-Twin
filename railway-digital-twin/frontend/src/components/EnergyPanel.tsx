interface EnergyPanelProps {
  fuelLevel?: number;
  energyConsumption?: number;
}

function fmt(n: number | undefined, digits: number, fallback: string) {
  return typeof n === "number" && !Number.isNaN(n) ? n.toFixed(digits) : fallback;
}

export default function EnergyPanel({ fuelLevel, energyConsumption }: EnergyPanelProps) {
  return (
    <div className="panel">
      <h3 className="title">Топливо и энергия</h3>
      <div className="panel-metrics">
        <div>
          <div className="metric-label">Уровень топлива</div>
          <span className="value-large">{fmt(fuelLevel, 1, "—")}</span>
          <span className="unit">%</span>
        </div>
        <div>
          <div className="metric-label">Мгновенная мощность (оценка)</div>
          <span className="value-large" style={{ fontSize: "1.75rem" }}>
            {fmt(energyConsumption, 0, "—")}
          </span>
          <span className="unit">кВт</span>
        </div>
      </div>
      <p className="panel-hint">Для электровоза интерпретируйте блок как энергопотребление тяги; для тепловоза — расход/запас топлива.</p>
    </div>
  );
}
