import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, LiveFeedEntry } from "@/lib/api";
import { useAnimatedNumber } from "@/hooks/useAnimatedNumber";
import {
  Users, DoorOpen, DoorClosed, UserCheck, TrendingUp, TrendingDown,
  Clock, Ghost, Activity, ArrowDownToLine, ArrowUpFromLine, User,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { useState, useEffect, useRef } from "react";
import { useNewIds } from "@/hooks/useNewIds";
import { useLiveStream } from "@/hooks/useLiveStream";
import { useFlipChildren } from "@/hooks/useFlipChildren";
import { ProgressRing } from "@/components/dashboard/ProgressRing";
import { HourlyHeatmap } from "@/components/dashboard/HourlyHeatmap";
import { TopLateUsers } from "@/components/dashboard/TopLateUsers";
import { LastEnteredCard } from "@/components/dashboard/LastEnteredCard";
import { LateTrendChart } from "@/components/dashboard/LateTrendChart";
import { MostActiveUsers } from "@/components/dashboard/MostActiveUsers";
import { LivePulseBadge } from "@/components/dashboard/LivePulseBadge";
import { ImageLightbox } from "@/components/dashboard/ImageLightbox";
import { DepartmentBreakdown } from "@/components/dashboard/DepartmentBreakdown";
import { GoalGauge } from "@/components/dashboard/GoalGauge";
import { LiveEntryPopup } from "@/components/dashboard/LiveEntryPopup";
import { SoundToggle, playBeep } from "@/components/dashboard/SoundToggle";

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

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0] ?? "").join("").toUpperCase();
}

