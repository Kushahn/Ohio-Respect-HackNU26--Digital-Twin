interface SpeedPanelProps {
  speed?: number;
  acceleration?: number;
}

export default function SpeedPanel({ speed, acceleration }: SpeedPanelProps) {
  const spd = typeof speed === "number" && !Number.isNaN(speed) ? speed.toFixed(1) : "—";
  const acc =
    typeof acceleration === "number" && !Number.isNaN(acceleration) ? acceleration.toFixed(2) : "—";

  return (
    <div className="panel">
      <h3 className="title">Движение</h3>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'auto', marginBottom: 'auto' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="value-large">{spd}</div>
          <div className="unit">км/ч</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div
            className="value-large"
            style={{
              fontSize: "1.8rem",
              marginTop: "12px",
              color:
                typeof acceleration === "number" && acceleration > 0
                  ? "var(--success)"
                  : typeof acceleration === "number" && acceleration < 0
                    ? "var(--warning)"
                    : "var(--text-main)",
            }}
          >
            {typeof acceleration === "number" && acceleration > 0 ? "+" : ""}
            {acc}
          </div>
          <div className="unit">м/с²</div>
        </div>
      </div>
    </div>
  );
}
