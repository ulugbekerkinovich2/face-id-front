import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { usePermission } from "@/hooks/usePermission";
import {
  ImageOff, Search, RefreshCw, Loader2, CheckCircle2, AlertTriangle,
  ChevronLeft, ChevronRight, Zap,
} from "lucide-react";

interface JobState {
  job_id: string;
  name: string | null;
  total: number;
  fetched: number;
  failed: number;
  status: string;
}

function JobToast({ job, onClose }: { job: JobState; onClose: () => void }) {
  const { data } = useQuery({
    queryKey: ["refetch-status", job.job_id],
    queryFn: () => api.refetchImagesStatus(job.job_id),
    refetchInterval: (q) => {
      const s = q.state.data?.status;
      return s === "running" || s === "queued" ? 1500 : false;
    },
  });

  useEffect(() => {
    if (!data) return;
    if (data.status === "done" || data.status === "partial") {
      const timer = setTimeout(onClose, 6000);
      return () => clearTimeout(timer);
    }
  }, [data?.status]);

  if (!data) return null;
  const pct = data.total > 0 ? Math.round((data.fetched / data.total) * 100) : 0;
  const isRunning = data.status === "running" || data.status === "queued";
  const isDone = data.status === "done";
  const isPartial = data.status === "partial";

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[360px] bg-white rounded-2xl shadow-2xl border border-violet-200 p-4 animate-in">
      <div className="flex items-center gap-2 mb-2">
        {isRunning && <Loader2 className="w-4 h-4 animate-spin text-violet-600" />}
        {isDone && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
        {isPartial && <AlertTriangle className="w-4 h-4 text-amber-600" />}
        <span className="text-[12px] font-bold flex-1">
          Rasm tortish — {job.name || "Hammasi"}
        </span>
        <button onClick={onClose} className="text-[11px] text-muted-foreground hover:text-foreground">×</button>
      </div>
      <div className="flex items-center justify-between text-[11px] mb-1.5">
        <span className="font-semibold tabular-nums">{data.fetched.toLocaleString()} / {data.total.toLocaleString()}</span>
        <span className="font-bold tabular-nums">{pct}%</span>
      </div>
      <div className="w-full h-2 rounded-full bg-violet-50 overflow-hidden">
        <div className={`h-full rounded-full ${isPartial ? "bg-amber-500" : isDone ? "bg-emerald-500" : "bg-violet-500"} transition-all`}
             style={{ width: `${pct}%`, transitionDuration: "400ms" }} />
      </div>
      {data.failed > 0 && (
        <p className="text-[10px] text-rose-600 mt-2">⚠ {data.failed} ta xato</p>
      )}
    </div>
  );
}

