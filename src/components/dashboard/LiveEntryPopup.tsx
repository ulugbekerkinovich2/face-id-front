import { useEffect, useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine, User, X } from "lucide-react";

interface EntryEvent {
  id: number;
  name: string;
  full_name?: string;
  direction: "IN" | "OUT" | "UNKNOWN";
  image?: string;
  time?: string;
  face_id?: number;
}

const DOOR: Record<number, string> = {
  2489019: "1-eshik", 2489007: "2-eshik", 2489005: "3-eshik",
  2488986: "4-eshik", 2489002: "5-eshik", 2489012: "6-eshik",
  2488993: "7-eshik", 2488999: "8-eshik",
};

function initials(s: string) {
  return s.split(" ").slice(0, 2).map(w => w[0] ?? "").join("").toUpperCase();
}

/**
 * Markazda chiroyli glassmorphism overlay — yangi event kelganda
 * 3.5 sekund ekranda turadi, so'ng o'zi yopiladi.
 */
export function LiveEntryPopup({ event, onClose }: { event: EntryEvent | null; onClose: () => void }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!event) return;
    setShow(true);
    const t = setTimeout(() => {
      setShow(false);
      setTimeout(onClose, 300); // exit anim ga vaqt
    }, 3500);
    return () => clearTimeout(t);
  }, [event, onClose]);

  if (!event) return null;
  const isIn = event.direction === "IN";
  const accent = isIn ? "emerald" : "rose";
  const display = event.full_name || event.name || "Noma'lum";

  return (
    <div
      className={`fixed top-20 left-1/2 -translate-x-1/2 z-40 transition-all duration-300 ${
        show ? "opacity-100 translate-y-0 scale-100" : "opacity-0 -translate-y-4 scale-95 pointer-events-none"
      }`}
    >
      <div className={`flex items-center gap-4 p-4 pr-6 rounded-3xl shadow-2xl backdrop-blur-2xl bg-white/85 border-2 border-${accent}-200 relative overflow-hidden`}>
        {/* halqa glow */}
        <div className={`absolute inset-0 rounded-3xl pointer-events-none`}
             style={{ boxShadow: `0 0 60px -10px var(--tw-shadow-${accent === "emerald" ? "emerald-500" : "rose-500"})`, opacity: 0.5 }} />

        <button
          onClick={() => { setShow(false); setTimeout(onClose, 300); }}
          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center"
        >
          <X className="w-3 h-3" />
        </button>

        <div className="relative flex-shrink-0">
          {event.image ? (
            <img src={event.image} alt="" className={`w-16 h-16 rounded-2xl object-cover ring-4 ring-${accent}-200 shadow-lg`} />
          ) : (
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white font-extrabold text-lg shadow-lg ${
              isIn ? "bg-gradient-to-br from-emerald-400 to-teal-500" : "bg-gradient-to-br from-rose-400 to-pink-500"
            }`}>
              {event.name ? initials(event.name) : <User className="w-7 h-7" />}
            </div>
          )}
          <span className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center text-white shadow ring-4 ring-white ${
            isIn ? "bg-emerald-500" : "bg-rose-500"
          }`}>
            {isIn ? <ArrowDownToLine className="w-3.5 h-3.5" /> : <ArrowUpFromLine className="w-3.5 h-3.5" />}
          </span>
        </div>

        <div className="min-w-0">
          <p className={`text-[10px] font-extrabold uppercase tracking-widest ${
            isIn ? "text-emerald-600" : "text-rose-600"
          }`}>
            {isIn ? "↓ HOZIR KIRDI" : "↑ HOZIR CHIQDI"}
          </p>
          <p className="text-[16px] font-extrabold leading-tight mt-0.5 truncate max-w-[260px]">{display}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {event.time ? new Date(event.time).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : ""}
            {event.face_id ? <span className="ml-2 opacity-70">• {DOOR[event.face_id] ?? `Q ${event.face_id}`}</span> : null}
          </p>
        </div>
      </div>
    </div>
  );
}
