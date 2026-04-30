import { useEffect, useState } from "react";

interface Props {
  value: number;          // 0..100
  size?: number;          // px
  stroke?: number;
  color?: string;         // tailwind color class for stroke (e.g. text-emerald-500)
  trackColor?: string;    // bg ring (default muted)
  label?: string;
  sublabel?: string;
  duration?: number;      // ms
}

/** SVG progress halqasi — `stroke-dashoffset` animatsiya bilan to'ladi. */
export function ProgressRing({
  value, size = 140, stroke = 12,
  color = "text-violet-500",
  trackColor = "text-slate-100",
  label, sublabel, duration = 1200,
}: Props) {
  const [animValue, setAnimValue] = useState(0);
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (animValue / 100) * circ;

  useEffect(() => {
    const start = performance.now();
    const from = animValue;
    const to = Math.max(0, Math.min(100, value));
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);
    let raf = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setAnimValue(from + (to - from) * ease(t));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90 drop-shadow-sm">
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          strokeWidth={stroke}
          className={`stroke-current ${trackColor}`}
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          className={`stroke-current ${color}`}
          style={{
            strokeDasharray: circ,
            strokeDashoffset: offset,
            transition: "stroke-dashoffset 50ms linear",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-extrabold tabular-nums">{Math.round(animValue)}%</span>
        {label && <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{label}</span>}
        {sublabel && <span className="text-[10px] text-muted-foreground/70">{sublabel}</span>}
      </div>
    </div>
  );
}
