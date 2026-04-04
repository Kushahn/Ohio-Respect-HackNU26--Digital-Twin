import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getHistory } from "../api/history";
import HealthIndexWidget from "../components/HealthIndexWidget";
import SpeedPanel from "../components/SpeedPanel";
import AlertsPanel from "../components/AlertsPanel";
import EnergyPanel from "../components/EnergyPanel";
import PressureTempPanel from "../components/PressureTempPanel";
import ElectricPanel from "../components/ElectricPanel";
import TrendsPanel from "../components/TrendsPanel";
import MapPanel from "../components/MapPanel";
import ReplayControls from "../components/ReplayControls";
import { useTelemetry } from "../contexts/TelemetryContext";
import { filterPointsByWindow, useSampleBuffer } from "../hooks/useSampleBuffer";
import { usePositionKm } from "../hooks/usePositionKm";
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
  const { data, isConnected, isReconnecting } = useTelemetry();

  const [trendWindow, setTrendWindow] = useState<TrendWindowMinutes>(10);
  const [replayWindow, setReplayWindow] = useState<TrendWindowMinutes>(10);
  const [replayFrames, setReplayFrames] = useState<TelemetryResponse[] | null>(null);
  const [replayIndex, setReplayIndex] = useState(0);
  const [isReplayActive, setIsReplayActive] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
