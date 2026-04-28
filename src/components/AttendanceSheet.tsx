import { useState } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell,
} from "recharts";
import {
  User, Clock, TrendingUp, AlertCircle, CalendarX, X,
  Flame, Award, Zap, Settings, BarChart2, CheckCircle2,
} from "lucide-react";

interface Props {
  name: string | null;
  open: boolean;
  onClose: () => void;
}

function fmtTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" });
}

function fmtLateSec(sec: number) {
  if (!sec) return "";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const parts = [];
  if (h) parts.push(`${h} soat`);
  if (m) parts.push(`${m} daq`);
  return parts.join(" ") || "< 1 daq";
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("uz-UZ", { day: "numeric", month: "short" });
}

function timeToMin(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

const STATUS_COLOR: Record<string, string> = {
  on_time: "bg-emerald-500",
  late: "bg-amber-400",
  absent: "bg-slate-200 dark:bg-slate-700",
};

function ChartTooltip({ active, payload, label, workStartMin }: any) {
  if (!active || !payload?.length) return null;
  const min = payload[0]?.value as number;
  const h = Math.floor(min / 60);
  const m = min % 60;
  const isLate = min > workStartMin;
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-border/30 px-3 py-2 text-xs">
      <p className="font-semibold text-muted-foreground">{label}</p>
      <p className={`font-bold ${isLate ? "text-rose-500" : "text-emerald-600"}`}>
        {`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`} {isLate ? "⚠ kech" : "✓ o'z vaqtida"}
      </p>
    </div>
  );
}

