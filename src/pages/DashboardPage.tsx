import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAnimatedNumber } from "@/hooks/useAnimatedNumber";
import {
  Users, DoorOpen, DoorClosed, UserCheck, TrendingUp, TrendingDown, Clock,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

function Num({ value, className = "" }: { value: number; className?: string }) {
  const v = useAnimatedNumber(value);
  return <span className={className}>{v.toLocaleString()}</span>;
}

const TT = ({ active, payload, label }: any) => {
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

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["stats"],
    queryFn: api.getStats,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const { data: dailyChart } = useQuery({
    queryKey: ["dailyChart"],
    queryFn: () => api.getDailyChart(14),
    staleTime: 300_000,
    enabled: !!stats,
  });

  const entryChange = stats && stats.yesterday_entries > 0
    ? Math.round(((stats.today_entries - stats.yesterday_entries) / stats.yesterday_entries) * 100) : 0;

  if (isLoading) {
    return (
      <div className="p-5 lg:p-6 space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-[120px] skeleton rounded-2xl" />)}
        </div>
        <div className="h-[340px] skeleton rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="p-5 lg:p-6 space-y-6">
      <div className="animate-in flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Dashboard</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">Real-vaqt monitoring</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-[12px] text-muted-foreground bg-white border border-border/50 px-3 py-1.5 rounded-full shadow-sm">
          <Clock className="w-3.5 h-3.5" />
          {new Date().toLocaleDateString("uz-UZ", { day: "numeric", month: "long" })}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Bugungi kirish", value: stats?.today_entries ?? 0, icon: DoorOpen, gradient: "from-emerald-500 to-teal-600", change: entryChange, changeLabel: "kechaga" },
          { title: "Bugungi chiqish", value: stats?.today_exits ?? 0, icon: DoorClosed, gradient: "from-rose-500 to-pink-600" },
          { title: "Hozir ichkarida", value: stats?.currently_inside ?? 0, icon: UserCheck, gradient: "from-blue-500 to-indigo-600" },
          { title: "Jami userlar", value: stats?.total_users ?? 0, icon: Users, gradient: "from-violet-500 to-purple-600" },
        ].map((s, i) => (
          <div key={s.title} className="count-up bg-white rounded-2xl border border-border/50 p-5 hover:shadow-xl hover:shadow-black/[0.04] hover:-translate-y-1 transition-all duration-300"
            style={{ animationDelay: `${i * 80}ms` }}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground/80 uppercase tracking-wider">{s.title}</p>
                <p className="text-[32px] font-extrabold tracking-tight mt-1 leading-none tabular-nums">
                  <Num value={s.value} />
                </p>
                {s.change !== undefined && (
                  <div className={`flex items-center gap-1 text-[11px] font-semibold mt-2 ${s.change >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
                    {s.change >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    {s.change >= 0 ? "+" : ""}{s.change}% <span className="font-normal text-muted-foreground">{s.changeLabel}</span>
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

      {/* Chart */}
      <div className="bg-white rounded-2xl border border-border/50 p-6 count-up" style={{ animationDelay: "350ms" }}>
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
              <Tooltip content={<TT />} />
              <Area type="monotone" dataKey="entries" name="Kirish" stroke="#10b981" strokeWidth={2.5} fill="url(#gE)" dot={false} activeDot={{ r: 5, strokeWidth: 2, fill: "#fff" }} />
              <Area type="monotone" dataKey="exits" name="Chiqish" stroke="#f43f5e" strokeWidth={2.5} fill="url(#gX)" dot={false} activeDot={{ r: 5, strokeWidth: 2, fill: "#fff" }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
