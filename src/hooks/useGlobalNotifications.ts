import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useLiveStream } from "./useLiveStream";

interface AppEvent {
  type: string;
  actor?: string;
  role?: string;
  title: string;
  message?: string;
  severity?: "info" | "success" | "warning" | "error";
  time?: string;
}

interface LogPayload {
  id: number;
  name: string;
  full_name?: string;
  direction: "IN" | "OUT" | "UNKNOWN";
  image?: string;
  time?: string;
}

interface StrangerPayload {
  id: number;
  device_id?: number;
  image?: string;
  create_time?: string;
}

/**
 * Sayt bo'yicha global real-time notification'lar.
 * Layout darajasida bir marta mount qilinadi — barcha sahifalarda ishlaydi.
 *
 * Tinglaydigan kanallar:
 *   logs       — har kirish/chiqish (toast yashil/qizil)
 *   strangers  — notanish yuz aniqlandi (toast amber)
 *   events     — admin event'lari (login, block, migration; toast severity bo'yicha)
 */
export function useGlobalNotifications() {
  // Duplicate suppression — bir xil id'li event ikki marta tushmasin
  const seenRef = useRef<Set<string>>(new Set());

  const remember = (key: string) => {
    if (seenRef.current.has(key)) return false;
    seenRef.current.add(key);
    if (seenRef.current.size > 200) {
      // Eski ID'larni unutamiz — xotira oshib ketmasin
      const arr = Array.from(seenRef.current);
      seenRef.current = new Set(arr.slice(-100));
    }
    return true;
  };

  useLiveStream<LogPayload | StrangerPayload | AppEvent>(
    ["logs", "strangers", "events"],
    (ev) => {
      const channel = ev.channel;
      const data = ev.data as any;

      if (channel === "logs") {
        const id = `log-${data.id}`;
        if (!remember(id)) return;
        const isIn = data.direction === "IN";
        const name = data.full_name || data.name || "Noma'lum";
        const fn = isIn ? toast.success : toast.error;
        fn(`${isIn ? "→ Kirdi" : "← Chiqdi"}: ${name}`, {
          id, description: data.time
            ? new Date(data.time).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
            : undefined,
          duration: 3500,
        });
        return;
      }

      if (channel === "strangers") {
        const id = `stranger-${data.id}`;
        if (!remember(id)) return;
        toast.warning("Notanish yuz aniqlandi", {
          id, description: data.device_id ? `Qurilma: ${data.device_id}` : undefined,
          duration: 5000,
        });
        return;
      }

      if (channel === "events") {
        const ev = data as AppEvent;
        const id = `${ev.type}-${ev.time ?? Date.now()}-${ev.actor ?? ""}`;
        if (!remember(id)) return;
        const fn =
          ev.severity === "success" ? toast.success :
          ev.severity === "warning" ? toast.warning :
          ev.severity === "error" ? toast.error :
          toast.info;
        fn(ev.title, {
          id,
          description: ev.message,
          duration: 5500,
        });
        return;
      }
    },
  );
}