export default function AttendanceSheet({ name, open, onClose }: Props) {
  const [days, setDays] = useState(30);
  const [workStart, setWorkStart] = useState("09:00");
  const [workEnd, setWorkEnd] = useState("18:00");
  const [showSettings, setShowSettings] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);

  const workStartMin = timeToMin(workStart);
  const workEndMin = timeToMin(workEnd);
  const yMin = Math.max(0, workStartMin - 90);
  const yMax = workEndMin + 30;

  const { data, isLoading } = useQuery({
    queryKey: ["attendance", name, days, workStart, workEnd],
    queryFn: () => api.getUserAttendance(name!, days, workStart, workEnd),
    enabled: !!name && open,
    staleTime: 60_000,
  });

  const chartData = (data?.arrival_chart ?? []).slice(-21).map((d) => ({
    date: fmtDate(d.date),
    minutes: d.minutes,
  }));

  // Streak calculation
  const streakInfo = (() => {
    if (!data?.timeline) return { streak: 0, onTimeCount: 0, attendancePct: 0 };
    const tl = [...data.timeline].reverse();
    let streak = 0;
    for (const d of tl) {
      if (d.status === "on_time" || d.status === "late") streak++;
      else break;
    }
    const onTimeCount = data.timeline.filter((d) => d.status === "on_time").length;
    return { streak, onTimeCount, attendancePct: data.stats.attendance_pct };
  })();

  const openLightbox = (url: string) => setLightbox(url);

  return (
    <>
      <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
        <SheetContent side="right" className="w-full sm:max-w-2xl p-0 flex flex-col overflow-hidden">
          <SheetHeader className="px-5 pt-5 pb-3 border-b border-border/40 flex-shrink-0">
            <div className="flex items-start justify-between gap-3">
              {/* Name + role */}
              <div className="min-w-0 flex-1">
                <SheetTitle className="text-base font-bold truncate">
                  {isLoading ? (
                    <div className="h-5 w-48 bg-muted animate-pulse rounded" />
                  ) : (
                    data?.full_name || name
                  )}
                </SheetTitle>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">{name}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {data?.role && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                      {data.role}
                    </span>
                  )}
                  {!isLoading && data && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                      {data.stats.attendance_pct}% davomat
                    </span>
                  )}
                </div>
              </div>

              {/* Avatar */}
              <div className="flex-shrink-0">
                {isLoading ? (
                  <div className="w-16 h-16 rounded-xl bg-muted animate-pulse" />
                ) : data?.image ? (
                  <img
                    src={data.image} alt=""
                    className="w-16 h-16 rounded-xl object-cover border-2 border-border/40 cursor-zoom-in hover:ring-2 hover:ring-primary/40 transition-all"
                    onClick={() => data.image && openLightbox(data.image)}
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center">
                    <User className="w-7 h-7 text-slate-400" />
                  </div>
                )}
              </div>
            </div>

            {/* Controls row */}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {/* Days selector */}
              <div className="flex items-center gap-1">
                {[7, 14, 30, 60, 90].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDays(d)}
                    className={`text-[11px] font-medium px-2 py-1 rounded-md transition-colors ${
                      days === d
                        ? "bg-primary text-white"
                        : "bg-muted/60 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {d}k
                  </button>
                ))}
              </div>

              <div className="h-4 w-px bg-border/60 mx-1" />

              {/* Settings toggle */}
              <button
                onClick={() => setShowSettings((p) => !p)}
                className={`flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md transition-colors ${
                  showSettings ? "bg-primary/10 text-primary" : "bg-muted/60 text-muted-foreground hover:text-foreground"
                }`}
              >
                <Settings className="w-3 h-3" />
                Ish vaqti
              </button>
            </div>

            {/* Work time settings */}
            {showSettings && (
              <div className="flex items-center gap-3 mt-2 p-3 rounded-xl bg-muted/40 border border-border/40">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground font-medium w-16">Boshlanish</span>
                  <input
                    type="time"
                    value={workStart}
                    onChange={(e) => setWorkStart(e.target.value)}
                    className="text-xs px-2 py-1 rounded-lg border border-border/60 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground font-medium w-12">Tugashi</span>
                  <input
                    type="time"
                    value={workEnd}
                    onChange={(e) => setWorkEnd(e.target.value)}
                    className="text-xs px-2 py-1 rounded-lg border border-border/60 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground ml-auto">
                  Kech = {workStart} dan keyin
                </p>
              </div>
            )}
          </SheetHeader>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 custom-scrollbar">

            {/* Stats cards — 3 columns */}
            {isLoading ? (
              <div className="grid grid-cols-3 gap-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted/40 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : data ? (
              <div className="grid grid-cols-3 gap-2">
                <StatCard
                  icon={<Clock className="w-3.5 h-3.5" />}
                  label="Bugun"
                  value={data.stats.today_entry ? fmtTime(data.stats.today_entry) : "Kelmadi"}
                  color={data.stats.today_entry ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}
                />
                <StatCard
                  icon={<TrendingUp className="w-3.5 h-3.5" />}
                  label="O'rtacha kelish"
                  value={data.stats.avg_arrival ?? "—"}
                  color="text-blue-600 dark:text-blue-400"
                />
                <StatCard
                  icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                  label="Davomat"
                  value={`${data.stats.attendance_pct}%`}
                  color={data.stats.attendance_pct >= 80 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600"}
                />
                <StatCard
                  icon={<AlertCircle className="w-3.5 h-3.5" />}
                  label="Kech kelgan"
                  value={`${data.stats.late_count} kun`}
                  color={data.stats.late_count > 0 ? "text-amber-600" : "text-emerald-600 dark:text-emerald-400"}
                />
                <StatCard
                  icon={<CalendarX className="w-3.5 h-3.5" />}
                  label="Kelmagan"
                  value={`${data.stats.absent_count} kun`}
                  color={data.stats.absent_count > 0 ? "text-rose-500" : "text-emerald-600 dark:text-emerald-400"}
                />
                <StatCard
                  icon={<BarChart2 className="w-3.5 h-3.5" />}
                  label="Kech o'rt."
                  value={data.stats.avg_late_min != null ? `${data.stats.avg_late_min} daq` : "—"}
                  color={data.stats.avg_late_min ? "text-amber-600" : "text-muted-foreground"}
                />
              </div>
            ) : null}

            {/* Streak & badges */}
            {!isLoading && data?.timeline && (() => {
              const { streak, onTimeCount, attendancePct } = streakInfo;
              const badges = [];
              if (streak >= 5) badges.push({ icon: <Flame className="w-3.5 h-3.5 text-orange-500" />, label: `🔥 ${streak} kun ketma-ket`, color: "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700 text-orange-700 dark:text-orange-300" });
              if (onTimeCount >= 10) badges.push({ icon: <Award className="w-3.5 h-3.5 text-violet-500" />, label: `🏆 ${onTimeCount}x o'z vaqtida`, color: "bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-700 text-violet-700 dark:text-violet-300" });
              if (attendancePct >= 90) badges.push({ icon: <Zap className="w-3.5 h-3.5 text-emerald-500" />, label: `⚡ ${attendancePct}% davomat`, color: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300" });
              if (!badges.length && streak > 0) badges.push({ icon: <Flame className="w-3.5 h-3.5 text-slate-400" />, label: `${streak} kun ketma-ket`, color: "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400" });
              if (!badges.length) return null;
              return (
                <div className="flex flex-wrap gap-2">
                  {badges.map((b, i) => (
                    <div key={i} className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-full border ${b.color}`}>
                      {b.icon}
                      {b.label}
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* Timeline grid */}
            {isLoading ? (
              <div>
                <div className="h-4 w-24 bg-muted animate-pulse rounded mb-2" />
                <div className="flex flex-wrap gap-1">
                  {[...Array(30)].map((_, i) => (
                    <div key={i} className="w-7 h-7 rounded-md bg-muted/50 animate-pulse" />
                  ))}
                </div>
              </div>
            ) : data?.timeline.length ? (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">
                  Oxirgi {days} kun tarixi
                </p>
                <div className="flex flex-wrap gap-1">
                  {data.timeline.map((day) => (
                    <div
                      key={day.date}
                      title={`${fmtDate(day.date)}${day.entry ? ` — ${fmtTime(day.entry)}` : ""}${day.late_sec ? ` (+${fmtLateSec(day.late_sec)} kech)` : ""}`}
                      className={`w-7 h-7 rounded-md ${STATUS_COLOR[day.status]} cursor-default transition-transform hover:scale-110`}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-3 mt-2">
                  {[
                    { cls: "bg-emerald-500", label: "O'z vaqtida" },
                    { cls: "bg-amber-400", label: "Kech" },
                    { cls: "bg-slate-200 dark:bg-slate-700", label: "Kelmagan" },
                  ].map((l) => (
                    <div key={l.label} className="flex items-center gap-1">
                      <div className={`w-3 h-3 rounded-sm ${l.cls}`} />
                      <span className="text-[10px] text-muted-foreground">{l.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Arrival chart */}
            {isLoading ? (
              <div className="h-40 bg-muted/40 rounded-xl animate-pulse" />
            ) : chartData.length > 1 ? (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">
                  Kelish vaqti trendi (oxirgi {Math.min(21, chartData.length)} kun)
                </p>
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} tickLine={false} />
                    <YAxis
                      domain={[yMin, yMax]}
                      tickFormatter={(v) => `${Math.floor(v / 60)}:${String(v % 60).padStart(2, "0")}`}
                      tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                      tickLine={false}
                    />
                    <Tooltip content={<ChartTooltip workStartMin={workStartMin} />} />
                    <ReferenceLine y={workStartMin} stroke="#10b981" strokeDasharray="4 2" strokeWidth={1.5} />
                    <Bar dataKey="minutes" radius={[3, 3, 0, 0]} maxBarSize={18}>
                      {chartData.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={entry.minutes > workStartMin ? "#f87171" : "#34d399"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <p className="text-[10px] text-muted-foreground text-center">
                  Yashil chiziq — {workStart} (ish boshlanishi)
                </p>
              </div>
            ) : null}

            {/* Recent images */}
            {!isLoading && (data?.recent_images ?? []).length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">So'nggi suratlar</p>
                <div className="flex gap-2 flex-wrap">
                  {data!.recent_images.map((img, i) => (
                    <div key={i} className="relative group cursor-zoom-in" onClick={() => openLightbox(img.image)}>
                      <img
                        src={img.image} alt=""
                        className="w-16 h-16 rounded-lg object-cover border border-border/40 group-hover:shadow-md group-hover:ring-2 group-hover:ring-primary/30 transition-all"
                        loading="lazy"
                      />
                      <p className="absolute -bottom-4 left-0 right-0 text-center text-[9px] text-muted-foreground">
                        {fmtTime(img.time)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Daily timeline detail */}
            {!isLoading && data?.timeline.length ? (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">Kunlik tarix</p>
                <div className="space-y-0.5">
                  {[...data.timeline].reverse().map((day) => (
                    <div key={day.date} className="flex items-center gap-3 py-1.5 border-b border-border/20 last:border-0">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_COLOR[day.status]}`} />
                      <span className="text-[11px] text-muted-foreground w-20 flex-shrink-0">{fmtDate(day.date)}</span>
                      {day.entry ? (
                        <>
                          <span className="text-[11px] font-semibold tabular-nums">{fmtTime(day.entry)}</span>
                          {day.exit && (
                            <span className="text-[10px] text-muted-foreground">→ {fmtTime(day.exit)}</span>
                          )}
                          {day.late_sec > 0 && (
                            <span className="text-[10px] text-amber-500 ml-auto">+{fmtLateSec(day.late_sec)}</span>
                          )}
                        </>
                      ) : (
                        <span className="text-[11px] text-muted-foreground/50">kelmagan</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>

      {/* Lightbox — rendered in body portal to escape Sheet stacking context */}
      {lightbox && createPortal(
        <div
          className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <img
            src={lightbox} alt=""
            className="max-w-full max-h-[85vh] rounded-xl shadow-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>,
        document.body
      )}
    </>
  );
}

function StatCard({
  icon, label, value, color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-muted/30 rounded-xl p-3 flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-[10px] font-medium truncate">{label}</span>
      </div>
      <p className={`text-sm font-bold tabular-nums ${color}`}>{value}</p>
    </div>
  );
}
