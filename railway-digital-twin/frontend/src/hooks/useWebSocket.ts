import { useCallback, useEffect, useRef, useState } from "react";
import type { TelemetryResponse } from "../types/telemetry";

const INITIAL_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 30000;

function parsePayload(raw: string): TelemetryResponse | null {
  try {
    const payload = JSON.parse(raw) as TelemetryResponse;
    if (payload?.telemetry && payload?.health) return payload;
  } catch {
    /* ignore */
  }
  return null;
}

const RATE_WINDOW_MS = 1000;

export function useWebSocket(url: string) {
  const [data, setData] = useState<TelemetryResponse | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [eventsPerSecond, setEventsPerSecond] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backoffRef = useRef(INITIAL_BACKOFF_MS);
  const shouldRunRef = useRef(true);
  const messageTimesRef = useRef<number[]>([]);
  const rateTickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current !== null) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    shouldRunRef.current = true;

    const scheduleReconnect = (connectFn: () => void) => {
      clearReconnectTimer();
      const delay = backoffRef.current;
      backoffRef.current = Math.min(MAX_BACKOFF_MS, backoffRef.current * 2);
      setIsReconnecting(true);
      reconnectTimerRef.current = setTimeout(() => {
        reconnectTimerRef.current = null;
        if (shouldRunRef.current) connectFn();
      }, delay);
    };

    const pruneMessageTimes = () => {
      const now = Date.now();
      messageTimesRef.current = messageTimesRef.current.filter((t) => now - t <= RATE_WINDOW_MS);
      setEventsPerSecond(messageTimesRef.current.length);
    };

    if (rateTickRef.current === null) {
      rateTickRef.current = setInterval(pruneMessageTimes, 200);
    }

    const connect = () => {
      clearReconnectTimer();
      try {
        wsRef.current?.close();
      } catch {
        /* ignore */
      }

      messageTimesRef.current = [];
      setEventsPerSecond(0);

      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        backoffRef.current = INITIAL_BACKOFF_MS;
        setIsConnected(true);
        setIsReconnecting(false);
      };

      ws.onclose = () => {
        setIsConnected(false);
        wsRef.current = null;
        if (!shouldRunRef.current) return;
        scheduleReconnect(connect);
      };

      ws.onerror = () => {
        ws.close();
      };

      ws.onmessage = (event) => {
        const parsed = parsePayload(event.data as string);
        if (parsed) {
          const now = Date.now();
          messageTimesRef.current.push(now);
          messageTimesRef.current = messageTimesRef.current.filter((t) => now - t <= RATE_WINDOW_MS);
          setEventsPerSecond(messageTimesRef.current.length);
          setData(parsed);
        }
      };
    };

    connect();

    return () => {
      shouldRunRef.current = false;
      clearReconnectTimer();
      setIsReconnecting(false);
      if (rateTickRef.current !== null) {
        clearInterval(rateTickRef.current);
        rateTickRef.current = null;
      }
      try {
        wsRef.current?.close();
      } catch {
        /* ignore */
      }
      wsRef.current = null;
    };
  }, [url, clearReconnectTimer]);

  return { data, isConnected, isReconnecting, eventsPerSecond };
}
