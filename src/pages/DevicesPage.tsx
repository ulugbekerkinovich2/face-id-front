import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, Device } from "@/lib/api";
import {
  Router,
  Wifi,
  WifiOff,
  ArrowDownToLine,
  ArrowUpFromLine,
  Clock,
  Activity,
  Signal,
  Loader2,
  Database,
  Calendar,
  TrendingUp,
} from "lucide-react";
import { useAnimatedNumber } from "@/hooks/useAnimatedNumber";
import { useLiveStream } from "@/hooks/useLiveStream";
import { Sparkline } from "@/components/dashboard/Sparkline";

function Num({ value, className = "" }: { value: number; className?: string }) {
  const v = useAnimatedNumber(value);
  return <span className={className}>{v.toLocaleString()}</span>;
}

function fmtBig(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

interface DeviceAnalytics {
  device_num: number;
  total: number;
  today: number;
  week: number;
  spark_24h: number[];
  daily_7d: Array<{ date: string; count: number }>;
  peak_hour: number | null;
}

function DeviceCard({ device, index, analytics }: { device: Device; index: number; analytics?: DeviceAnalytics }) {
  const isIn = device.direction === "IN";
  const lastSeen = device.last_seen
    ? new Date(device.last_seen).toLocaleTimeString("uz-UZ", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "--:--:--";

  return (
    <div
      className="animate-in bg-white rounded-xl border border-border/40 overflow-hidden hover:shadow-lg hover:shadow-black/[0.04] transition-all duration-300"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Top accent */}
      <div
        className={`h-1 ${
          device.is_online
            ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
            : "bg-gradient-to-r from-gray-200 to-gray-300"
        }`}
      />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                device.is_online
                  ? "bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/20"
                  : "bg-gray-100"
              }`}
            >
              <Router
                className={`w-[18px] h-[18px] ${
                  device.is_online ? "text-white" : "text-gray-400"
                }`}
              />
            </div>
            <div>
              <p className="text-[13px] font-bold tracking-tight">{device.device_id}</p>
              <p className="text-[11px] text-muted-foreground font-mono mt-0.5">{device.ip}</p>
            </div>
          </div>

          <div
            className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full ${
              device.is_online
                ? "bg-emerald-50 text-emerald-700"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                device.is_online ? "bg-emerald-500 pulse-dot" : "bg-gray-400"
              }`}
            />
            {device.is_online ? "Online" : "Offline"}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-muted/40 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center mb-1">
              {isIn ? (
                <ArrowDownToLine className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <ArrowUpFromLine className="w-3.5 h-3.5 text-rose-500" />
              )}
            </div>
            <p className="text-[10px] text-muted-foreground mb-0.5">Yo'nalish</p>
            <p
              className={`text-xs font-bold ${
                isIn ? "text-emerald-600" : "text-rose-500"
              }`}
            >
              {device.direction}
            </p>
          </div>

          <div className="bg-muted/40 rounded-lg p-3 text-center">
            <Activity className="w-3.5 h-3.5 mx-auto mb-1 text-blue-500" />
            <p className="text-[10px] text-muted-foreground mb-0.5">Bugun</p>
            <p className="text-xs font-bold">{device.today_count}</p>
          </div>

          <div className="bg-muted/40 rounded-lg p-3 text-center">
            <Clock className="w-3.5 h-3.5 mx-auto mb-1 text-amber-500" />
            <p className="text-[10px] text-muted-foreground mb-0.5">Oxirgi</p>
            <p className="text-xs font-bold tabular-nums">{lastSeen}</p>
          </div>
        </div>

        {/* 24h sparkline */}
        {analytics && (
          <div className="mt-4 pt-4 border-t border-border/30">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">24 soat</p>
              {analytics.peak_hour !== null && (
                <p className="text-[10px] text-violet-600 font-bold">
                  Peak: {analytics.peak_hour}:00
                </p>
              )}
            </div>
            <Sparkline
              values={analytics.spark_24h}
              width={260}
              height={36}
              color={isIn ? "#10b981" : "#f43f5e"}
              fillColor={isIn ? "rgba(16,185,129,0.15)" : "rgba(244,63,94,0.12)"}
            />
            <div className="grid grid-cols-3 gap-1 mt-2 text-center">
              <div>
                <p className="text-[9px] text-muted-foreground">Bugun</p>
                <p className="text-[12px] font-extrabold tabular-nums">{analytics.today.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[9px] text-muted-foreground">Hafta</p>
                <p className="text-[12px] font-extrabold tabular-nums">{analytics.week.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[9px] text-muted-foreground">Jami</p>
                <p className="text-[12px] font-extrabold tabular-nums text-violet-600">{fmtBig(analytics.total)}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DevicesPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["devices"],
    queryFn: api.getDevices,
    refetchInterval: 30_000,
  });

  const { data: analytics } = useQuery({
    queryKey: ["devices-analytics"],
    queryFn: api.getDevicesAnalytics,
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  // WS — yangi log kelganda analytics va devices yangilanadi
  useLiveStream<any>(["logs"], () => {
    queryClient.invalidateQueries({ queryKey: ["devices"] });
    queryClient.invalidateQueries({ queryKey: ["devices-analytics"] });
  });

  const devices = data?.devices ?? [];
  const online = devices.filter((d) => d.is_online).length;
  const offline = devices.length - online;
  const analyticsByNum = new Map<number, DeviceAnalytics>(
    (analytics?.devices ?? []).map((d) => [d.device_num, d as DeviceAnalytics]),
  );

  return (
    <div className="p-5 lg:p-6 space-y-5">
      <div className="animate-in flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Qurilmalar</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Face ID qurilmalarning real-vaqt holati
          </p>
        </div>
        {isFetching && !isLoading && <Loader2 className="w-4 h-4 animate-spin text-primary mt-1" />}
      </div>

      {/* Hero counters — premium gradient strip */}
      {analytics && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 animate-in" style={{ animationDelay: "30ms" }}>
          <div className="hero-card bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-2xl p-4 text-white shadow-lg shadow-violet-500/20">
            <div className="flex items-center gap-2 text-white/80 text-[10px] font-bold uppercase tracking-wider">
              <Database className="w-3.5 h-3.5" /> Jami yozuv
            </div>
            <p className="text-[26px] font-extrabold tabular-nums leading-none mt-1.5">
              {fmtBig(analytics.total)}
            </p>
            <p className="text-[10px] text-white/70 mt-0.5"><Num value={analytics.total} /> ta</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-4 text-white shadow-lg shadow-emerald-500/20 hero-card">
            <div className="flex items-center gap-2 text-white/80 text-[10px] font-bold uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5" /> Bugun
            </div>
            <p className="text-[26px] font-extrabold tabular-nums leading-none mt-1.5">
              <Num value={analytics.today} />
            </p>
            <div className="flex items-center gap-2 mt-1 text-[10px]">
              <span className="bg-white/20 rounded-full px-1.5 py-0.5"><ArrowDownToLine className="w-2.5 h-2.5 inline" /> {analytics.today_in}</span>
              <span className="bg-white/20 rounded-full px-1.5 py-0.5"><ArrowUpFromLine className="w-2.5 h-2.5 inline" /> {analytics.today_out}</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-4 text-white shadow-lg shadow-blue-500/20 hero-card">
            <div className="flex items-center gap-2 text-white/80 text-[10px] font-bold uppercase tracking-wider">
              <Activity className="w-3.5 h-3.5" /> 7 kunlik
            </div>
            <p className="text-[26px] font-extrabold tabular-nums leading-none mt-1.5">
              <Num value={analytics.week} />
            </p>
            <p className="text-[10px] text-white/70 mt-0.5">~{Math.round(analytics.week / 7).toLocaleString()}/kun</p>
          </div>

          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-4 text-white shadow-lg shadow-amber-500/20 hero-card">
            <div className="flex items-center gap-2 text-white/80 text-[10px] font-bold uppercase tracking-wider">
              <TrendingUp className="w-3.5 h-3.5" /> 30 kunlik
            </div>
            <p className="text-[26px] font-extrabold tabular-nums leading-none mt-1.5">
              <Num value={analytics.month} />
            </p>
            <p className="text-[10px] text-white/70 mt-0.5">o'rtacha {analytics.avg_daily}/kun</p>
          </div>

          <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl p-4 text-white shadow-lg shadow-rose-500/20 hero-card">
            <div className="flex items-center gap-2 text-white/80 text-[10px] font-bold uppercase tracking-wider">
              <Signal className="w-3.5 h-3.5" /> Online
            </div>
            <p className="text-[26px] font-extrabold tabular-nums leading-none mt-1.5">
              {online}<span className="text-base text-white/70">/{devices.length}</span>
            </p>
            <p className="text-[10px] text-white/70 mt-0.5">
              {offline > 0 ? `${offline} offline` : "✓ hammasi"}
            </p>
          </div>
        </div>
      )}

      {/* Summary pills */}
      <div className="flex flex-wrap gap-2 animate-in" style={{ animationDelay: "50ms" }}>
        {isLoading ? (
          <>
            <div className="h-9 w-24 skeleton rounded-full" />
            <div className="h-9 w-24 skeleton rounded-full" />
            <div className="h-9 w-24 skeleton rounded-full" />
          </>
        ) : (
          <>
            <div className="bg-white rounded-full border border-border/40 px-4 py-2 flex items-center gap-2">
              <Signal className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-sm font-semibold">{devices.length}</span>
              <span className="text-xs text-muted-foreground">Jami</span>
            </div>
            <div className="bg-emerald-50 rounded-full border border-emerald-200/60 px-4 py-2 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 pulse-dot" />
              <span className="text-sm font-semibold text-emerald-700">{online}</span>
              <span className="text-xs text-emerald-600">Online</span>
            </div>
            <div className="bg-gray-50 rounded-full border border-gray-200/60 px-4 py-2 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
              <span className="text-sm font-semibold text-gray-600">{offline}</span>
              <span className="text-xs text-gray-500">Offline</span>
            </div>
          </>
        )}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-[200px] skeleton" />
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {devices.map((device, i) => (
            <DeviceCard
              key={device.device_id}
              device={device}
              index={i}
              analytics={analyticsByNum.get(device.device_num)}
            />
          ))}
          {devices.length === 0 && (
            <div className="col-span-full text-center py-16">
              <Router className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Qurilmalar topilmadi</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
