import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

const STORAGE_KEY = "dashboard.sound.enabled";

/** Tovushli bildirishnoma toggle. localStorage'da saqlanadi.
 *  Boshqa joyda `playBeep()` chaqirilsa, agar yoqilgan bo'lsa beep chiqaradi. */
export function SoundToggle() {
  const [enabled, setEnabled] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEY) === "1";
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, enabled ? "1" : "0");
    window.dispatchEvent(new CustomEvent("dashboard:sound", { detail: { enabled } }));
  }, [enabled]);

  return (
    <button
      onClick={() => setEnabled(v => !v)}
      title={enabled ? "Tovushni o'chirish" : "Tovushni yoqish"}
      className={`h-9 w-9 rounded-full flex items-center justify-center transition-colors ${
        enabled
          ? "bg-emerald-500 text-white hover:bg-emerald-600"
          : "bg-muted text-muted-foreground hover:bg-muted/80"
      }`}
    >
      {enabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
    </button>
  );
}

let audioCtx: AudioContext | null = null;

/** Yumshoq beep chiqarish — yangi event uchun. Toggle yoqilgan bo'lsa ishlaydi. */
export function playBeep(direction: "IN" | "OUT" | "UNKNOWN" = "IN") {
  if (localStorage.getItem(STORAGE_KEY) !== "1") return;
  try {
    if (!audioCtx) {
      const Ctor: typeof AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
      audioCtx = new Ctor();
    }
    if (audioCtx.state === "suspended") audioCtx.resume();

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.value = direction === "IN" ? 880 : 660;  // yuqori / past
    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.06, audioCtx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.18);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
  } catch {
    /* browser may block — silently ignore */
  }
}
