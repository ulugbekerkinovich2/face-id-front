import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Users,
  DoorOpen,
  DoorClosed,
  UserCheck,
  Ghost,
  Activity,
  TrendingUp,
  TrendingDown,
  ArrowRight,
} from "lucide-react";
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
} from "recharts";

function StatCard({
  title,
  value,
  icon: Icon,
  change,
  changeLabel,
  gradient,
  delay = 0,
}: {
  title: string;
  value: number;
  icon: any;
  change?: number;
  changeLabel?: string;
  gradient: string;
  delay?: number;
}) {
  const isUp = (change ?? 0) >= 0;
  return (
    <div
      className="animate-in group relative bg-white rounded-xl border border-border/40 p-5 hover:shadow-lg hover:shadow-black/[0.03] hover:-translate-y-0.5 transition-all duration-300"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide">
            {title}
          </p>
          <p className="text-[28px] font-bold tracking-tight mt-1.5 leading-none">
            {value.toLocaleString()}
          </p>
          {change !== undefined && (
            <div
              className={`flex items-center gap-1 text-[11px] font-semibold mt-2 ${
                isUp ? "text-emerald-600" : "text-rose-500"
              }`}
            >
              {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {isUp ? "+" : ""}
              {change}% {changeLabel}
            </div>
          )}
        </div>
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${gradient} shadow-lg shadow-black/[0.06]`}
        >
          <Icon className="w-[18px] h-[18px] text-white" />
        </div>
      </div>
    </div>
  );
}

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

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["stats"],
    queryFn: api.getStats,
    refetchInterval: 60_000,
  });

  const { data: dailyChart } = useQuery({
    queryKey: ["dailyChart"],
    queryFn: () => api.getDailyChart(14),
    refetchInterval: 300_000,
  });

  const { data: hourlyChart } = useQuery({
    queryKey: ["hourlyChart"],
    queryFn: () => api.getHourlyChart(),
    refetchInterval: 120_000,
  });

  const { data: topUsers } = useQuery({
    queryKey: ["topUsers"],
    queryFn: () => api.getTopUsers(7, 5),
    refetchInterval: 300_000,
  });

  const entryChange =
    stats && stats.yesterday_entries > 0
      ? Math.round(
          ((stats.today_entries - stats.yesterday_entries) / stats.yesterday_entries) * 100,
        )
      : 0;

  if (isLoading) {
    return (
      <div className="p-5 lg:p-6 space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-[110px] skeleton" />
          ))}
        </div>
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 h-[340px] skeleton" />
          <div className="h-[340px] skeleton" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 lg:p-6 space-y-5">
      {/* Welcome */}
      <div className="animate-in">
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Assalomu alaykum
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Bugungi holat va umumiy ko'rsatkichlar
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <StatCard
          title="Kirish"
          value={stats?.today_entries ?? 0}
          icon={DoorOpen}
          change={entryChange}
          changeLabel="kechaga"
          gradient="bg-gradient-to-br from-emerald-500 to-emerald-600"
          delay={0}
        />
        <StatCard
          title="Chiqish"
          value={stats?.today_exits ?? 0}
          icon={DoorClosed}
          gradient="bg-gradient-to-br from-rose-500 to-rose-600"
          delay={50}
        />
        <StatCard
          title="Ichkarida"
          value={stats?.currently_inside ?? 0}
          icon={UserCheck}
          gradient="bg-gradient-to-br from-blue-500 to-blue-600"
          delay={100}
        />
        <StatCard
          title="Foydalanuvchilar"
          value={stats?.total_users ?? 0}
          icon={Users}
          gradient="bg-gradient-to-br from-violet-500 to-violet-600"
          delay={150}
        />
      </div>

      {/* Small stats */}
      <div className="grid grid-cols-2 gap-3 lg:gap-4 animate-in" style={{ animationDelay: "200ms" }}>
        <div className="bg-white rounded-xl border border-border/40 p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <Activity className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <p className="text-lg font-bold">{(stats?.total_logs_7d ?? 0).toLocaleString()}</p>
            <p className="text-[11px] text-muted-foreground">7 kunlik loglar</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-border/40 p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-orange-500/10 flex items-center justify-center">
            <Ghost className="w-4 h-4 text-orange-600" />
          </div>
          <div>
            <p className="text-lg font-bold">{stats?.strangers_today ?? 0}</p>
            <p className="text-[11px] text-muted-foreground">Notanish yuzlar</p>
          </div>
        </div>
      </div>

      {/* Chart + Top Users */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Area chart */}
        <div
          className="lg:col-span-2 bg-white rounded-xl border border-border/40 p-5 animate-in"
          style={{ animationDelay: "250ms" }}
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold">Kunlik trend</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Oxirgi 14 kun</p>
            </div>
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyChart?.data ?? []}>
                <defs>
                  <linearGradient id="gE" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gX" x1="0" y1="0" x2="0" y2="1">
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
                <YAxis
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  width={35}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="entries"
                  name="Kirish"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#gE)"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, fill: "#fff" }}
                />
                <Area
                  type="monotone"
                  dataKey="exits"
                  name="Chiqish"
                  stroke="#f43f5e"
                  strokeWidth={2}
                  fill="url(#gX)"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, fill: "#fff" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Users */}
        <div
          className="bg-white rounded-xl border border-border/40 p-5 animate-in"
          style={{ animationDelay: "300ms" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Top tashrifchilar</h3>
            <span className="text-[10px] text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">
              7 kun
            </span>
          </div>
          <div className="space-y-3">
            {(topUsers?.data ?? []).map((user, i) => {
              const maxCount = topUsers?.data?.[0]?.count ?? 1;
              const colors = [
                "from-amber-400 to-amber-500",
                "from-gray-300 to-gray-400",
                "from-orange-400 to-orange-500",
                "from-blue-400 to-blue-500",
                "from-violet-400 to-violet-500",
              ];
              return (
                <div key={user.name} className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full bg-gradient-to-br ${colors[i] ?? colors[4]} flex items-center justify-center text-[10px] font-bold text-white shadow-sm`}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium truncate leading-tight">
                      {user.full_name}
                    </p>
                    <div className="w-full h-1 rounded-full bg-muted/80 mt-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary/80 to-primary transition-all duration-500"
                        style={{ width: `${(user.count / maxCount) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground tabular-nums">
                    {user.count}
                  </span>
                </div>
              );
            })}
            {(topUsers?.data ?? []).length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">Hali ma'lumot yo'q</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hourly */}
      <div
        className="bg-white rounded-xl border border-border/40 p-5 animate-in"
        style={{ animationDelay: "350ms" }}
      >
        <div className="mb-5">
          <h3 className="text-sm font-semibold">Soatlik taqsimot</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">Bugungi kirish va chiqishlar</p>
        </div>
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourlyChart?.data ?? []} barGap={1} barSize={16}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(228 14% 93%)" vertical={false} />
              <XAxis
                dataKey="hour"
                tick={{ fill: "#94a3b8", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                width={30}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="entries" name="Kirish" fill="#10b981" radius={[3, 3, 0, 0]} />
              <Bar dataKey="exits" name="Chiqish" fill="#f43f5e" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
