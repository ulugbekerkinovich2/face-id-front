import { Clock } from "lucide-react";

interface LateUser {
  name: string;
  time: string;
  image: string;
  late_minutes: number;
}

function fmtLate(min: number) {
  if (min < 60) return `${min} daq`;
  const h = Math.floor(min / 60), m = min % 60;
  return m > 0 ? `${h}s ${m}d` : `${h} soat`;
}

function initials(s: string) {
  return s.split(" ").slice(0, 2).map(w => w[0] ?? "").join("").toUpperCase();
}

interface Props {
  items: LateUser[];
}

export function TopLateUsers({ items }: Props) {
  if (!items.length) {
    return (
      <div className="text-center py-8">
        <Clock className="w-8 h-8 text-emerald-500/30 mx-auto mb-2" />
        <p className="text-[12px] text-muted-foreground">Bugun hech kim kech qolmagan ✓</p>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {items.map((u, i) => (
        <div
          key={u.name + u.time}
          className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-rose-50/50 transition-colors animate-in"
          style={{ animationDelay: `${i * 80}ms` }}
        >
          <div className="relative flex-shrink-0">
            {u.image ? (
              <img src={u.image} alt="" loading="lazy" className="w-10 h-10 rounded-full object-cover ring-2 ring-rose-100" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-rose-400 flex items-center justify-center text-white font-bold text-xs">
                {initials(u.name)}
              </div>
            )}
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold flex items-center justify-center ring-2 ring-white">
              {i + 1}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold truncate">{u.name}</p>
            <p className="text-[10px] text-muted-foreground tabular-nums">Keldi: {u.time}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-[12px] font-extrabold text-rose-600 tabular-nums">+{fmtLate(u.late_minutes)}</p>
            <p className="text-[9px] text-muted-foreground">kech</p>
          </div>
        </div>
      ))}
    </div>
  );
}
