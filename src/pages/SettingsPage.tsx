import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { api, MigrationJob } from "@/lib/api";
import { useAnimatedNumber } from "@/hooks/useAnimatedNumber";
import { Skeleton } from "@/components/ui/skeleton";
import {
  HardDrive, Database, Router, Cpu,
  Wifi, CheckCircle, AlertTriangle, ArrowRight,
  Loader2, MoveRight, RefreshCw,
} from "lucide-react";

const ACCOUNT_LABELS: Record<string, string> = {
  primary: "Account 1 (primary)",
  backup1: "Account 2 (backup1)",
  backup2: "Account 3 (backup2)",
};

function MigrationSection({ accountNames }: { accountNames: string[] }) {
  const queryClient = useQueryClient();
  const [source, setSource] = useState("");
  const [dest, setDest] = useState("");
  const [activeJobId, setActiveJobId] = useState<string | null>(null);

  const { data: jobData, refetch: refetchJob } = useQuery({
    queryKey: ["migration-status", activeJobId],
    queryFn: () => api.getMigrationStatus(activeJobId!),
    enabled: !!activeJobId,
    refetchInterval: (q) => {
      const s = q.state.data?.status;
      return s === "running" || s === "listing" || s === "queued" ? 2000 : false;
    },
  });

  const { data: historyData } = useQuery({
    queryKey: ["migration-list"],
    queryFn: api.getMigrationList,
    staleTime: 10_000,
  });

  useEffect(() => {
    if (jobData?.status === "done" || jobData?.status === "partial") {
      queryClient.invalidateQueries({ queryKey: ["storage"] });
      queryClient.invalidateQueries({ queryKey: ["migration-list"] });
    }
  }, [jobData?.status]);

  const mutation = useMutation({
    mutationFn: () => api.startMigration(source, dest),
    onSuccess: (res) => {
      setActiveJobId(res.job_id);
      queryClient.invalidateQueries({ queryKey: ["migration-list"] });
    },
  });

  const isRunning = jobData?.status === "running" || jobData?.status === "listing" || jobData?.status === "queued";
  const pct = jobData && jobData.total > 0 ? Math.round((jobData.copied / jobData.total) * 100) : 0;

  const statusColor: Record<string, string> = {
    done: "text-emerald-600", partial: "text-amber-600",
    error: "text-rose-600", running: "text-blue-600",
    listing: "text-blue-500", queued: "text-muted-foreground",
  };
  const statusLabel: Record<string, string> = {
    done: "Bajarildi", partial: "Qisman bajarildi", error: "Xato",
    running: "Ishlamoqda...", listing: "Fayllar sanalimoqda...", queued: "Navbatda...",
  };

  return (
    <div className="bg-white rounded-2xl border border-border/50 p-6 count-up" style={{ animationDelay: "80ms" }}>
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-lg">
          <MoveRight className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="text-[15px] font-bold">R2 Migration</h3>
          <p className="text-[11px] text-muted-foreground">Fayllarni bir accountdan boshqasiga ko'chirish</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-end gap-3 mb-5">
        <div className="flex-1 min-w-[140px]">
          <label className="text-[11px] text-muted-foreground font-medium mb-1 block">Manba (Source)</label>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            disabled={isRunning}
            className="w-full h-9 px-2.5 text-sm rounded-lg border border-border/60 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">— tanlang —</option>
            {accountNames.map((n) => <option key={n} value={n}>{ACCOUNT_LABELS[n] ?? n}</option>)}
          </select>
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground mb-2 flex-shrink-0" />
        <div className="flex-1 min-w-[140px]">
          <label className="text-[11px] text-muted-foreground font-medium mb-1 block">Manzil (Dest)</label>
          <select
            value={dest}
            onChange={(e) => setDest(e.target.value)}
            disabled={isRunning}
            className="w-full h-9 px-2.5 text-sm rounded-lg border border-border/60 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">— tanlang —</option>
            {accountNames.filter((n) => n !== source).map((n) => <option key={n} value={n}>{ACCOUNT_LABELS[n] ?? n}</option>)}
          </select>
        </div>
        <button
          onClick={() => mutation.mutate()}
          disabled={!source || !dest || isRunning || mutation.isPending}
          className="h-9 px-4 text-sm font-semibold rounded-lg bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {(isRunning || mutation.isPending) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MoveRight className="w-3.5 h-3.5" />}
          Ko'chirish
        </button>
      </div>

      {/* Active job progress */}
      {activeJobId && jobData && (
        <div className="bg-muted/30 rounded-xl p-4 mb-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className={`text-[13px] font-bold ${statusColor[jobData.status] ?? ""}`}>
              {statusLabel[jobData.status] ?? jobData.status}
            </span>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground tabular-nums">
              <span>{jobData.copied} / {jobData.total} fayl</span>
              {isRunning && <RefreshCw className="w-3 h-3 animate-spin" />}
            </div>
          </div>
          {jobData.total > 0 && (
            <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  jobData.status === "error" ? "bg-rose-500"
                  : jobData.status === "done" ? "bg-emerald-500"
                  : "bg-violet-500"
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          )}
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{ACCOUNT_LABELS[jobData.source] ?? jobData.source} → {ACCOUNT_LABELS[jobData.dest] ?? jobData.dest}</span>
            <span>{pct}%</span>
          </div>
          {jobData.failed > 0 && (
            <p className="text-[11px] text-rose-600 font-medium">{jobData.failed} ta fayl xato</p>
          )}
          {jobData.status === "done" && jobData.deleted > 0 && (
            <p className="text-[11px] text-emerald-600 font-medium">✓ {jobData.deleted} ta fayl sourcdan o'chirildi</p>
          )}
          {jobData.error && <p className="text-[11px] text-rose-600">{jobData.error}</p>}
        </div>
      )}

      {/* History */}
      {(historyData?.jobs ?? []).length > 0 && (
        <div>
          <p className="text-[11px] font-semibold text-muted-foreground mb-2 uppercase tracking-wider">So'nggi migratsiyalar</p>
          <div className="space-y-1.5">
            {(historyData?.jobs ?? []).slice(0, 5).map((j) => (
              <div
                key={j.job_id}
                onClick={() => setActiveJobId(j.job_id)}
                className="flex items-center justify-between text-[11px] px-3 py-2 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
              >
                <span className="text-muted-foreground">
                  {ACCOUNT_LABELS[j.source] ?? j.source} → {ACCOUNT_LABELS[j.dest] ?? j.dest}
                </span>
                <div className="flex items-center gap-2">
                  <span className="tabular-nums text-muted-foreground">{j.total} fayl</span>
                  <span className={`font-semibold ${statusColor[j.status] ?? ""}`}>{statusLabel[j.status] ?? j.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

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

      {/* Migration */}
      <MigrationSection accountNames={(storage?.accounts ?? info?.r2?.accounts ?? []).map((a: any) => a.name).filter(Boolean)} />

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
