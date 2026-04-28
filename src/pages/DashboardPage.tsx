import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAnimatedNumber } from "@/hooks/useAnimatedNumber";
import {
  Users, DoorOpen, DoorClosed, UserCheck, TrendingUp, TrendingDown,
  Clock, Ghost, Activity,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { useState, useEffect } from "react";

function Num({ value, className = "" }: { value: number; className?: string }) {
  const v = useAnimatedNumber(value);
  return <span className={className}>{v.toLocaleString()}</span>;
}

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl border border-border/30 px-4 py-3">
      <p className="text-[11px] text-muted-foreground font-semibold mb-2">{label}</p>
      {payload.map((i: any) => (
        <div key={i.name} className="flex items-center gap-2 text-[12px] py-0.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: i.color }} />
          <span className="text-muted-foreground">{i.name}</span>
          <span className="font-bold ml-auto">{i.value?.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};

function LiveBadge({ updatedAt }: { updatedAt: Date | null }) {
  const [ago, setAgo] = useState("");

  useEffect(() => {
    const tick = () => {
      if (!updatedAt) return;
      const sec = Math.floor((Date.now() - updatedAt.getTime()) / 1000);
      setAgo(sec < 5 ? "Yangilandi" : `${sec} soniya oldin`);
    };
    tick();
    const id = setInterval(tick, 5000);
    return () => clearInterval(id);
  }, [updatedAt]);

  return (
    <div className="flex items-center gap-2 text-[12px] text-muted-foreground bg-white border border-border/50 px-3 py-1.5 rounded-full shadow-sm">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
      </span>
      <span className="hidden sm:inline">Jonli</span>
      <span className="text-muted-foreground/60">·</span>
      <Clock className="w-3 h-3" />
      <span>{ago}</span>
    </div>
  );
}

export default function DashboardPage() {
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const { data: stats, isLoading, dataUpdatedAt } = useQuery({
    queryKey: ["stats"],
    queryFn: api.getStats,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  const { data: dailyChart } = useQuery({
    queryKey: ["dailyChart"],
    queryFn: () => api.getDailyChart(14),
    staleTime: 300_000,
    enabled: !!stats,
  });

  useEffect(() => {
    if (dataUpdatedAt) setUpdatedAt(new Date(dataUpdatedAt));
  }, [dataUpdatedAt]);

  const entryChange = stats && stats.yesterday_entries > 0
    ? Math.round(((stats.today_entries - stats.yesterday_entries) / stats.yesterday_entries) * 100)
    : null;

  const exitChange = stats && stats.yesterday_exits > 0
    ? Math.round(((stats.today_exits - stats.yesterday_exits) / stats.yesterday_exits) * 100)
    : null;

  const statCards = [
    {
      title: "Bugungi kirish",
      value: stats?.today_entries ?? 0,
      icon: DoorOpen,
      gradient: "from-emerald-500 to-teal-600",
      change: entryChange,
      changeLabel: "kechaga",
    },
    {
      title: "Bugungi chiqish",
      value: stats?.today_exits ?? 0,
      icon: DoorClosed,
      gradient: "from-rose-500 to-pink-600",
      change: exitChange,
      changeLabel: "kechaga",
    },
    {
      title: "Hozir ichkarida",
      value: stats?.currently_inside ?? 0,
      icon: UserCheck,
      gradient: "from-blue-500 to-indigo-600",
    },
    {
      title: "Jami userlar",
      value: stats?.total_users ?? 0,
      icon: Users,
      gradient: "from-violet-500 to-purple-600",
    },
  ];

  if (isLoading) {
    return (
      <div className="p-5 lg:p-6 space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-[120px] skeleton rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="h-20 skeleton rounded-2xl" />
          <div className="h-20 skeleton rounded-2xl" />
        </div>
        <div className="h-[340px] skeleton rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="p-5 lg:p-6 space-y-6">
      {/* Header */}
      <div className="animate-in flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Dashboard</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            {new Date().toLocaleDateString("uz-UZ", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
        <LiveBadge updatedAt={updatedAt} />
      </div>

      {/* Main stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <div
            key={s.title}
            className="count-up bg-white rounded-2xl border border-border/50 p-5 hover:shadow-xl hover:shadow-black/[0.04] hover:-translate-y-1 transition-all duration-300"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground/80 uppercase tracking-wider">{s.title}</p>
                <p className="text-[32px] font-extrabold tracking-tight mt-1 leading-none tabular-nums">
                  <Num value={s.value} />
                </p>
                {s.change != null && (
                  <div className={`flex items-center gap-1 text-[11px] font-semibold mt-2 ${s.change >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
                    {s.change >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    {s.change >= 0 ? "+" : ""}{s.change}%
                    <span className="font-normal text-muted-foreground">{s.changeLabel}</span>
                  </div>
                )}
              </div>
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${s.gradient} flex items-center justify-center shadow-lg`}>
                <s.icon className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Secondary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="count-up bg-white rounded-2xl border border-border/50 p-5 flex items-center gap-4" style={{ animationDelay: "350ms" }}>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg flex-shrink-0">
            <Ghost className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground/80 uppercase tracking-wider">Bugungi notanishlar</p>
            <p className="text-[28px] font-extrabold tracking-tight leading-none tabular-nums mt-1">
              <Num value={stats?.strangers_today ?? 0} />
            </p>
          </div>
        </div>

        <div className="count-up bg-white rounded-2xl border border-border/50 p-5 flex items-center gap-4" style={{ animationDelay: "430ms" }}>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-400 to-cyan-600 flex items-center justify-center shadow-lg flex-shrink-0">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground/80 uppercase tracking-wider">7 kunlik loglar</p>
            <p className="text-[28px] font-extrabold tracking-tight leading-none tabular-nums mt-1">
              <Num value={stats?.total_logs_7d ?? 0} />
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-2xl border border-border/50 p-6 count-up" style={{ animationDelay: "500ms" }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-[15px] font-bold">Kunlik trend</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Oxirgi 14 kun</p>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Kirish</div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Chiqish</div>
          </div>
        </div>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyChart?.data ?? []}>
              <defs>
                <linearGradient id="gE" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gX" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.12} />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="date" tickFormatter={(v) => v.slice(5)} tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} width={40} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="entries" name="Kirish" stroke="#10b981" strokeWidth={2.5} fill="url(#gE)" dot={false} activeDot={{ r: 5, strokeWidth: 2, fill: "#fff" }} />
              <Area type="monotone" dataKey="exits" name="Chiqish" stroke="#f43f5e" strokeWidth={2.5} fill="url(#gX)" dot={false} activeDot={{ r: 5, strokeWidth: 2, fill: "#fff" }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