function LiveFeedTicker() {
  const [items, setItems] = useState<LiveFeedEntry[]>([]);

  // Initial load — bir martalik
  const { data } = useQuery({
    queryKey: ["live-feed"],
    queryFn: () => api.getLiveFeed(10, 0),
    staleTime: 60_000,  // WS bilan yangilanadi, polling kerak emas
  });

  useEffect(() => {
    if (data?.data?.length && items.length === 0) {
      setItems(data.data);
    }
  }, [data]);

  // WebSocket — yangi log kelganda prepend
  useLiveStream<LiveFeedEntry>(["logs"], (ev) => {
    if (ev.channel !== "logs") return;
    setItems((prev) => {
      if (prev.some((p) => p.id === ev.data.id)) return prev;
      return [ev.data, ...prev].slice(0, 10);
    });
  });

  const newIds = useNewIds(items, (e: any) => e.id, 2500);
  const listRef = useFlipChildren<HTMLDivElement>([items]);

  if (!items.length) return null;

  return (
    <div className="bg-white rounded-2xl border border-border/50 p-5 count-up" style={{ animationDelay: "420ms" }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <h3 className="text-[14px] font-bold">Jonli kirish/chiqish</h3>
        </div>
        <span className="text-[10px] text-emerald-600 font-semibold">REAL-TIME</span>
      </div>

      <div ref={listRef} className="space-y-1.5">
        {items.map((entry) => {
          const isNew = newIds.has(entry.id);
          const isIn = entry.direction === "IN";
          return (
            <div
              key={entry.id}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 transition-all ${
                isNew ? "flash-new bg-violet-50/50" : "hover:bg-muted/40"
              }`}
            >
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 bg-muted">
                {entry.image ? (
                  <img src={entry.image} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                    <span className="text-[10px] font-bold text-slate-500">
                      {entry.full_name || entry.name ? initials(entry.full_name || entry.name) : <User className="w-4 h-4" />}
                    </span>
                  </div>
                )}
              </div>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold truncate">
                  {entry.full_name || entry.name || "Noma'lum"}
                </p>
                <p className="text-[10px] text-muted-foreground tabular-nums">
                  {entry.time ? new Date(entry.time).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "—"}
                </p>
              </div>

              {/* Direction */}
              <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0 ${
                isIn ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-600"
              }`}>
                {isIn ? <ArrowDownToLine className="w-3 h-3" /> : <ArrowUpFromLine className="w-3 h-3" />}
                {isIn ? "Kirdi" : "Chiqdi"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

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
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [eventCount, setEventCount] = useState(0);
  const [popupEvent, setPopupEvent] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: stats, isLoading, dataUpdatedAt } = useQuery({
    queryKey: ["stats"],
    queryFn: api.getStats,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  // Yangi log/stranger kelganda stats'ni yangilash + counter + popup + sound
  useLiveStream<any>(["logs", "strangers"], (ev) => {
    setEventCount((c) => c + 1);
    queryClient.invalidateQueries({ queryKey: ["stats"] });
    queryClient.invalidateQueries({ queryKey: ["wow-stats"] });
    queryClient.invalidateQueries({ queryKey: ["inside"] });

    if (ev.channel === "logs" && ev.data) {
      setPopupEvent(ev.data);
      playBeep(ev.data.direction);
    }
  });

  const { data: wow } = useQuery({
    queryKey: ["wow-stats"],
    queryFn: api.getWowStats,
    staleTime: 20_000,
    refetchInterval: 60_000,
  });

  const { data: insideData } = useQuery({
    queryKey: ["inside"],
    queryFn: api.getInsideNow,
    refetchInterval: 60_000,
    staleTime: 30_000,
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
      value: insideData?.count ?? stats?.currently_inside ?? 0,
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
      <div className="animate-in flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Dashboard</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            {new Date().toLocaleDateString("uz-UZ", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <SoundToggle />
          <LivePulseBadge count={eventCount} countLabel="ulanish" />
        </div>
      </div>

      {/* Main stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <div
            key={s.title}
            className={`count-up rounded-2xl p-5 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 ${
              i === 0 ? "gradient-border bg-white" : "bg-white border border-border/50"
            }`}
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

      {/* Wow stats — attendance + last entered */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_1.2fr] gap-4">
        {/* Attendance progress rings */}
        <div className="count-up bg-white rounded-2xl border border-border/50 p-5" style={{ animationDelay: "300ms" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[14px] font-bold">Bugungi davomad</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {wow ? `${wow.came_count}/${wow.total_users} keldi` : "—"}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <ProgressRing
              value={wow?.attendance_pct ?? 0}
              size={150}
              color="text-emerald-500"
              label="Davomad"
              sublabel={wow ? `${wow.late_count} kech` : undefined}
            />
          </div>
          {wow && (
            <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-border/30">
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground">Vaqtida</p>
                <p className="text-[16px] font-extrabold text-emerald-600 tabular-nums">{wow.ontime_count}</p>
              </div>
              <div className="text-center border-x border-border/30">
                <p className="text-[10px] text-muted-foreground">Kech</p>
                <p className="text-[16px] font-extrabold text-rose-500 tabular-nums">{wow.late_count}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground">Kelmagan</p>
                <p className="text-[16px] font-extrabold text-slate-400 tabular-nums">{wow.absent_count}</p>
              </div>
            </div>
          )}
        </div>

        {/* Last entered + time stats */}
        <div className="count-up bg-gradient-to-br from-emerald-50 via-white to-teal-50/40 rounded-2xl border border-emerald-100 p-5" style={{ animationDelay: "380ms" }}>
          <LastEnteredCard data={wow?.last_entered ?? null} onImageClick={setLightbox} />
          {wow && (
            <div className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-emerald-100">
              <div>
                <p className="text-[10px] text-emerald-600 font-semibold uppercase">O'rtacha</p>
                <p className="text-[18px] font-extrabold tabular-nums">{wow.avg_arrival ?? "—"}</p>
              </div>
              <div>
                <p className="text-[10px] text-emerald-600 font-semibold uppercase">Eng erta</p>
                <p className="text-[18px] font-extrabold tabular-nums">
                  {wow.earliest?.time ?? "—"}
                </p>
                {wow.earliest && (
                  <p className="text-[10px] text-muted-foreground truncate">{wow.earliest.name}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Top late */}
        <div className="count-up bg-white rounded-2xl border border-border/50 p-5" style={{ animationDelay: "460ms" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[14px] font-bold">Eng kech kelganlar</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Bugun, top 5</p>
            </div>
            {wow?.late_pct != null && (
              <span className="text-[10px] font-bold bg-rose-100 text-rose-700 px-2 py-1 rounded-full">
                {wow.late_pct}% kech
              </span>
            )}
          </div>
          <TopLateUsers items={wow?.top_late ?? []} onImageClick={setLightbox} />
        </div>
      </div>

      {/* Hourly heatmap + Late trend side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="count-up bg-white rounded-2xl border border-border/50 p-6" style={{ animationDelay: "540ms" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[15px] font-bold">Soatlik heatmap</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Bugun — har soatda nechta kirgan</p>
            </div>
          </div>
          <HourlyHeatmap hourly={wow?.hourly ?? new Array(24).fill(0)} />
        </div>

        <div className="count-up bg-white rounded-2xl border border-border/50 p-6" style={{ animationDelay: "620ms" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[15px] font-bold">Kechikish trendi</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Oxirgi 14 kun, foiz</p>
            </div>
          </div>
          <LateTrendChart data={wow?.late_trend ?? []} />
        </div>
      </div>

      {/* Goal gauge + Departments breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4">
        <div className="count-up bg-white rounded-2xl border border-border/50 p-5 flex flex-col items-center" style={{ animationDelay: "700ms" }}>
          <div className="self-start mb-2">
            <h3 className="text-[14px] font-bold">Bugungi maqsad</h3>
            <p className="text-[11px] text-muted-foreground">90% davomad</p>
          </div>
          {wow?.goal && (
            <GoalGauge
              target={wow.goal.target}
              achieved={wow.goal.achieved}
              pct={wow.goal.pct}
              remaining={wow.goal.remaining}
              comparePct={wow?.compare?.delta_pct ?? null}
            />
          )}
        </div>

        <div className="count-up bg-white rounded-2xl border border-border/50 p-5" style={{ animationDelay: "780ms" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[14px] font-bold">Bo'limlar bo'yicha</h3>
              <p className="text-[11px] text-muted-foreground">Bugun kelgan • qizil chiziq — kech qolganlar</p>
            </div>
          </div>
          <DepartmentBreakdown items={wow?.departments ?? []} />
        </div>
      </div>

      {/* Most active users — full row */}
      <div className="count-up bg-gradient-to-br from-amber-50/40 via-white to-orange-50/40 rounded-2xl border border-amber-100 p-6" style={{ animationDelay: "860ms" }}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-[15px] font-bold flex items-center gap-2">
              <span>🏆</span> Eng faol foydalanuvchilar
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Oxirgi 30 kun bo'yicha kirish soni</p>
          </div>
        </div>
        <MostActiveUsers items={wow?.most_active ?? []} onImageClick={setLightbox} />
      </div>

      {/* Live feed + Chart side by side on large screens */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-4">

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
        {!dailyChart ? (
          <div className="h-[280px] skeleton rounded-xl" />
        ) : (
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyChart.data ?? []}>
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
        )}
      </div>

      {/* Live feed ticker */}
      <LiveFeedTicker />

      </div>{/* end grid */}

      {/* Image lightbox */}
      <ImageLightbox src={lightbox} onClose={() => setLightbox(null)} />

      {/* Real-time entry popup — yangi log kelganda 3.5s davomida ekran tepasida */}
      <LiveEntryPopup event={popupEvent} onClose={() => setPopupEvent(null)} />
    </div>
  );
}
