import { useEffect, useRef } from "react";

const API_BASE = import.meta.env.VITE_API_URL as string;

function wsUrl(channels: string[], token: string): string {
  // API_BASE 'https://example.com/api' ko'rinishida — ws scheme'ni ajratamiz
  const u = new URL(API_BASE);
  const wsScheme = u.protocol === "https:" ? "wss:" : "ws:";
  // /api'ni olib tashlaymiz, /ws/live/ qo'yamiz
  return `${wsScheme}//${u.host}/ws/live/?token=${encodeURIComponent(token)}&channels=${channels.join(",")}`;
}

export interface LiveEvent<T = any> {
  type: "event";
  channel: string;
  data: T;
}

/**
 * WebSocket orqali real-time stream. Avto qayta-ulanish bilan
 * (exponential backoff, max 10s).
 *
 * @example
 *   useLiveStream(["logs"], (ev) => {
 *     if (ev.channel === "logs") prependLog(ev.data);
 *   });
 */
export function useLiveStream<T = any>(
  channels: string[],
  onEvent: (event: LiveEvent<T>) => void,
) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;
  const channelsKey = channels.join(",");

  useEffect(() => {
    if (!channels.length) return;
    const token = localStorage.getItem("authToken");
    if (!token) return;

    let ws: WebSocket | null = null;
    let reconnectTid: number | null = null;
    let pingTid: number | null = null;
    let attempt = 0;
    let stopped = false;

    const connect = () => {
      if (stopped) return;
      try {
        ws = new WebSocket(wsUrl(channels, token));
      } catch {
        scheduleReconnect();
        return;
      }

      ws.onopen = () => {
        attempt = 0;
        // Keep-alive — 25s ping
        pingTid = window.setInterval(() => {
          ws?.readyState === WebSocket.OPEN && ws.send(JSON.stringify({ type: "ping" }));
        }, 25_000);
      };

      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          if (msg?.type === "event") {
            onEventRef.current(msg as LiveEvent<T>);
          }
        } catch {
          /* ignore non-JSON */
        }
      };

      ws.onclose = () => {
        if (pingTid) { clearInterval(pingTid); pingTid = null; }
        scheduleReconnect();
      };

      ws.onerror = () => { /* close handles cleanup */ };
    };

    const scheduleReconnect = () => {
      if (stopped) return;
      attempt++;
      const delay = Math.min(10_000, 500 * 2 ** Math.min(attempt, 5));
      reconnectTid = window.setTimeout(connect, delay);
    };

    connect();

    return () => {
      stopped = true;
      if (reconnectTid) clearTimeout(reconnectTid);
      if (pingTid) clearInterval(pingTid);
      if (ws && ws.readyState <= WebSocket.OPEN) ws.close();
    };
  }, [channelsKey]);
}
