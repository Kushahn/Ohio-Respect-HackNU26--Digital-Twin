import { createContext, useContext, type ReactNode } from "react";
import { useWebSocket } from "../hooks/useWebSocket";
import type { TelemetryResponse } from "../types/telemetry";

export interface TelemetryContextValue {
  data: TelemetryResponse | null;
  isConnected: boolean;
  isReconnecting: boolean;
  /** Число принятых кадров телеметрии за последнюю 1 с (скользящее окно). */
  eventsPerSecond: number;
}

const TelemetryContext = createContext<TelemetryContextValue | null>(null);

function getWsUrl() {
  return import.meta.env.VITE_WS_URL || "ws://localhost:8000/ws/telemetry";
}

export function TelemetryProvider({ children }: { children: ReactNode }) {
  const { data, isConnected, isReconnecting, eventsPerSecond } = useWebSocket(getWsUrl());
  return (
    <TelemetryContext.Provider value={{ data, isConnected, isReconnecting, eventsPerSecond }}>
      {children}
    </TelemetryContext.Provider>
  );
}

export function useTelemetry(): TelemetryContextValue {
  const ctx = useContext(TelemetryContext);
  if (!ctx) {
    throw new Error("useTelemetry must be used within TelemetryProvider");
  }
  return ctx;
}
