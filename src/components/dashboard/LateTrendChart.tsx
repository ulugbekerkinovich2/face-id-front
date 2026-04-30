import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

interface Props {
  data: Array<{ date: string; total: number; late: number; pct: number }>;
}

const Tip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const p = payload[0]?.payload;
  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl border border-border/30 px-4 py-3">
      <p className="text-[11px] text-muted-foreground font-semibold mb-2">{label}</p>
      <p className="text-[12px]">Kechikish: <span className="font-extrabold text-rose-600">{p?.pct}%</span></p>
      <p className="text-[10px] text-muted-foreground tabular-nums">{p?.late}/{p?.total} kishidan</p>
    </div>
  );
};

export function LateTrendChart({ data }: Props) {
  if (!data?.length) {
    return <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">Ma'lumot yo'q</div>;
  }
  const compact = data.map(d => ({ ...d, label: d.date.slice(5) }));
  return (
    <div className="h-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={compact}>
          <defs>
            <linearGradient id="gLate" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            width={36} axisLine={false} tickLine={false}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip content={<Tip />} />
          <Area
            type="monotone" dataKey="pct" name="Kechikish %"
            stroke="#f43f5e" strokeWidth={2.5}
            fill="url(#gLate)"
            dot={{ r: 3, fill: "#fff", stroke: "#f43f5e", strokeWidth: 2 }}
            activeDot={{ r: 5, strokeWidth: 2, fill: "#fff" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
