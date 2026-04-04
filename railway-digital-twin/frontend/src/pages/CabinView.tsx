import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FileDown, Zap } from "lucide-react";
import { getHistory } from "../api/history";
import CabinReportPdfSource, { type CabinReportPdfPayload } from "../components/CabinReportPdfSource";
import HealthIndexWidget from "../components/HealthIndexWidget";
import SpeedPanel from "../components/SpeedPanel";
import AlertsPanel from "../components/AlertsPanel";
import EnergyPanel from "../components/EnergyPanel";
import PressureTempPanel from "../components/PressureTempPanel";
import ElectricPanel from "../components/ElectricPanel";
import TrendsPanel from "../components/TrendsPanel";
import MapPanel from "../components/MapPanel";
import ReplayControls from "../components/ReplayControls";
import { toggleSimulatorMode } from "../api/simulatorMode";
import { useTelemetry } from "../contexts/TelemetryContext";
import { filterPointsByWindow, useSampleBuffer } from "../hooks/useSampleBuffer";
import { usePositionKm } from "../hooks/usePositionKm";
import { saveHealthReportPdf } from "../utils/healthReportPdf";
import {
  downloadTextFile,
  formatExportStamp,
  loadFramesLast15Minutes,
  telemetryFramesToCsv,
} from "../utils/reportExport";
import type { TelemetryResponse, TrendPoint, TrendWindowMinutes } from "../types/telemetry";

function toTrendPoint(f: TelemetryResponse): TrendPoint {
  const raw = f.telemetry.timestamp;
  const t = raw ? Date.parse(raw.replace("Z", "+00:00")) : NaN;
  return {
    t: Number.isFinite(t) ? t : Date.now(),
    speed: f.telemetry.speed,
    traction_current: f.telemetry.traction_current,
    oil_temperature: f.telemetry.oil_temperature,
  };
}

const DEFAULT_LOCO = "KZ8A-0001";

