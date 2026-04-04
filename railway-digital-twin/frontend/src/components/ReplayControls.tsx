import type { TrendWindowMinutes } from "../types/telemetry";

interface ReplayControlsProps {
  locomotiveId: string;
  windowMinutes: TrendWindowMinutes;
  onWindowMinutes: (m: TrendWindowMinutes) => void;
  onLoad: () => void;
  onTogglePlay: () => void;
  onStop: () => void;
  isReplayActive: boolean;
  isPlaying: boolean;
  loading: boolean;
  error: string | null;
  frameIndex: number;
  frameCount: number;
}

export default function ReplayControls({
  locomotiveId,
  windowMinutes,
  onWindowMinutes,
  onLoad,
  onTogglePlay,
  onStop,
  isReplayActive,
  isPlaying,
  loading,
  error,
  frameIndex,
  frameCount,
}: ReplayControlsProps) {
  return (
    <div className="panel replay-panel">
      <h3 className="title">Повтор (replay)</h3>
      <p className="panel-hint">
        Загрузка с сервера за выбранный интервал. Если истории нет — используйте накопленный буфер после работы симулятора.
      </p>
      <div className="replay-row">
        <label className="replay-label">
          Локомотив
          <input className="replay-input" readOnly value={locomotiveId} />
        </label>
        <label className="replay-label">
          Окно
          <select
            className="replay-select"
            value={windowMinutes}
            onChange={(e) => onWindowMinutes(Number(e.target.value) as TrendWindowMinutes)}
          >
            <option value={5}>5 мин</option>
            <option value={10}>10 мин</option>
            <option value={15}>15 мин</option>
          </select>
        </label>
        <button type="button" className="btn" onClick={onLoad} disabled={loading}>
          {loading ? "Загрузка…" : "Загрузить"}
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={onTogglePlay}
          disabled={!isReplayActive || frameCount < 2}
        >
          {isPlaying ? "Пауза" : "Играть"}
        </button>
        <button type="button" className="btn" onClick={onStop} disabled={!isReplayActive && frameCount === 0}>
          Стоп
        </button>
      </div>
      {isReplayActive && frameCount > 0 && (
        <div className="replay-progress">
          Кадр {frameIndex + 1} / {frameCount}
        </div>
      )}
      {error && <div className="replay-error">{error}</div>}
    </div>
  );
}
