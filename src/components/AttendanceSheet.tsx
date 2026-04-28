import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell,
} from "recharts";
import { User, Clock, TrendingUp, AlertCircle, CalendarX, X, Flame, Award, Zap } from "lucide-react";

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

const STATUS_COLOR = {
  on_time: "bg-emerald-500",
  late: "bg-amber-400",
  absent: "bg-slate-200",
};

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const min = payload[0]?.value as number;
  const h = Math.floor(min / 60);
  const m = min % 60;
  const isLate = min > 540;
  return (
    <div className="bg-white rounded-lg shadow-xl border border-border/30 px-3 py-2 text-xs">
      <p className="font-semibold text-muted-foreground">{label}</p>
      <p className={`font-bold ${isLate ? "text-rose-500" : "text-emerald-600"}`}>
        {`${h}:${String(m).padStart(2, "0")}`} {isLate ? "⚠ kech" : "✓"}
      </p>
    </div>
  );
};

export default function AttendanceSheet({ name, open, onClose }: Props) {
  const [days, setDays] = useState(30);
  const [lightbox, setLightbox] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["attendance", name, days],
    queryFn: () => api.getUserAttendance(name!, days),
    enabled: !!name && open,
    staleTime: 60_000,
  });

  const chartData = (data?.arrival_chart ?? []).slice(-14).map((d) => ({
    date: fmtDate(d.date),
    minutes: d.minutes,
  }));

  return (
    <>
      <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
        <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col overflow-hidden">
          <SheetHeader className="px-5 pt-5 pb-4 border-b border-border/40 flex-shrink-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <SheetTitle className="text-base font-bold truncate">
                  {isLoading ? (
                    <div className="h-5 w-40 bg-muted animate-pulse rounded" />
                  ) : (
                    data?.full_name || name
                  )}
                </SheetTitle>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">{name}</p>
                {data?.role && (
                  <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                    {data.role}
                  </span>
                )}
              </div>

              {/* Avatar */}
              <div className="flex-shrink-0">
                {isLoading ? (
                  <div className="w-14 h-14 rounded-xl bg-muted animate-pulse" />
                ) : data?.image ? (
                  <img
                    src={data.image} alt=""
                    className="w-14 h-14 rounded-xl object-cover border-2 border-border/40 cursor-pointer"
                    onClick={() => setLightbox(data.image)}
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                    <User className="w-6 h-6 text-slate-400" />
                  </div>
                )}
              </div>
            </div>

            {/* Days selector */}
            <div className="flex items-center gap-1 mt-2">
              {[7, 14, 30].map((d) => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={`text-[11px] font-medium px-2.5 py-1 rounded-md transition-colors ${
                    days === d
                      ? "bg-primary text-white"
                      : "bg-muted/60 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {d} kun
                </button>
              ))}
            </div>
          </SheetHeader>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 custom-scrollbar">

            {/* Stats cards */}
            {isLoading ? (
              <div className="grid grid-cols-2 gap-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted/40 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : data ? (
              <div className="grid grid-cols-2 gap-2">
                <StatCard
                  icon={<Clock className="w-3.5 h-3.5" />}
                  label="Bugun"
                  value={data.stats.today_entry ? fmtTime(data.stats.today_entry) : "Kelmadi"}
                  color={data.stats.today_entry ? "text-emerald-600" : "text-muted-foreground"}
                />
                <StatCard
                  icon={<TrendingUp className="w-3.5 h-3.5" />}
                  label="O'rtacha kelish"
                  value={data.stats.avg_arrival ?? "—"}
                  color="text-blue-600"
                />
                <StatCard
                  icon={<AlertCircle className="w-3.5 h-3.5" />}
                  label="Kech kelgan"
                  value={`${data.stats.late_count} kun`}
                  color={data.stats.late_count > 0 ? "text-amber-600" : "text-emerald-600"}
                />
                <StatCard
                  icon={<CalendarX className="w-3.5 h-3.5" />}
                  label="Kelmagan"
                  value={`${data.stats.absent_count} kun`}
                  color={data.stats.absent_count > 0 ? "text-rose-500" : "text-emerald-600"}
                />
              </div>
            ) : null}

            {/* Streak & badges */}
            {!isLoading && data?.timeline && (() => {
              const tl = [...data.timeline].reverse();
              let streak = 0;
              for (const d of tl) {
                if (d.status === "on_time" || d.status === "late") streak++;
                else break;
              }
              const onTimeCount = data.timeline.filter(d => d.status === "on_time").length;
              const total = data.timeline.filter(d => d.status !== "absent").length;
              const pct = total > 0 ? Math.round((onTimeCount / data.stats.total_entries + (data.stats.late_count > 0 ? data.stats.late_count : 0)) * 100) : 0;
              const attendancePct = total > 0 ? Math.round(total / data.timeline.length * 100) : 0;

              const badges = [];
              if (streak >= 5) badges.push({ icon: <Flame className="w-3.5 h-3.5 text-orange-500" />, label: `🔥 ${streak} kun ketma-ket`, color: "bg-orange-50 border-orange-200 text-orange-700" });
              if (onTimeCount >= 10) badges.push({ icon: <Award className="w-3.5 h-3.5 text-violet-500" />, label: `🏆 ${onTimeCount}x o'z vaqtida`, color: "bg-violet-50 border-violet-200 text-violet-700" });
              if (attendancePct >= 90) badges.push({ icon: <Zap className="w-3.5 h-3.5 text-emerald-500" />, label: `⚡ ${attendancePct}% davomat`, color: "bg-emerald-50 border-emerald-200 text-emerald-700" });

              if (!badges.length && streak > 0) badges.push({ icon: <Flame className="w-3.5 h-3.5 text-slate-400" />, label: `${streak} kun ketma-ket`, color: "bg-slate-50 border-slate-200 text-slate-600" });
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
                    { cls: "bg-slate-200", label: "Kelmagan" },
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
              <div className="h-36 bg-muted/40 rounded-xl animate-pulse" />
            ) : chartData.length > 1 ? (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">
                  Kelish vaqti trendi (oxirgi {Math.min(14, chartData.length)} kun)
                </p>
                <ResponsiveContainer width="100%" height={130}>
                  <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#94a3b8" }} tickLine={false} />
                    <YAxis
                      domain={[480, 660]}
                      tickFormatter={(v) => `${Math.floor(v / 60)}:${String(v % 60).padStart(2, "0")}`}
                      tick={{ fontSize: 9, fill: "#94a3b8" }}
                      tickLine={false}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <ReferenceLine y={540} stroke="#10b981" strokeDasharray="4 2" strokeWidth={1.5} />
                    <Bar dataKey="minutes" radius={[3, 3, 0, 0]} maxBarSize={20}>
                      {chartData.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={entry.minutes > 540 ? "#f87171" : "#34d399"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <p className="text-[10px] text-muted-foreground text-center">
                  Yashil chiziq — 09:00 (ish boshlanishi)
                </p>
              </div>
            ) : null}

            {/* Recent images */}
            {!isLoading && (data?.recent_images ?? []).length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">So'nggi suratlar</p>
                <div className="flex gap-2 flex-wrap">
                  {data!.recent_images.map((img, i) => (
                    <div key={i} className="relative group cursor-pointer" onClick={() => setLightbox(img.image)}>
                      <img
                        src={img.image} alt=""
                        className="w-14 h-14 rounded-lg object-cover border border-border/40 group-hover:shadow-md transition-all"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 rounded-lg bg-black/0 group-hover:bg-black/10 transition-all" />
                      <p className="absolute -bottom-4 left-0 right-0 text-center text-[9px] text-muted-foreground">
                        {fmtTime(img.time)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timeline detail */}
            {!isLoading && data?.timeline.length ? (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">Kunlik tarix</p>
                <div className="space-y-1">
                  {[...data.timeline].reverse().slice(0, 14).map((day) => (
                    <div key={day.date} className="flex items-center gap-3 py-1.5 border-b border-border/20 last:border-0">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_COLOR[day.status]}`} />
                      <span className="text-[11px] text-muted-foreground w-20 flex-shrink-0">{fmtDate(day.date)}</span>
                      {day.entry ? (
                        <>
                          <span className="text-[11px] font-medium tabular-nums">{fmtTime(day.entry)}</span>
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

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <img src={lightbox} alt="" className="max-w-full max-h-[85vh] rounded-xl shadow-2xl" />
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
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
        <span className="text-[10px] font-medium">{label}</span>
      </div>
      <p className={`text-sm font-bold tabular-nums ${color}`}>{value}</p>
    </div>
  );
}
