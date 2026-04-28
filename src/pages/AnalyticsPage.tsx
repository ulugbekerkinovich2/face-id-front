import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAnimatedNumber } from "@/hooks/useAnimatedNumber";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  Database, ScrollText, Heart, Ghost, Users, ShieldCheck,
  Calendar, TrendingUp, Activity, Clock, Wifi,
} from "lucide-react";

function Num({ value }: { value: number }) {
  const v = useAnimatedNumber(value);
  return <>{v.toLocaleString()}</>;
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

export default function AnalyticsPage() {
  const { data: full } = useQuery({ queryKey: ["fullStats"], queryFn: api.getFullStats, staleTime: 600_000 });
  const { data: monthly } = useQuery({ queryKey: ["monthlyChart"], queryFn: api.getMonthlyChart, staleTime: 600_000, enabled: !!full });
  const { data: weekly } = useQuery({ queryKey: ["weeklyChart"], queryFn: () => api.getWeeklyChart(12), staleTime: 600_000, enabled: !!full });
  const { data: hourly } = useQuery({ queryKey: ["hourlyChart"], queryFn: () => api.getHourlyChart(), staleTime: 300_000, enabled: !!full });
  const { data: topUsers } = useQuery({ queryKey: ["topAll"], queryFn: () => api.getTopUsers(30, 10), staleTime: 600_000, enabled: !!full });
  const { data: heartbeat } = useQuery({ queryKey: ["heartbeat"], queryFn: () => api.getHeartbeatStats(7), staleTime: 600_000, enabled: !!full });
  const { data: strangerStats } = useQuery({ queryKey: ["strangerStats"], queryFn: api.getStrangerStats, staleTime: 600_000, enabled: !!full });
  const { data: storage } = useQuery({ queryKey: ["storage"], queryFn: api.getStorageStats, staleTime: 600_000, refetchInterval: 600_000, enabled: !!full });

  const PIE_COLORS = ["#10b981", "#f43f5e"];

  if (!full) {
    return (
      <div className="p-5 lg:p-6 space-y-6">
        <div>
          <Skeleton className="h-8 w-64 rounded-xl mb-2" />
          <Skeleton className="h-4 w-48 rounded-lg" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[120px] rounded-2xl" />)}
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[110px] rounded-2xl" />)}
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <Skeleton className="h-[220px] rounded-2xl" />
          <Skeleton className="h-[220px] rounded-2xl" />
        </div>
        <Skeleton className="h-[380px] rounded-2xl" />
        <div className="grid lg:grid-cols-2 gap-5">
          <Skeleton className="h-[340px] rounded-2xl" />
          <Skeleton className="h-[340px] rounded-2xl" />
        </div>
        <Skeleton className="h-[300px] rounded-2xl" />
        <div className="grid lg:grid-cols-2 gap-5">
          <Skeleton className="h-[400px] rounded-2xl" />
          <Skeleton className="h-[400px] rounded-2xl" />
        </div>
        <Skeleton className="h-[300px] rounded-2xl" />
      </div>
    );
  }

  const a = full?.all_time ?? {};
  const t = full?.today ?? {};
  const w = full?.week ?? {};
  const m = full?.month ?? {};

  return (
    <div className="p-5 lg:p-6 space-y-6">
      <div className="animate-in">
        <h1 className="text-2xl font-extrabold tracking-tight">Statistika & Analitika</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">Butun davr uchun barcha jadvallar</p>
      </div>

      {/* ─── ALL TIME STATS ──────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Jami loglar", value: a.total_logs ?? 0, icon: ScrollText, color: "from-blue-500 to-blue-600" },
          { label: "Jami kirish", value: a.total_entries ?? 0, icon: TrendingUp, color: "from-emerald-500 to-emerald-600" },
          { label: "Jami chiqish", value: a.total_exits ?? 0, icon: Activity, color: "from-rose-500 to-rose-600" },
          { label: "Foydalanuvchilar", value: a.total_users ?? 0, icon: Users, color: "from-violet-500 to-violet-600" },
          { label: "Notanish yuzlar", value: a.total_strangers ?? 0, icon: Ghost, color: "from-orange-500 to-orange-600" },
          { label: "Heartbeatlar", value: a.total_heartbeats ?? 0, icon: Heart, color: "from-pink-500 to-pink-600" },
        ].map((s, i) => (
          <div key={s.label} className="count-up bg-white rounded-2xl border border-border/50 p-4" style={{ animationDelay: `${i * 60}ms` }}>
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3 shadow-lg`}>
              <s.icon className="w-4 h-4 text-white" />
            </div>
            <p className="text-2xl font-extrabold tabular-nums"><Num value={s.value} /></p>
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ─── PERIOD COMPARISON ────────────────────────────── */}
      <div className="grid md:grid-cols-3 gap-4">
        {[
          { label: "Bugun", entries: t.entries ?? 0, exits: t.exits ?? 0, extra: `Ichkarida: ${t.currently_inside ?? 0}`, strangers: t.strangers },
          { label: "Hafta (7 kun)", entries: w.entries ?? 0, exits: w.exits ?? 0 },
          { label: "Oy (30 kun)", entries: m.entries ?? 0, exits: m.exits ?? 0, strangers: m.strangers },
        ].map((p, i) => (
          <div key={p.label} className="count-up bg-white rounded-2xl border border-border/50 p-5" style={{ animationDelay: `${400 + i * 80}ms` }}>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">{p.label}</p>
            <div className="flex gap-6">
              <div>
                <p className="text-[10px] text-emerald-600 font-semibold">Kirish</p>
                <p className="text-xl font-extrabold tabular-nums"><Num value={p.entries} /></p>
              </div>
              <div>
                <p className="text-[10px] text-rose-500 font-semibold">Chiqish</p>
                <p className="text-xl font-extrabold tabular-nums"><Num value={p.exits} /></p>
              </div>
              {p.strangers !== undefined && (
                <div>
                  <p className="text-[10px] text-orange-500 font-semibold">Notanish</p>
                  <p className="text-xl font-extrabold tabular-nums"><Num value={p.strangers} /></p>
                </div>
              )}
            </div>
            {p.extra && <p className="text-[11px] text-blue-600 font-semibold mt-2">{p.extra}</p>}
          </div>
        ))}
      </div>

      {/* ─── SYSTEM INFO ──────────────────────────────────── */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-border/50 p-5 count-up" style={{ animationDelay: "600ms" }}>
          <div className="flex items-center gap-2 mb-3">
            <Database className="w-4 h-4 text-primary" />
            <h3 className="text-[13px] font-bold">Tizim ma'lumotlari</h3>
          </div>
          <div className="space-y-2 text-[13px]">
            <div className="flex justify-between py-1.5 border-b border-border/30">
              <span className="text-muted-foreground">Birinchi yozuv</span>
              <span className="font-semibold">{a.first_log ? new Date(a.first_log).toLocaleDateString("uz-UZ") : "—"}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/30">
              <span className="text-muted-foreground">Oxirgi yozuv</span>
              <span className="font-semibold">{a.last_log ? new Date(a.last_log).toLocaleDateString("uz-UZ") : "—"}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/30">
              <span className="text-muted-foreground">Faol kunlar</span>
              <span className="font-semibold">{a.days_active ?? 0} kun</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/30">
              <span className="text-muted-foreground">Kunlik o'rtacha kirish</span>
              <span className="font-bold text-emerald-600">{a.avg_daily_entries ?? 0}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-muted-foreground">Kunlik o'rtacha chiqish</span>
              <span className="font-bold text-rose-500">{a.avg_daily_exits ?? 0}</span>
            </div>
          </div>
        </div>

        {/* Pie */}
        <div className="bg-white rounded-2xl border border-border/50 p-5 count-up" style={{ animationDelay: "650ms" }}>
          <h3 className="text-[13px] font-bold mb-2">Kirish / Chiqish nisbati (butun davr)</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={[
                  { name: "Kirish", value: a.total_entries ?? 0 },
                  { name: "Chiqish", value: a.total_exits ?? 0 },
                ]} cx="50%" cy="50%" innerRadius={55} outerRadius={78} paddingAngle={3} dataKey="value" strokeWidth={0}>
                  {PIE_COLORS.map((c, i) => <Cell key={i} fill={c} />)}
                </Pie>
                <Tooltip content={<TT />} />
                <Legend formatter={(v) => <span className="text-xs">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ─── MONTHLY CHART ────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-border/50 p-6 count-up" style={{ animationDelay: "700ms" }}>
        <div className="flex items-center gap-2 mb-5">
          <Calendar className="w-4 h-4 text-primary" />
          <h3 className="text-[15px] font-bold">Oylik trend (butun davr)</h3>
        </div>
        {!monthly ? (
          <Skeleton className="h-[300px] rounded-xl" />
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthly?.data ?? []}>
                <defs>
                  <linearGradient id="mE" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="mX" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="mS" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f97316" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} width={50} axisLine={false} tickLine={false} />
                <Tooltip content={<TT />} />
                <Area type="monotone" dataKey="entries" name="Kirish" stroke="#10b981" strokeWidth={2.5} fill="url(#mE)" dot={false} />
                <Area type="monotone" dataKey="exits" name="Chiqish" stroke="#f43f5e" strokeWidth={2.5} fill="url(#mX)" dot={false} />
                <Area type="monotone" dataKey="strangers" name="Notanish" stroke="#f97316" strokeWidth={2} fill="url(#mS)" dot={false} />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ─── WEEKLY + HOURLY ─────────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-border/50 p-6 count-up" style={{ animationDelay: "750ms" }}>
          <h3 className="text-[15px] font-bold mb-5">Haftalik trend (12 hafta)</h3>
          {!weekly ? (
            <Skeleton className="h-[260px] rounded-xl" />
          ) : (
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekly?.data ?? []} barGap={2} barSize={12}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="week" tickFormatter={(v) => v.slice(5)} tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} width={40} axisLine={false} tickLine={false} />
                  <Tooltip content={<TT />} />
                  <Bar dataKey="entries" name="Kirish" fill="#10b981" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="exits" name="Chiqish" fill="#f43f5e" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-border/50 p-6 count-up" style={{ animationDelay: "800ms" }}>
          <h3 className="text-[15px] font-bold mb-5">Bugungi soatlik taqsimot</h3>
          {!hourly ? (
            <Skeleton className="h-[260px] rounded-xl" />
          ) : (
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourly?.data ?? []} barGap={2} barSize={14}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="hour" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} width={30} axisLine={false} tickLine={false} />
                  <Tooltip content={<TT />} />
                  <Bar dataKey="entries" name="Kirish" fill="#10b981" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="exits" name="Chiqish" fill="#f43f5e" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* ─── R2 STORAGE ─────────────────────────────────────── */}
      {storage?.accounts && (
        <div className="bg-white rounded-2xl border border-border/50 p-6 count-up" style={{ animationDelay: "820ms" }}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-500" />
              <h3 className="text-[15px] font-bold">R2 Cloud Storage</h3>
              <span className="text-[10px] text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">10 daqiqada yangilanadi</span>
            </div>
            <div className="text-right">
              <p className="text-lg font-extrabold tabular-nums">{storage.total_size_gb} GB <span className="text-[12px] font-normal text-muted-foreground">/ {storage.total_max_gb} GB</span></p>
              <p className="text-[11px] text-muted-foreground">{storage.total_files?.toLocaleString()} ta fayl</p>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            {storage.accounts.map((acc: any) => (
              <div key={acc.name} className="border border-border/40 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] font-bold">{acc.name}</span>
                  <span className="text-[10px] text-muted-foreground font-mono">{acc.bucket}</span>
                </div>
                {acc.error ? (
                  <p className="text-[11px] text-rose-500">Ulanish xatosi</p>
                ) : (
                  <>
                    <div className="flex items-center justify-between text-[11px] mb-1.5">
                      <span className="text-muted-foreground">{acc.files?.toLocaleString()} fayl</span>
                      <span className="font-bold">{acc.size_gb} / {acc.max_gb} GB</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${
                        acc.size_gb >= 9.5 ? "bg-rose-500 animate-pulse" : acc.used_pct > 70 ? "bg-amber-500" : "bg-blue-500"
                      }`} style={{ width: `${Math.min(acc.used_pct, 100)}%` }} />
                    </div>
                    <p className={`text-[10px] mt-1 text-right font-semibold ${acc.size_gb >= 9.5 ? "text-rose-500" : "text-muted-foreground"}`}>
                      {acc.size_gb >= 9.5 ? "LIMIT!" : `${acc.used_pct}% band`}
                    </p>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── HEARTBEAT (Device Uptime) ────────────────────── */}
      <div className="bg-white rounded-2xl border border-border/50 p-6 count-up" style={{ animationDelay: "850ms" }}>
        <div className="flex items-center gap-2 mb-5">
          <Heart className="w-4 h-4 text-pink-500" />
          <h3 className="text-[15px] font-bold">Qurilmalar Heartbeat (7 kun)</h3>
        </div>
        {!heartbeat ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[160px] rounded-xl" />)}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {(heartbeat?.devices ?? []).map((d: any) => (
              <div key={d.device_id} className="border border-border/40 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] font-bold">{d.device_id}</span>
                  <div className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${d.is_online ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${d.is_online ? "bg-emerald-500 pulse-dot" : "bg-gray-400"}`} />
                    {d.is_online ? "Online" : "Offline"}
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground font-mono">{d.ip}</p>
                <div className="mt-3 space-y-1.5">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground">Uptime</span>
                    <span className={`font-bold ${d.uptime_pct > 90 ? "text-emerald-600" : d.uptime_pct > 50 ? "text-amber-600" : "text-rose-500"}`}>{d.uptime_pct}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${d.uptime_pct > 90 ? "bg-emerald-500" : d.uptime_pct > 50 ? "bg-amber-500" : "bg-rose-500"}`} style={{ width: `${d.uptime_pct}%` }} />
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground">Heartbeatlar</span>
                    <span className="font-semibold">{d.total_heartbeats?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground">Yo'nalish</span>
                    <span className={`font-bold ${d.direction === "IN" ? "text-emerald-600" : "text-rose-500"}`}>{d.direction}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── STRANGER STATS ──────────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-border/50 p-6 count-up" style={{ animationDelay: "900ms" }}>
          <div className="flex items-center gap-2 mb-5">
            <Ghost className="w-4 h-4 text-orange-500" />
            <h3 className="text-[15px] font-bold">Notanish yuzlar statistikasi</h3>
          </div>
          {!strangerStats ? (
            <Skeleton className="h-[280px] rounded-xl" />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 mb-5">
                {[
                  { label: "Jami", value: strangerStats?.total ?? 0 },
                  { label: "Bugun", value: strangerStats?.today ?? 0 },
                  { label: "Hafta", value: strangerStats?.week ?? 0 },
                  { label: "Oy", value: strangerStats?.month ?? 0 },
                ].map((s) => (
                  <div key={s.label} className="bg-orange-50/50 rounded-xl p-3 text-center">
                    <p className="text-lg font-extrabold text-orange-600 tabular-nums"><Num value={s.value} /></p>
                    <p className="text-[10px] text-muted-foreground font-semibold">{s.label}</p>
                  </div>
                ))}
              </div>
              <p className="text-[11px] font-semibold text-muted-foreground mb-2">Qurilma bo'yicha</p>
              <div className="space-y-1.5">
                {(strangerStats?.by_device ?? []).slice(0, 8).map((d: any) => {
                  const max = strangerStats?.by_device?.[0]?.count ?? 1;
                  return (
                    <div key={d.device_id} className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-muted-foreground w-16">{d.device_id}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full rounded-full bg-orange-400" style={{ width: `${(d.count / max) * 100}%` }} />
                      </div>
                      <span className="text-[11px] font-bold tabular-nums w-10 text-right">{d.count}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-border/50 p-6 count-up" style={{ animationDelay: "950ms" }}>
          <h3 className="text-[15px] font-bold mb-5">Notanish yuzlar trendi (30 kun)</h3>
          {!strangerStats ? (
            <Skeleton className="h-[280px] rounded-xl" />
          ) : (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={strangerStats?.daily_trend ?? []} barSize={10}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="date" tickFormatter={(v) => v.slice(5)} tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} width={30} axisLine={false} tickLine={false} />
                  <Tooltip content={<TT />} />
                  <Bar dataKey="count" name="Notanish" fill="#f97316" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* ─── TOP USERS 30 days ────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-border/50 p-6 count-up" style={{ animationDelay: "1000ms" }}>
        <div className="flex items-center gap-2 mb-5">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <h3 className="text-[15px] font-bold">Top 10 tashrifchi (30 kun)</h3>
        </div>
        {!topUsers ? (
          <div className="grid md:grid-cols-2 gap-x-8 gap-y-3">
            {Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-lg" />)}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-x-8 gap-y-3">
            {(topUsers?.data ?? []).map((u: any, i: number) => {
              const max = topUsers?.data?.[0]?.count ?? 1;
              const medals = ["from-yellow-400 to-amber-500", "from-gray-300 to-slate-400", "from-amber-600 to-orange-700"];
              return (
                <div key={u.name} className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${medals[i] ?? "from-slate-400 to-slate-500"} flex items-center justify-center text-[10px] font-bold text-white shadow`}>{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-[13px] font-semibold truncate">{u.full_name}</p>
                      <span className="text-[12px] font-bold tabular-nums ml-2">{u.count}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 mt-1 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-primary/70 to-primary" style={{ width: `${(u.count / max) * 100}%` }} />
                    </div>
                    {u.role && <p className="text-[10px] text-muted-foreground mt-0.5">{u.role}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
