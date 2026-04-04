/** Упрощённая схема участка: условный путь и положение состава. */
interface MapPanelProps {
  /** Накопленный путь, км (оценка по интегрированию скорости). */
  positionKm: number;
}

const VIRTUAL_TRACK_KM = 48;

export default function MapPanel({ positionKm }: MapPanelProps) {
  const along = ((positionKm % VIRTUAL_TRACK_KM) + VIRTUAL_TRACK_KM) % VIRTUAL_TRACK_KM;
  const pct = (along / VIRTUAL_TRACK_KM) * 100;

  return (
    <div className="panel map-panel">
      <h3 className="title">Схема пути</h3>
      <p className="panel-hint">
        Участок демо: {VIRTUAL_TRACK_KM} км. Красные зоны — снижение скорости; синяя метка — оценка положения по скорости.
      </p>
      <div className="map-svg-wrap">
        <svg viewBox="0 0 400 120" className="map-svg" aria-label="Схема пути">
          <defs>
            <linearGradient id="trackGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--border)" />
              <stop offset="100%" stopColor="var(--text-muted)" />
            </linearGradient>
          </defs>
          <rect x="20" y="52" width="360" height="10" rx="4" fill="url(#trackGrad)" opacity={0.85} />
          <rect x="60" y="48" width="72" height="18" rx="4" fill="rgba(239,68,68,0.25)" stroke="var(--danger)" />
          <rect x="220" y="48" width="90" height="18" rx="4" fill="rgba(239,68,68,0.2)" stroke="var(--danger)" />
          <text x="66" y="61" fill="var(--text-muted)" fontSize="10">
            40 км/ч
          </text>
          <text x="226" y="61" fill="var(--text-muted)" fontSize="10">
            мост 60
          </text>
          <g transform={`translate(${20 + (360 * pct) / 100}, 57)`}>
            <polygon points="0,-14 10,8 -10,8" fill="var(--primary)" stroke="var(--text-main)" strokeWidth="1" />
          </g>
        </svg>
      </div>
      <div className="map-legend">
        <span>Оценка пути: {along.toFixed(2)} км по участку</span>
      </div>
    </div>
  );
}
