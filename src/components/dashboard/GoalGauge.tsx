import { useEffect, useState } from "react";
import { Target, TrendingUp, TrendingDown } from "lucide-react";

interface Props {
  target: number;
  achieved: number;
  pct: number;
  remaining: number;
  comparePct?: number | null;
}

/** Yarim halqa "speedometer" — bugungi maqsadga necha foiz yetdi.
 *  +trend deltasi bilan kechagidan farqi. */
export function GoalGauge({ target, achieved, pct, remaining, comparePct }: Props) {
  const [val, setVal] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const from = val;
    const to = Math.max(0, Math.min(100, pct));
    const duration = 1100;
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);
    let raf = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setVal(from + (to - from) * ease(t));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pct]);

  // Yarim halqa SVG
  const r = 70;
  const circ = Math.PI * r;
  const offset = circ - (val / 100) * circ;
  const colorStop =
    val >= 90 ? "#10b981" :
    val >= 60 ? "#3b82f6" :
    val >= 30 ? "#f59e0b" :
    "#f43f5e";

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-[180px] h-[100px]">
        <svg width="180" height="100" viewBox="0 0 180 100">
          <defs>
            <linearGradient id="goalGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={colorStop} stopOpacity={0.5} />
              <stop offset="100%" stopColor={colorStop} stopOpacity={1} />
            </linearGradient>
          </defs>
          <path
            d={`M 20 90 A ${r} ${r} 0 0 1 160 90`}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth="14"
            strokeLinecap="round"
          />
          <path
            d={`M 20 90 A ${r} ${r} 0 0 1 160 90`}
            fill="none"
            stroke="url(#goalGrad)"
            strokeWidth="14"
            strokeLinecap="round"
            style={{
              strokeDasharray: circ,
              strokeDashoffset: offset,
              transition: "stroke-dashoffset 50ms linear",
              filter: `drop-shadow(0 4px 12px ${colorStop}55)`,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
          <span className="text-[28px] font-extrabold tabular-nums leading-none" style={{ color: colorStop }}>
            {Math.round(val)}%
          </span>
          <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mt-0.5">
            <Target className="w-3 h-3 inline mr-0.5" />
            Maqsad
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 w-full mt-2 pt-3 border-t border-border/30 text-center">
        <div>
          <p className="text-[9px] text-muted-foreground uppercase">Keldi</p>
          <p className="text-[14px] font-extrabold tabular-nums" style={{ color: colorStop }}>{achieved}</p>
        </div>
        <div className="border-x border-border/20">
          <p className="text-[9px] text-muted-foreground uppercase">Maqsad</p>
          <p className="text-[14px] font-extrabold tabular-nums">{target}</p>
        </div>
        <div>
          <p className="text-[9px] text-muted-foreground uppercase">Qoldi</p>
          <p className="text-[14px] font-extrabold tabular-nums text-slate-500">{remaining}</p>
        </div>
      </div>

      {comparePct != null && (
        <div className={`mt-2 flex items-center gap-1 text-[11px] font-semibold ${
          comparePct >= 0 ? "text-emerald-600" : "text-rose-500"
        }`}>
          {comparePct >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
          {comparePct >= 0 ? "+" : ""}{comparePct}%
          <span className="text-muted-foreground font-normal">kechaga nisbatan</span>
        </div>
      )}
    </div>
  );
}