export default function MissingImagesPage() {
  const qc = useQueryClient();
  const canRefetch = usePermission("logs.view");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [activeJob, setActiveJob] = useState<JobState | null>(null);
  const lastJobRef = useRef<string | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["missing-images", page, search],
    queryFn: () => api.missingImages({ page, per_page: 50, search }),
    placeholderData: (prev: any) => prev,
  });

  // Job tugagach ro'yxatni invalidate qilish
  const { data: jobStatus } = useQuery({
    queryKey: ["refetch-status", activeJob?.job_id],
    queryFn: () => api.refetchImagesStatus(activeJob!.job_id),
    enabled: !!activeJob,
    refetchInterval: 1500,
  });
  useEffect(() => {
    if (jobStatus && (jobStatus.status === "done" || jobStatus.status === "partial")) {
      if (lastJobRef.current !== activeJob?.job_id) {
        lastJobRef.current = activeJob?.job_id ?? null;
        qc.invalidateQueries({ queryKey: ["missing-images"] });
      }
    }
  }, [jobStatus?.status]);

  const runMut = useMutation({
    mutationFn: (name: string | null) =>
      api.refetchImagesStart({ name, limit: name ? 5000 : 1000 }),
    onSuccess: (res, name) => {
      setActiveJob({
        job_id: res.job_id, name: name,
        total: 0, fetched: 0, failed: 0, status: res.status,
      });
      toast.success(`Job ishga tushdi: ${name || "Hammasi"}`);
    },
    onError: () => toast.error("Job ishga tushira olmadik"),
  });

  const rows = data?.data ?? [];
  const summary = data?.summary;

  return (
    <div className="p-5 lg:p-6 space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3 animate-in">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <ImageOff className="w-6 h-6 text-amber-600" /> Rasmsiz log'lar
          </h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Foydalanuvchilarning rasmsiz yozuvlari — qurilmadan qaytadan tortish mumkin
          </p>
        </div>
        {canRefetch && (
          <button
            onClick={() => {
              if (confirm("Barcha rasmsiz log'lar uchun rasm tortish (1000 tagacha)? Bu bir necha daqiqa olishi mumkin.")) {
                runMut.mutate(null);
              }
            }}
            disabled={runMut.isPending}
            className="h-10 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50"
          >
            {runMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            Hammasini tortish
          </button>
        )}
      </div>

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 animate-in">
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-4 text-white shadow-lg shadow-amber-500/20">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/80">Jami rasmsiz log</p>
            <p className="text-[28px] font-extrabold tabular-nums leading-none mt-1.5">
              {summary.total_missing.toLocaleString()}
            </p>
          </div>
          <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl p-4 text-white shadow-lg shadow-rose-500/20">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/80">Foydalanuvchi soni</p>
            <p className="text-[28px] font-extrabold tabular-nums leading-none mt-1.5">
              {summary.affected_users.toLocaleString()}
            </p>
          </div>
          <div className="bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-2xl p-4 text-white shadow-lg shadow-violet-500/20">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/80">O'rtacha (user'iga)</p>
            <p className="text-[28px] font-extrabold tabular-nums leading-none mt-1.5">
              {summary.affected_users > 0 ? Math.round(summary.total_missing / summary.affected_users) : 0}
            </p>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Passport yoki ism..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { setSearch(searchInput.trim()); setPage(1); } }}
            className="w-full h-10 pl-8 pr-3 text-sm rounded-lg border border-border/60 bg-white"
          />
        </div>
        <button onClick={() => { setSearch(searchInput.trim()); setPage(1); }}
                className="h-10 px-4 text-sm font-semibold rounded-lg bg-primary text-white hover:bg-primary/90">
          Qidirish
        </button>
        <button onClick={() => refetch()} className="h-10 w-10 rounded-lg border border-border/60 flex items-center justify-center hover:bg-muted">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-border/50 overflow-hidden animate-in">
        {isLoading && rows.length === 0 ? (
          <div className="p-5 space-y-2">
            {[...Array(8)].map((_, i) => <div key={i} className="h-14 skeleton" />)}
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center py-16">
            <CheckCircle2 className="w-10 h-10 text-emerald-500/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Rasmsiz log'lar topilmadi ✓</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/40 bg-muted/30">
                {["#", "Foydalanuvchi", "Lavozim", "Rasmsiz", "Jami", "%", "Amal"].map(h => (
                  <th key={h} className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((u, i) => (
                <tr key={u.name} className="border-b border-border/15 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 text-xs text-muted-foreground">{(page - 1) * 50 + i + 1}</td>
                  <td className="px-4 py-3">
                    <p className="text-[13px] font-bold">{u.full_name || "(noma'lum)"}</p>
                    <p className="text-[11px] text-muted-foreground font-mono">{u.name}</p>
                  </td>
                  <td className="px-4 py-3">
                    {u.role && (
                      <span className="text-[10px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">{u.role}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[14px] font-extrabold text-amber-600 tabular-nums">{u.missing.toLocaleString()}</span>
                  </td>
                  <td className="px-4 py-3 text-[12px] text-muted-foreground tabular-nums">{u.total_logs.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-amber-100 overflow-hidden">
                        <div className="h-full rounded-full bg-amber-500" style={{ width: `${u.missing_pct}%` }} />
                      </div>
                      <span className="text-[11px] font-bold tabular-nums">{u.missing_pct}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {canRefetch && (
                      <button
                        onClick={() => runMut.mutate(u.name)}
                        disabled={runMut.isPending}
                        className="h-8 px-3 rounded-lg text-[11px] font-bold bg-violet-500 text-white hover:bg-violet-600 disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {runMut.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                        Tortish
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {data && data.total_pages > 1 && (
        <div className="flex items-center justify-between gap-2">
          <p className="text-[12px] text-muted-foreground">
            {(page - 1) * 50 + 1}–{Math.min(page * 50, data.total)} / {data.total}
          </p>
          <div className="flex gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="h-8 w-8 flex items-center justify-center rounded-lg border border-border/60 hover:bg-muted disabled:opacity-40">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setPage(p => p + 1)} disabled={page >= data.total_pages}
                    className="h-8 w-8 flex items-center justify-center rounded-lg border border-border/60 hover:bg-muted disabled:opacity-40">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Persistent floating job toast */}
      {activeJob && <JobToast job={activeJob} onClose={() => setActiveJob(null)} />}
    </div>
  );
}