export default function CabinView() {
  const { data, isConnected, isReconnecting, eventsPerSecond } = useTelemetry();

  const [trendWindow, setTrendWindow] = useState<TrendWindowMinutes>(10);
  const [replayWindow, setReplayWindow] = useState<TrendWindowMinutes>(10);
  const [replayFrames, setReplayFrames] = useState<TelemetryResponse[] | null>(null);
  const [replayIndex, setReplayIndex] = useState(0);
  const [isReplayActive, setIsReplayActive] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [pdfPayload, setPdfPayload] = useState<CabinReportPdfPayload | null>(null);
  const [loadTogglePending, setLoadTogglePending] = useState(false);

  const pdfSourceRef = useRef<HTMLDivElement>(null);
  const localArchiveRef = useRef<TelemetryResponse[]>([]);
  useEffect(() => {
    if (!data) return;
    const a = localArchiveRef.current;
    a.push(data);
    if (a.length > 4000) a.splice(0, a.length - 4000);
  }, [data]);

  const livePoints = useSampleBuffer(isReplayActive ? null : data, trendWindow);

  const replayPoints = useMemo(() => {
    if (!replayFrames?.length) return [];
    return replayFrames.map(toTrendPoint);
  }, [replayFrames]);

  const chartPoints = useMemo(() => {
    if (isReplayActive && replayPoints.length) {
      return filterPointsByWindow(replayPoints, trendWindow);
    }
    return livePoints;
  }, [isReplayActive, replayPoints, livePoints, trendWindow]);

  const displayData: TelemetryResponse | null = useMemo(() => {
    if (isReplayActive && replayFrames?.length) {
      const i = Math.min(replayIndex, replayFrames.length - 1);
      return replayFrames[i] ?? null;
    }
    return data;
  }, [isReplayActive, replayFrames, replayIndex, data]);

  const telemetry = displayData?.telemetry;
  const health = displayData?.health;

  const positionKm = usePositionKm(telemetry?.speed, telemetry?.timestamp);

  useEffect(() => {
    if (!isPlaying || !isReplayActive || !replayFrames?.length) return;
    const id = window.setInterval(() => {
      setReplayIndex((i) => {
        if (i >= replayFrames.length - 1) return 0;
        return i + 1;
      });
    }, 280);
    return () => window.clearInterval(id);
  }, [isPlaying, isReplayActive, replayFrames]);

  const locoId = data?.telemetry.locomotive_id ?? telemetry?.locomotive_id ?? DEFAULT_LOCO;

  const liveHighload = data?.simulator_mode === "HIGHLOAD";

  const handleToggleHighload = useCallback(async () => {
    setLoadTogglePending(true);
    try {
      await toggleSimulatorMode();
    } catch (e) {
      console.error(e);
      window.alert(
        "Не удалось переключить режим симулятора. Нужен запущенный backend и симулятор с доступом к API (API_BASE_URL)."
      );
    } finally {
      setLoadTogglePending(false);
    }
  }, []);

  const handleLoad = useCallback(async () => {
    setLoadError(null);
    setLoading(true);
    const to = new Date();
    const from = new Date(to.getTime() - replayWindow * 60 * 1000);
    try {
      const res = await getHistory(locoId, from, to);
      let frames = res.data;
      if (!frames.length) {
        frames = [...localArchiveRef.current];
        if (!frames.length) {
          setLoadError("Нет данных за период. Запустите симулятор телеметрии.");
          setLoading(false);
          return;
        }
        setLoadError("Сервер вернул пустую историю — показан локальный буфер браузера.");
      }
      setReplayFrames(frames);
      setReplayIndex(0);
      setIsReplayActive(true);
      setIsPlaying(false);
    } catch (e) {
      const fb = [...localArchiveRef.current];
      if (fb.length) {
        setReplayFrames(fb);
        setReplayIndex(0);
        setIsReplayActive(true);
        setIsPlaying(false);
        setLoadError(
          e instanceof Error
            ? `${e.message} — показан локальный буфер.`
            : "Ошибка сети — показан локальный буфер."
        );
      } else {
        setLoadError(e instanceof Error ? e.message : "Ошибка загрузки истории.");
      }
    } finally {
      setLoading(false);
    }
  }, [locoId, replayWindow]);

  const handleStop = useCallback(() => {
    setIsReplayActive(false);
    setIsPlaying(false);
    setReplayFrames(null);
    setReplayIndex(0);
    setLoadError(null);
  }, []);

  useEffect(() => {
    if (!pdfPayload) return;
    const run = async () => {
      await new Promise<void>((r) => requestAnimationFrame(() => r()));
      const el = pdfSourceRef.current;
      if (!el) {
        setPdfPayload(null);
        setExporting(false);
        return;
      }
      const stamp = formatExportStamp(pdfPayload.exportTime);
      const safeLoco = pdfPayload.telemetry.locomotive_id.replace(/[^\w.-]+/g, "_");
      try {
        await saveHealthReportPdf(el, `health-report-${safeLoco}-${stamp}.pdf`);
      } catch (e) {
        console.error(e);
        window.alert("Не удалось сформировать PDF. Проверьте консоль браузера.");
      } finally {
        setPdfPayload(null);
        setExporting(false);
      }
    };
    void run();
  }, [pdfPayload]);

  const handleExportReport = useCallback(async () => {
    setExporting(true);
    try {
      const frames = await loadFramesLast15Minutes(locoId, localArchiveRef.current);
      if (!frames.length) {
        window.alert(
          "Нет данных телеметрии за последние 15 минут. Запустите симулятор или дождитесь накопления буфера."
        );
        setExporting(false);
        return;
      }
      const stamp = formatExportStamp(new Date());
      const safeLoco = locoId.replace(/[^\w.-]+/g, "_");
      const csv = telemetryFramesToCsv(frames);
      downloadTextFile(`telemetry-${safeLoco}-15m-${stamp}.csv`, csv, "text/csv;charset=utf-8");

      const last = frames[frames.length - 1];
      setPdfPayload({
        telemetry: last.telemetry,
        health: last.health,
        exportTime: new Date(),
        rowCount: frames.length,
      });
    } catch (e) {
      console.error(e);
      window.alert("Ошибка при подготовке отчёта.");
      setExporting(false);
    }
  }, [locoId]);

  return (
    <div className="cabin-page">
      {!isConnected && (
        <div className="banner-offline" role="status">
          {isReconnecting
            ? "Восстановление канала телеметрии…"
            : "Нет связи с сервером. Проверьте backend и адрес WebSocket."}
        </div>
      )}
      {isConnected && !data && (
        <div className="banner-wait" role="status">
          Ожидание телеметрии… Убедитесь, что запущен симулятор (<code>python -m app.simulator.simulator</code>).
        </div>
      )}

      <div className="cabin-toolbar cabin-toolbar-split">
        <div className="cabin-toolbar-group">
          <button
            type="button"
            className="btn btn-primary cabin-export-btn"
            onClick={() => void handleExportReport()}
            disabled={exporting}
            title="Скачать CSV за 15 минут и PDF с индексом состояния"
          >
            <FileDown size={18} aria-hidden />
            {exporting ? "Формирование…" : "Экспорт отчёта"}
          </button>
          <span className="cabin-toolbar-hint">CSV: телеметрия 15 мин · PDF: индекс, топ‑5 факторов, алерты</span>
        </div>
        <div className="cabin-toolbar-group cabin-load-controls" aria-label="Режим нагрузки симулятора">
          {liveHighload && (
            <span className="highload-pill" title="Симулятор шлёт ~10 кадров/с">
              НАГРУЗКА ×10
            </span>
          )}
          <span
            className="eps-counter"
            title="Скользящее окно 1 с: сколько кадров телеметрии пришло по WebSocket"
          >
            Событий/с: <strong>{eventsPerSecond}</strong>
          </span>
          <button
            type="button"
            className={`btn cabin-load-toggle ${liveHighload ? "btn-active-load" : ""}`}
            onClick={() => void handleToggleHighload()}
            disabled={loadTogglePending}
            title="Переключает частоту симулятора между ~1 Гц и ~10 Гц (нужен процесс симулятора с опросом API)"
          >
            <Zap size={18} aria-hidden />
            {loadTogglePending
              ? "Переключение…"
              : liveHighload
                ? "Обычная нагрузка (1 Гц)"
                : "Нагрузка ×10 (10 Гц)"}
          </button>
        </div>
      </div>

      {pdfPayload && <CabinReportPdfSource ref={pdfSourceRef} payload={pdfPayload} />}

      <div className="cabin-grid">
        <div className="cabin-health">
          <HealthIndexWidget
            globalIndex={health?.global_index}
            category={health?.status_category}
            topFactors={health?.top_factors}
          />
        </div>
        <div className="cabin-speed">
          <SpeedPanel speed={telemetry?.speed} acceleration={telemetry?.acceleration} />
        </div>
        <div className="cabin-alerts">
          <AlertsPanel alerts={telemetry?.alerts ?? []} />
        </div>

        <div className="cabin-energy">
          <EnergyPanel fuelLevel={telemetry?.fuel_level} energyConsumption={telemetry?.energy_consumption} />
        </div>
        <div className="cabin-pressure">
        <PressureTempPanel
          oilTemperature={telemetry?.oil_temperature}
          oilPressure={telemetry?.oil_pressure}
          coolantTemperature={telemetry?.coolant_temperature}
          brakePipePressure={telemetry?.brake_pipe_pressure}
          brakeCylinderPressure={telemetry?.brake_cylinder_pressure}
        />
        </div>
        <div className="cabin-electric">
        <ElectricPanel
          tractionCurrent={telemetry?.traction_current}
          tractionVoltage={telemetry?.traction_voltage}
          engineRpm={telemetry?.engine_rpm}
        />
        </div>

        <div className="span-wide">
          <TrendsPanel points={chartPoints} windowMinutes={trendWindow} onWindowChange={setTrendWindow} />
        </div>

        <div className="span-half">
          <MapPanel positionKm={positionKm} />
        </div>
        <div className="span-half">
          <ReplayControls
            locomotiveId={locoId}
            windowMinutes={replayWindow}
            onWindowMinutes={setReplayWindow}
            onLoad={handleLoad}
            onTogglePlay={() => setIsPlaying((p) => !p)}
            onStop={handleStop}
            isReplayActive={isReplayActive}
            isPlaying={isPlaying}
            loading={loading}
            error={loadError}
            frameIndex={replayIndex}
            frameCount={replayFrames?.length ?? 0}
          />
        </div>
      </div>
    </div>
  );
}
