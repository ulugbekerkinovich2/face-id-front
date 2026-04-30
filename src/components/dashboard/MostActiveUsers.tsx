import { Crown } from "lucide-react";

interface Item {
  name: string;
  count: number;
  image: string;
}

function initials(s: string) {
  return s.split(" ").slice(0, 2).map(w => w[0] ?? "").join("").toUpperCase();
}

const RANK_GRADIENT = [
  "from-amber-400 to-yellow-600",   // 1
  "from-slate-300 to-slate-500",    // 2
  "from-orange-400 to-amber-700",   // 3
  "from-violet-300 to-violet-500",
  "from-blue-300 to-blue-500",
];

export function MostActiveUsers({ items, onImageClick }: { items: Item[]; onImageClick?: (src: string) => void }) {
  if (!items?.length) {
    return (
      <div className="text-center py-8">
        <p className="text-[12px] text-muted-foreground">Hali ma'lumot yo'q</p>
      </div>
    );
  }
  const max = Math.max(1, ...items.map(i => i.count));
  return (
    <div className="space-y-2.5">
      {items.map((u, i) => {
        const pct = Math.round((u.count / max) * 100);
        return (
          <div
            key={u.name + i}
            className="flex items-center gap-3 animate-in"
            style={{ animationDelay: `${i * 70}ms` }}
          >
            <div className="relative flex-shrink-0">
              {u.image ? (
                <img src={u.image} alt="" loading="lazy"
                     onClick={() => onImageClick?.(u.image)}
                     className={`w-11 h-11 rounded-full object-cover ring-2 ring-amber-100 ${
                       onImageClick ? "cursor-zoom-in hover:ring-amber-300 transition-all" : ""
                     }`} />
              ) : (
                <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${RANK_GRADIENT[i] ?? RANK_GRADIENT[4]} flex items-center justify-center text-white font-bold text-xs`}>
                  {initials(u.name)}
                </div>
              )}
              {i === 0 && (
                <Crown className="absolute -top-2 -right-1 w-4 h-4 text-amber-500 drop-shadow-md fill-amber-300" />
              )}
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white text-[10px] font-extrabold flex items-center justify-center shadow-md ring-1 ring-border/30">
                {i + 1}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-2 mb-1">
                <p className="text-[12px] font-semibold truncate">{u.name}</p>
                <p className="text-[12px] font-extrabold tabular-nums text-amber-600 flex-shrink-0">{u.count}</p>
              </div>
              <div className="h-1.5 rounded-full bg-amber-50 overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${RANK_GRADIENT[i] ?? RANK_GRADIENT[4]} transition-all`}
                  style={{ width: `${pct}%`, transitionDuration: "800ms" }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
