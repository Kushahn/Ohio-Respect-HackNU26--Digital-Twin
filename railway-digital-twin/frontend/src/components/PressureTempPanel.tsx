interface PressureTempPanelProps {
  oilTemperature?: number;
  oilPressure?: number;
  coolantTemperature?: number;
  brakePipePressure?: number;
  brakeCylinderPressure?: number;
}

function fmt(n: number | undefined, digits: number, suffix: string) {
  const v = typeof n === "number" && !Number.isNaN(n) ? n.toFixed(digits) : "—";
  return `${v}${suffix}`;
}

export default function PressureTempPanel({
  oilTemperature,
  oilPressure,
  coolantTemperature,
  brakePipePressure,
  brakeCylinderPressure,
}: PressureTempPanelProps) {
  return (
    <div className="panel">
      <h3 className="title">Температуры и давления</h3>
      <ul className="metric-list">
        <li>
          <span className="metric-label">Масло (темп.)</span>
          <span className="metric-value">{fmt(oilTemperature, 1, " °C")}</span>
        </li>
        <li>
          <span className="metric-label">Масло (давл.)</span>
          <span className="metric-value">{fmt(oilPressure, 2, " бар")}</span>
        </li>
        <li>
          <span className="metric-label">Охлаждающая жидкость</span>
          <span className="metric-value">{fmt(coolantTemperature, 1, " °C")}</span>
        </li>
        <li>
          <span className="metric-label">Тормозная магистраль</span>
          <span className="metric-value">{fmt(brakePipePressure, 2, " бар")}</span>
        </li>
        <li>
          <span className="metric-label">Тормозной цилиндр</span>
          <span className="metric-value">{fmt(brakeCylinderPressure, 2, " бар")}</span>
        </li>
      </ul>
    </div>
  );
}
