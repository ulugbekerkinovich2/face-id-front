import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAnimatedNumber } from "@/hooks/useAnimatedNumber";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Settings, HardDrive, Database, Router, Cpu,
  Wifi, WifiOff, CheckCircle, AlertTriangle,
} from "lucide-react";

function Num({ value }: { value: number }) {
  const v = useAnimatedNumber(value);
  return <>{v.toLocaleString()}</>;
}

export default function SettingsPage() {
  const { data: info } = useQuery({
    queryKey: ["settings"],
    queryFn: () => api.getSettings(),
    staleTime: 60_000,
  });

  const { data: storage } = useQuery({
    queryKey: ["storage"],
    queryFn: () => api.getStorageStats(),
    staleTime: 60_000,
    refetchOnMount: true,
    // Backend "computing: true" qaytarsa — har 5 sek qayta so'rash
    refetchInterval: (query) => (query.state.data?.computing ? 5000 : false),
  });

  return (
    <div className="p-5 lg:p-6 space-y-6">
      <div className="animate-in">
        <h1 className="text-2xl font-extrabold tracking-tight">Sozlamalar</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">Tizim holati va konfiguratsiya</p>
      </div>

      {/* R2 Storage Accounts */}
      <div className="bg-white rounded-2xl border border-border/50 p-6 count-up" style={{ animationDelay: "50ms" }}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
              <HardDrive className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold">Cloudflare R2 Storage</h3>
              <p className="text-[11px] text-muted-foreground">{info?.r2?.total_accounts ?? 0} ta account ulangan</p>
            </div>
          </div>
          {storage?.computing ? (
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Hisoblanmoqda...
            </div>
          ) : storage && (
            <div className="text-right">
              <p className="text-lg font-extrabold tabular-nums">{storage.total_size_gb} GB</p>
              <p className="text-[10px] text-muted-foreground">/ {storage.total_max_gb} GB jami</p>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {!info && !storage
            ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[160px] rounded-xl" />)
            : (storage?.accounts ?? info?.r2?.accounts ?? []).map((acc: any, i: number) => {
                const hasStats = acc.size_gb !== undefined;
                const isLimit = hasStats && acc.size_gb >= 9.5;
                const pct = hasStats ? acc.used_pct : 0;
                return (
                  <div key={acc.name || i} className={`border rounded-xl p-4 transition-all ${isLimit ? "border-rose-300 bg-rose-50/30" : "border-border/40 hover:border-primary/30"}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isLimit ? "bg-rose-500 animate-pulse" : "bg-emerald-500"}`} />
                        <span className="text-[13px] font-bold">{acc.name}</span>
                      </div>
                      {isLimit ? (
                        <AlertTriangle className="w-4 h-4 text-rose-500" />
                      ) : (
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground font-mono mb-3 truncate">{acc.bucket}</p>
                    {hasStats ? (
                      <>
                        <div className="flex items-center justify-between text-[11px] mb-1.5">
                          <span className="text-muted-foreground">{acc.files?.toLocaleString()} fayl</span>
                          <span className="font-bold">{acc.size_gb} / {acc.max_gb} GB</span>
                        </div>
                        <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${
                            isLimit ? "bg-rose-500 animate-pulse" : pct > 70 ? "bg-amber-500" : "bg-blue-500"
                          }`} style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                        <p className={`text-[10px] mt-1.5 text-right font-semibold ${isLimit ? "text-rose-500" : "text-muted-foreground"}`}>
                          {isLimit ? "LIMIT! Yangi account qo'shing" : `${pct}% band`}
                        </p>
                      </>
                    ) : (
                      <p className="text-[11px] text-emerald-600 font-medium">Ulangan</p>
                    )}
                  </div>
                );
              })
          }
          {(info || storage) && (
            <div className="border-2 border-dashed border-border/40 rounded-xl p-4 flex flex-col items-center justify-center text-center hover:border-primary/40 transition-colors cursor-pointer min-h-[140px]">
              <div className="w-10 h-10 rounded-full bg-muted/60 flex items-center justify-center mb-2">
                <span className="text-xl text-muted-foreground">+</span>
              </div>
              <p className="text-[12px] font-semibold text-muted-foreground">Yangi R2 account</p>
              <p className="text-[10px] text-muted-foreground/60 mt-0.5">.env faylga qo'shing</p>
            </div>
          )}
        </div>

        <div className="mt-4 p-3 bg-blue-50/50 rounded-lg">
          <p className="text-[11px] text-blue-700 font-medium">
            Yangi R2 account qo'shish uchun serverda <code className="bg-blue-100 px-1 rounded">.env</code> faylga kalitlarni qo'shing:
          </p>
          <pre className="text-[10px] text-blue-600/80 mt-1.5 font-mono">
{`R2_BACKUP3_ACCESS_KEY_ID=...
R2_BACKUP3_SECRET_ACCESS_KEY=...
R2_BACKUP3_ENDPOINT_URL=https://...r2.cloudflarestorage.com
R2_BACKUP3_BUCKET_NAME=bucket-name`}
          </pre>
        </div>
      </div>

      {/* Devices */}
      <div className="bg-white rounded-2xl border border-border/50 p-6 count-up" style={{ animationDelay: "100ms" }}>
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
            <Router className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-[15px] font-bold">Qurilmalar</h3>
            <p className="text-[11px] text-muted-foreground">{info?.devices?.total ?? 0} ta turniket ulangan</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {!info
            ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-lg" />)
            : (info?.devices?.list ?? []).map((d: any) => (
              <div key={d.id} className="bg-muted/30 rounded-lg px-3 py-2.5 flex items-center gap-2">
                <Wifi className="w-3.5 h-3.5 text-emerald-500" />
                <div className="min-w-0">
                  <p className="text-[11px] font-bold truncate">{d.id}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">{d.ip}</p>
                </div>
              </div>
            ))
          }
        </div>
      </div>

      {/* Database */}
      <div className="bg-white rounded-2xl border border-border/50 p-6 count-up" style={{ animationDelay: "150ms" }}>
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-lg">
            <Database className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-[15px] font-bold">Database</h3>
            <p className="text-[11px] text-muted-foreground">PostgreSQL &middot; {info?.database?.host ?? "127.0.0.1"}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {!info
            ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[80px] rounded-lg" />)
            : Object.entries(info?.database?.tables ?? {}).map(([name, count]: any) => (
              <div key={name} className="bg-muted/30 rounded-lg px-3 py-3 text-center">
                <p className="text-lg font-extrabold tabular-nums"><Num value={count} /></p>
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mt-0.5">{name}</p>
              </div>
            ))
          }
        </div>
      </div>

      {/* System */}
      <div className="bg-white rounded-2xl border border-border/50 p-6 count-up" style={{ animationDelay: "200ms" }}>
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg">
            <Cpu className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-[15px] font-bold">Tizim</h3>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <div className="flex justify-between py-2 border-b border-border/20">
            <span className="text-[12px] text-muted-foreground">Cache</span>
            <span className="text-[12px] font-semibold">{info?.cache?.backend ?? "Redis"}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-border/20">
            <span className="text-[12px] text-muted-foreground">Cache URL</span>
            <span className="text-[12px] font-mono text-muted-foreground">{info?.cache?.url ?? "redis://127.0.0.1:6379"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
