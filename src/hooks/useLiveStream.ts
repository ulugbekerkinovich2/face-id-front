import { useEffect, useRef } from "react";

const API_BASE = import.meta.env.VITE_API_URL as string;

function wsUrlBase(): string {
  // VITE_API_URL = 'https://face-id-admin.misterdev.uz/api' → wss://.../ws/live/
  const u = new URL(API_BASE);
  const wsScheme = u.protocol === "https:" ? "wss:" : "ws:";
  return `${wsScheme}//${u.host}/ws/live/`;
}

async function fetchTicket(): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/auth/ws-ticket/`, { credentials: "include" });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.ticket ?? null;
  } catch {
    return null;
  }
}

export interface LiveEvent<T = any> {
  type: "event";
  channel: string;
  data: T;
}

/**
 * WebSocket orqali real-time stream. Auto qayta-ulanish bilan
 * (exponential backoff, max 10s).
 *
 * Auth: backend HttpOnly cookie sxemasi ishlatadi → JS token ololmaydi.
 * Shu sabab har ulanishdan oldin `/api/auth/ws-ticket/` chaqirib ticket
 * olamiz va WS query string'iga qo'yamiz.
 */
export function useLiveStream<T = any>(
  channels: string[],
  onEvent: (event: LiveEvent<T>) => void,
) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;
  const channelsKey = channels.join(",");

  useEffect(() => {
    if (!channels.length) {
      console.warn("[ws] no channels, skipping connection");
      return;
    }

    let ws: WebSocket | null = null;
    let reconnectTid: number | null = null;
    let pingTid: number | null = null;
    let attempt = 0;
    let stopped = false;

    const connect = async () => {
      if (stopped) return;
      const ticket = await fetchTicket();
      if (stopped) return;
      if (!ticket) {
        console.warn("[ws] no ws-ticket (likely not signed in), retrying later");
        scheduleReconnect();
        return;
      }
      const url = `${wsUrlBase()}?token=${encodeURIComponent(ticket)}&channels=${channelsKey}`;
      console.info("[ws] connecting", url.replace(/token=[^&]+/, "token=***"));

      try {
        ws = new WebSocket(url);
      } catch {
        scheduleReconnect();
        return;
      }

      ws.onopen = () => {
        console.info("[ws] connected");
        attempt = 0;
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

      ws.onclose = (e) => {
        console.warn("[ws] closed", { code: e.code, reason: e.reason });
        if (pingTid) { clearInterval(pingTid); pingTid = null; }
        scheduleReconnect();
      };

      ws.onerror = () => { console.warn("[ws] error"); };
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
