import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TrendPoint, TrendWindowMinutes } from "../types/telemetry";

interface TrendsPanelProps {
  points: TrendPoint[];
  windowMinutes: TrendWindowMinutes;
  onWindowChange: (w: TrendWindowMinutes) => void;
}

function formatTime(ms: number) {
  return new Date(ms).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function TrendsPanel({
  points,
  windowMinutes,
  onWindowChange,
}: TrendsPanelProps) {
  const data = points.map((p) => ({
    ...p,
    timeLabel: formatTime(p.t),
  }));

  return (
    <div className="panel trends-panel">
      <div className="trends-header">
        <h3 className="title" style={{ marginBottom: 0 }}>
          Тренды
        </h3>
        <div className="segmented" role="group" aria-label="Окно графика">
          {([5, 10, 15] as const).map((m) => (
            <button
              key={m}
              type="button"
              className={windowMinutes === m ? "active" : ""}
              onClick={() => onWindowChange(m)}
            >
              {m} мин
            </button>
          ))}
        </div>
      </div>
      {data.length < 2 ? (
        <p className="panel-hint">Накопление данных для графика… Запустите симулятор телеметрии.</p>
      ) : (
        <div className="trends-chart-wrap">
          <ResponsiveContainer width="100%" height="100%" minHeight={220}>
            <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.6} />
              <XAxis
                dataKey="t"
                type="number"
                domain={["dataMin", "dataMax"]}
                tickFormatter={(v) => formatTime(v as number)}
                stroke="var(--text-muted)"
                fontSize={11}
                tickLine={false}
              />
              <YAxis yAxisId="left" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="var(--text-muted)"
                fontSize={11}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--bg-panel)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                }}
                labelFormatter={(_, payload) => {
                  const row = payload?.[0]?.payload as { t?: number } | undefined;
                  return row?.t ? formatTime(row.t) : "";
                }}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="speed"
                name="Скорость (км/ч)"
                stroke="var(--primary)"
                dot={false}
                strokeWidth={2}
                isAnimationActive={false}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="traction_current"
                name="Ток (А)"
                stroke="var(--warning)"
                dot={false}
                strokeWidth={2}
                isAnimationActive={false}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="oil_temperature"
                name="Т масла (°C)"
                stroke="var(--danger)"
                dot={false}
                strokeWidth={2}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
