interface Item {
  role: string;
  came: number;
  late: number;
}

const COLORS = [
  "from-violet-500 to-purple-600",
  "from-blue-500 to-cyan-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-indigo-500 to-blue-700",
  "from-lime-500 to-emerald-600",
  "from-fuchsia-500 to-pink-600",
];

export function DepartmentBreakdown({ items }: { items: Item[] }) {
  if (!items?.length) {
    return (
      <div className="text-center py-10 text-[12px] text-muted-foreground">
        Bo'limlar bo'yicha ma'lumot yo'q
      </div>
    );
  }
  const max = Math.max(1, ...items.map(i => i.came));
  return (
    <div className="space-y-3">
      {items.map((d, i) => {
        const pct = Math.round((d.came / max) * 100);
        const latePct = d.came ? Math.round((d.late / d.came) * 100) : 0;
        const color = COLORS[i % COLORS.length];
        return (
          <div key={d.role + i} className="animate-in" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="flex items-baseline justify-between mb-1.5">
              <p className="text-[12px] font-semibold truncate flex-1">{d.role}</p>
              <div className="flex items-center gap-2 text-[11px]">
                <span className="font-extrabold tabular-nums">{d.came}</span>
                {d.late > 0 && (
                  <span className="text-rose-500 font-semibold tabular-nums">+{d.late} kech</span>
                )}
              </div>
            </div>
            <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden relative">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${color} transition-all`}
                style={{ width: `${pct}%`, transitionDuration: "800ms" }}
              />
              {latePct > 0 && d.came > 0 && (
                <div
                  className="absolute top-0 h-full bg-rose-500/70 transition-all"
                  style={{
                    left: `${pct - (pct * latePct / 100)}%`,
                    width: `${pct * latePct / 100}%`,
                    transitionDuration: "800ms",
                  }}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
