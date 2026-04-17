import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Clock, TrendingUp, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";

const PERIODS = [
  { label: "7 kun", days: 7 },
  { label: "14 kun", days: 14 },
  { label: "30 kun", days: 30 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-lg shadow-xl shadow-black/10 border border-border/50 px-3 py-2.5">
      <p className="text-[11px] text-muted-foreground font-medium mb-1.5">{label}</p>
      {payload.map((item: any) => (
        <div key={item.name} className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
          <span className="text-muted-foreground">{item.name}:</span>
          <span className="font-semibold">{item.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function AnalyticsPage() {
  const [period, setPeriod] = useState(14);

  const { data: dailyChart } = useQuery({
    queryKey: ["a-daily", period],
    queryFn: () => api.getDailyChart(period),
  });

  const { data: hourlyChart } = useQuery({
    queryKey: ["a-hourly"],
    queryFn: () => api.getHourlyChart(),
  });

  const { data: topUsers } = useQuery({
    queryKey: ["a-top", period],
    queryFn: () => api.getTopUsers(period, 10),
  });

  const totals = (dailyChart?.data ?? []).reduce(
    (acc, d) => ({ entries: acc.entries + d.entries, exits: acc.exits + d.exits }),
    { entries: 0, exits: 0 },
  );
  const pieData = [
    { name: "Kirishlar", value: totals.entries, color: "#10b981" },
    { name: "Chiqishlar", value: totals.exits, color: "#f43f5e" },
  ];

  const peakHour = (hourlyChart?.data ?? []).reduce(
    (max, h) =>
      h.entries + h.exits > max.total ? { hour: h.hour, total: h.entries + h.exits } : max,
    { hour: "—", total: 0 },
  );

  const dailyData = dailyChart?.data ?? [];
  const avgEntries = dailyData.length > 0 ? Math.round(totals.entries / dailyData.length) : 0;
  const avgExits = dailyData.length > 0 ? Math.round(totals.exits / dailyData.length) : 0;

  return (
    <div className="p-5 lg:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3 animate-in">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Statistika</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Chuqur tahlil va vizualizatsiya</p>
        </div>
        <div className="flex bg-muted/60 rounded-lg p-0.5">
          {PERIODS.map((p) => (
            <button
              key={p.days}
              onClick={() => setPeriod(p.days)}
              className={`text-xs font-medium px-3 py-1.5 rounded-md transition-all ${
                period === p.days
                  ? "bg-white text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 animate-in" style={{ animationDelay: "50ms" }}>
        <div className="bg-white rounded-xl border border-border/40 p-4">
          <div className="flex items-center gap-2 mb-2">
            <ArrowDownToLine className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
              Kirishlar
            </span>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{totals.entries.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-border/40 p-4">
          <div className="flex items-center gap-2 mb-2">
            <ArrowUpFromLine className="w-3.5 h-3.5 text-rose-500" />
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
              Chiqishlar
            </span>
          </div>
          <p className="text-2xl font-bold text-rose-500">{totals.exits.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-border/40 p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
              Kunlik o'rtacha
            </span>
          </div>
          <p className="text-2xl font-bold">
            <span className="text-emerald-600">{avgEntries}</span>
            <span className="text-muted-foreground/30 mx-1">/</span>
            <span className="text-rose-500">{avgExits}</span>
          </p>
        </div>
        <div className="bg-white rounded-xl border border-border/40 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
              Eng gavjum
            </span>
          </div>
          <p className="text-2xl font-bold text-amber-600">{peakHour.hour}</p>
        </div>
      </div>

      {/* Main chart + Pie */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div
          className="lg:col-span-2 bg-white rounded-xl border border-border/40 p-5 animate-in"
          style={{ animationDelay: "100ms" }}
        >
          <h3 className="text-sm font-semibold mb-5">Kunlik trend</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="ae" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="ax" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.1} />
                    <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(228 14% 93%)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v) => v.slice(5)}
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} width={35} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="entries" name="Kirish" stroke="#10b981" strokeWidth={2} fill="url(#ae)" dot={false} activeDot={{ r: 4, fill: "#fff", strokeWidth: 2 }} />
                <Area type="monotone" dataKey="exits" name="Chiqish" stroke="#f43f5e" strokeWidth={2} fill="url(#ax)" dot={false} activeDot={{ r: 4, fill: "#fff", strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie */}
        <div
          className="bg-white rounded-xl border border-border/40 p-5 flex flex-col items-center animate-in"
          style={{ animationDelay: "150ms" }}
        >
          <h3 className="text-sm font-semibold self-start mb-2">Nisbat</h3>
          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={72}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-4 mt-2">
            {pieData.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs">
                <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                <span className="text-muted-foreground">{d.name}</span>
                <span className="font-semibold">{d.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hourly + Top Users */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div
          className="bg-white rounded-xl border border-border/40 p-5 animate-in"
          style={{ animationDelay: "200ms" }}
        >
          <h3 className="text-sm font-semibold mb-5">Soatlik taqsimot (bugun)</h3>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyChart?.data ?? []} barGap={1} barSize={14}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(228 14% 93%)" vertical={false} />
                <XAxis dataKey="hour" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} width={28} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="entries" name="Kirish" fill="#10b981" radius={[3, 3, 0, 0]} />
                <Bar dataKey="exits" name="Chiqish" fill="#f43f5e" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div
          className="bg-white rounded-xl border border-border/40 p-5 animate-in"
          style={{ animationDelay: "250ms" }}
        >
          <h3 className="text-sm font-semibold mb-4">
            Top tashrifchilar{" "}
            <span className="text-muted-foreground font-normal">({period} kun)</span>
          </h3>
          <div className="space-y-2 max-h-[260px] overflow-y-auto custom-scrollbar pr-1">
            {(topUsers?.data ?? []).map((user, i) => {
              const maxCount = topUsers?.data?.[0]?.count ?? 1;
              return (
                <div
                  key={user.name}
                  className="flex items-center gap-2.5 py-1.5 animate-in"
                  style={{ animationDelay: `${300 + i * 40}ms` }}
                >
                  <span className="w-5 text-[11px] text-muted-foreground font-mono text-right tabular-nums">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[13px] font-medium truncate">{user.full_name}</p>
                      <span className="text-[11px] font-bold text-muted-foreground ml-2 tabular-nums">
                        {user.count}
                      </span>
                    </div>
                    <div className="w-full h-1 rounded-full bg-muted/60 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary/70 to-primary transition-all duration-700"
                        style={{ width: `${(user.count / maxCount) * 100}%` }}
                      />
                    </div>
                    {user.role && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">{user.role}</p>
                    )}
                  </div>
                </div>
              );
            })}
            {(topUsers?.data ?? []).length === 0 && (
              <div className="text-center py-10">
                <p className="text-sm text-muted-foreground">Hali ma'lumot yo'q</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
