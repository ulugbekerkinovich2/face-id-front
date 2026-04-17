import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAnimatedNumber } from "@/hooks/useAnimatedNumber";
import {
  Users, DoorOpen, DoorClosed, UserCheck, Ghost, Activity,
  TrendingUp, TrendingDown, ArrowRight, Clock,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from "recharts";

function AnimatedStat({
  title, value, icon: Icon, change, changeLabel, gradient, delay = 0,
}: {
  title: string; value: number; icon: any; change?: number;
  changeLabel?: string; gradient: string; delay?: number;
}) {
  const animated = useAnimatedNumber(value);
  const isUp = (change ?? 0) >= 0;

  return (
    <div className="count-up bg-white rounded-2xl border border-border/50 p-5 hover:shadow-xl hover:shadow-black/[0.04] hover:-translate-y-1 transition-all duration-300 cursor-default"
      style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold text-muted-foreground/80 uppercase tracking-wider">{title}</p>
          <p className="text-[32px] font-extrabold tracking-tight mt-1 leading-none tabular-nums">
            {animated.toLocaleString()}
          </p>
          {change !== undefined && (
            <div className={`flex items-center gap-1 text-[11px] font-semibold mt-2.5 ${isUp ? "text-emerald-600" : "text-rose-500"}`}>
              {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {isUp ? "+" : ""}{change}% <span className="font-normal text-muted-foreground">{changeLabel}</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${gradient} shadow-lg`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl shadow-black/10 border border-border/30 px-4 py-3">
      <p className="text-[11px] text-muted-foreground font-semibold mb-2">{label}</p>
      {payload.map((item: any) => (
        <div key={item.name} className="flex items-center gap-2.5 text-[12px] py-0.5">
          <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ background: item.color }} />
          <span className="text-muted-foreground">{item.name}</span>
          <span className="font-bold ml-auto">{item.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["stats"],
    queryFn: api.getStats,
    refetchInterval: 30_000,
  });

  const { data: dailyChart } = useQuery({
    queryKey: ["dailyChart"],
    queryFn: () => api.getDailyChart(14),
    refetchInterval: 300_000,
  });

  const { data: hourlyChart } = useQuery({
    queryKey: ["hourlyChart"],
    queryFn: () => api.getHourlyChart(),
    refetchInterval: 60_000,
  });

  const { data: topUsers } = useQuery({
    queryKey: ["topUsers"],
    queryFn: () => api.getTopUsers(7, 5),
    refetchInterval: 300_000,
  });

  const entryChange = stats && stats.yesterday_entries > 0
    ? Math.round(((stats.today_entries - stats.yesterday_entries) / stats.yesterday_entries) * 100) : 0;

  if (isLoading) {
    return (
      <div className="p-5 lg:p-6 space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-[130px] skeleton rounded-2xl" />)}
        </div>
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 h-[360px] skeleton rounded-2xl" />
          <div className="h-[360px] skeleton rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 lg:p-6 space-y-6">
      {/* Header */}
      <div className="animate-in flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">Real-vaqt monitoring va statistika</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-[12px] text-muted-foreground bg-white border border-border/50 px-3 py-1.5 rounded-full shadow-sm">
          <Clock className="w-3.5 h-3.5" />
          {new Date().toLocaleDateString("uz-UZ", { day: "numeric", month: "long", year: "numeric" })}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AnimatedStat title="Bugungi kirish" value={stats?.today_entries ?? 0} icon={DoorOpen}
          change={entryChange} changeLabel="kechaga" gradient="bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/25" delay={0} />
        <AnimatedStat title="Bugungi chiqish" value={stats?.today_exits ?? 0} icon={DoorClosed}
          gradient="bg-gradient-to-br from-rose-500 to-pink-600 shadow-rose-500/25" delay={80} />
        <AnimatedStat title="Hozir ichkarida" value={stats?.currently_inside ?? 0} icon={UserCheck}
          gradient="bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/25" delay={160} />
        <AnimatedStat title="Jami userlar" value={stats?.total_users ?? 0} icon={Users}
          gradient="bg-gradient-to-br from-violet-500 to-purple-600 shadow-violet-500/25" delay={240} />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="count-up bg-white rounded-2xl border border-border/50 p-4 flex items-center gap-4" style={{ animationDelay: "300ms" }}>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <Activity className="w-4.5 h-4.5 text-amber-600" />
          </div>
          <div>
            <p className="text-xl font-extrabold tabular-nums">{(stats?.total_logs_7d ?? 0).toLocaleString()}</p>
            <p className="text-[11px] text-muted-foreground font-medium">Haftalik loglar</p>
          </div>
        </div>
        <div className="count-up bg-white rounded-2xl border border-border/50 p-4 flex items-center gap-4" style={{ animationDelay: "360ms" }}>
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
            <Ghost className="w-4.5 h-4.5 text-orange-600" />
          </div>
          <div>
            <p className="text-xl font-extrabold tabular-nums">{stats?.strangers_today ?? 0}</p>
            <p className="text-[11px] text-muted-foreground font-medium">Notanish yuzlar</p>
          </div>
        </div>
      </div>

      {/* Chart + Top Users */}
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-border/50 p-6 count-up" style={{ animationDelay: "400ms" }}>
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
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="entries" name="Kirish" stroke="#10b981" strokeWidth={2.5} fill="url(#gE)" dot={false} activeDot={{ r: 5, strokeWidth: 2, fill: "#fff" }} />
                <Area type="monotone" dataKey="exits" name="Chiqish" stroke="#f43f5e" strokeWidth={2.5} fill="url(#gX)" dot={false} activeDot={{ r: 5, strokeWidth: 2, fill: "#fff" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Users */}
        <div className="bg-white rounded-2xl border border-border/50 p-6 count-up" style={{ animationDelay: "450ms" }}>
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-[15px] font-bold">Top tashrifchilar</h3>
            <span className="text-[10px] text-primary bg-primary/8 px-2.5 py-1 rounded-full font-semibold">7 kun</span>
          </div>
          <div className="space-y-3.5">
            {(topUsers?.data ?? []).map((user, i) => {
              const maxCount = topUsers?.data?.[0]?.count ?? 1;
              const medals = ["bg-gradient-to-br from-yellow-400 to-amber-500", "bg-gradient-to-br from-gray-300 to-slate-400", "bg-gradient-to-br from-amber-600 to-orange-700"];
              return (
                <div key={user.name} className="flex items-center gap-3 group">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-md ${medals[i] ?? "bg-gradient-to-br from-slate-400 to-slate-500"}`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-[13px] font-semibold truncate group-hover:text-primary transition-colors">{user.full_name}</p>
                      <span className="text-[12px] font-bold text-muted-foreground tabular-nums ml-2">{user.count}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 mt-1.5 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-primary/70 to-primary transition-all duration-700 ease-out"
                        style={{ width: `${(user.count / maxCount) * 100}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
            {(topUsers?.data ?? []).length === 0 && (
              <div className="text-center py-10"><p className="text-[13px] text-muted-foreground">Ma'lumot yo'q</p></div>
            )}
          </div>
        </div>
      </div>

      {/* Hourly */}
      <div className="bg-white rounded-2xl border border-border/50 p-6 count-up" style={{ animationDelay: "500ms" }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-[15px] font-bold">Soatlik taqsimot</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Bugungi kirish va chiqishlar</p>
          </div>
        </div>
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourlyChart?.data ?? []} barGap={2} barSize={14}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="hour" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} width={35} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="entries" name="Kirish" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="exits" name="Chiqish" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
