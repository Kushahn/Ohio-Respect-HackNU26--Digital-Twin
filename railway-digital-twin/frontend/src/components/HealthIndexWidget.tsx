interface HealthIndexWidgetProps {
  globalIndex?: number;
  category?: string;
  topFactors?: Record<string, number>;
}

export default function HealthIndexWidget({
  globalIndex,
  category = "Нет данных",
  topFactors = {},
}: HealthIndexWidgetProps) {
  let statusClass = "status-normal";
  let color = "var(--success)";
  if (category === "Внимание") {
    statusClass = "status-warning";
    color = "var(--warning)";
  } else if (category === "Опасно") {
    statusClass = "status-critical";
    color = "var(--danger)";
  }

  const idxValue =
    typeof globalIndex === "number" && !Number.isNaN(globalIndex) ? globalIndex.toFixed(1) : "—";

  const topEntries = Object.entries(topFactors)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="panel health-widget" style={{ borderLeft: `6px solid ${color}` }}>
      <h3 className="title">Индекс состояния локомотива</h3>
      <div style={{ display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap" }}>
        <div>
          <span className="value-large" style={{ color }}>
            {idxValue}
          </span>
          <span className="unit">/ 100</span>
        </div>
        <span className={`status-badge ${statusClass}`} style={{ fontSize: "1rem", padding: "8px 16px" }}>
          {category}
        </span>
      </div>
      <p className="panel-hint" style={{ marginTop: "12px" }}>
        Детерминированный индекс по подсистемам (двигатель/тяга, тормоза, электрика, энергия, диагностика). Не
        заменяет регламентные проверки.
      </p>
      {topEntries.length > 0 && (
        <div className="top-factors">
          <div className="top-factors-title">Основные факторы снижения</div>
          <ol className="top-factors-list">
            {topEntries.map(([name, val]) => (
              <li key={name}>
                <span>{name}</span>
                <span className="top-factors-pen">{val.toFixed(1)} б.</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
