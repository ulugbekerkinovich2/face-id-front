import { useEffect, useState } from "react";
import { Radio } from "lucide-react";

/**
 * Yuqori-o'ngdagi katta "LIVE" indikator. Pulsatsiya halqa bilan,
 * connection status (`online | reconnecting | offline`) ni ko'rsatadi.
 */
interface Props {
  status?: "online" | "reconnecting" | "offline";
  count?: number;            // bugungi event count, optsional
  countLabel?: string;       // "events" yoki "logs"
}

export function LivePulseBadge({ status = "online", count, countLabel = "events" }: Props) {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const isLive = status === "online";
  const dotColor = isLive ? "bg-emerald-500" : status === "reconnecting" ? "bg-amber-400" : "bg-rose-500";
  const haloColor = isLive ? "bg-emerald-400" : status === "reconnecting" ? "bg-amber-300" : "bg-rose-400";
  const text = isLive ? "LIVE" : status === "reconnecting" ? "QAYTA..." : "OFFLINE";

  return (
    <div className="flex items-center gap-3">
      {count !== undefined && (
        <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-muted-foreground tabular-nums">
          <Radio className="w-3 h-3" />
          {count.toLocaleString()} {countLabel}
        </span>
      )}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-emerald-200 shadow-sm">
        <span className="relative flex h-2.5 w-2.5">
          {isLive && (
            <span className={`absolute inline-flex h-full w-full rounded-full ${haloColor} opacity-75 animate-ping`} />
          )}
          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${dotColor}`} />
        </span>
        <span className={`text-[11px] font-extrabold tracking-widest ${
          isLive ? "text-emerald-700" : status === "reconnecting" ? "text-amber-700" : "text-rose-600"
        }`}>
          {text}
        </span>
        <span className="hidden md:inline text-[11px] text-muted-foreground font-mono tabular-nums">
          {time.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </span>
      </div>
    </div>
  );
}
