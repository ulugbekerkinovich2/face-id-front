interface Props {
  hourly: number[];  // 24 ta son
}

/** 24 katakli soatma-soat harorat xaritasi.
 *  Ko'k → ko'k yashil → yashil → sariq → qizil — peak vaqtni ko'rsatadi. */
export function HourlyHeatmap({ hourly }: Props) {
  const max = Math.max(1, ...hourly);

  function colorFor(v: number) {
    const t = v / max; // 0..1
    if (v === 0) return "bg-slate-100 text-slate-300";
    if (t < 0.15) return "bg-violet-100 text-violet-600";
    if (t < 0.35) return "bg-violet-200 text-violet-700";
    if (t < 0.55) return "bg-violet-400 text-white";
    if (t < 0.8)  return "bg-violet-600 text-white";
    return "bg-violet-700 text-white";
  }

  // Peak hour
  const peakHour = hourly.indexOf(max);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-12 gap-1.5">
        {hourly.map((v, h) => (
          <div
            key={h}
            className={`aspect-square rounded-md flex items-center justify-center text-[10px] font-bold tabular-nums transition-transform hover:scale-110 ${colorFor(v)}`}
            title={`${h}:00 — ${v} ta`}
            style={{ animation: `fadeInUp 0.4s ease-out ${h * 20}ms backwards` }}
          >
            {v > 0 ? v : ""}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span>00:00</span>
        <span>06:00</span>
        <span>12:00</span>
        <span>18:00</span>
        <span>23:00</span>
      </div>
      {max > 0 && (
        <p className="text-[11px] text-muted-foreground">
          Peak: <span className="font-bold text-violet-600">{peakHour}:00</span>
          <span className="ml-1">— {max} ta kirish</span>
        </p>
      )}
    </div>
  );
}
