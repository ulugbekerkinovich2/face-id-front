import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, VerifyJob } from "@/lib/api";
import { usePermission } from "@/hooks/usePermission";
import {
  ImageOff, Search, Play, Loader2, CheckCircle2, AlertTriangle,
  Database, ScanLine, Trash2, Download, Activity,
} from "lucide-react";

const PHASE_LABEL: Record<string, string> = {
  queued: "Navbatda",
  scan: "1. Skanerlash (R2 lar bo'yicha)",
  clean: "2. DB tozalash",
  refetch: "3. Qurilmadan tortish",
  done: "Yakunlandi",
};

const PHASE_PCT = (j: VerifyJob): number => {
  if (j.total === 0) return 0;
  if (j.phase === "scan") return Math.round((j.scanned / j.total) * 100);
  if (j.phase === "clean") return 100;  // tez bo'ladi
  if (j.phase === "refetch") {
    if (j.missing === 0) return 100;
    return Math.round(((j.fetched + j.failed_fetch) / j.missing) * 100);
  }
  if (j.phase === "done") return 100;
  return 0;
};

function StatChip({ label, value, color = "violet" }: { label: string; value: number; color?: string }) {
  const colorMap: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    rose: "bg-rose-50 text-rose-700 border-rose-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    violet: "bg-violet-50 text-violet-700 border-violet-200",
    slate: "bg-slate-50 text-slate-700 border-slate-200",
  };
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${colorMap[color]}`}>
      <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">{label}</span>
      <span className="text-[14px] font-extrabold tabular-nums">{value.toLocaleString()}</span>
    </div>
  );
}

function PhaseTimeline({ job }: { job: VerifyJob }) {
  const phases = ["scan", "clean", "refetch", "done"] as const;
  const current = job.phase;
  const isDone = (p: string) => phases.indexOf(p as any) < phases.indexOf(current as any) || job.status === "done" || job.status === "partial";
  const isActive = (p: string) => p === current && job.status === "running";

  return (
    <div className="flex items-center gap-2 mb-4">
      {phases.map((p, i) => (
        <div key={p} className="flex items-center gap-2 flex-1">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-extrabold transition-all ${
            isActive(p) ? "bg-violet-500 text-white scale-110 shadow-lg shadow-violet-500/40 ring-4 ring-violet-200" :
            isDone(p) ? "bg-emerald-500 text-white" :
            "bg-slate-200 text-slate-500"
          }`}>
            {isDone(p) ? "✓" : i + 1}
          </div>
          <span className={`text-[11px] font-semibold whitespace-nowrap ${
            isActive(p) ? "text-violet-700" : isDone(p) ? "text-emerald-700" : "text-muted-foreground"
          }`}>
            {p === "scan" ? "Skanerlash" : p === "clean" ? "DB tozalash" : p === "refetch" ? "Qurilmadan tortish" : "Tugadi"}
          </span>
          {i < phases.length - 1 && (
            <div className={`flex-1 h-0.5 rounded-full ${isDone(phases[i + 1]) || isActive(phases[i + 1]) ? "bg-emerald-300" : "bg-slate-200"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

function JobCard({ job }: { job: VerifyJob }) {
  const pct = PHASE_PCT(job);
  const phaseLabel = PHASE_LABEL[job.phase] ?? job.phase;
  const isRunning = job.status === "running" || job.status === "queued";
  const isDone = job.status === "done" || job.status === "partial";

  return (
    <div className={`rounded-2xl border p-5 transition-all ${
      isDone ? "border-emerald-200 bg-emerald-50/30"
      : isRunning ? "border-violet-300 bg-gradient-to-br from-violet-50/60 via-white to-blue-50/30"
      : "border-rose-200 bg-rose-50/30"
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {isRunning && <Loader2 className="w-4 h-4 animate-spin text-violet-600" />}
          {isDone && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
          {job.status === "error" && <AlertTriangle className="w-4 h-4 text-rose-600" />}
          <span className={`text-[13px] font-bold ${isDone ? "text-emerald-700" : isRunning ? "text-violet-700" : "text-rose-700"}`}>
            {phaseLabel}
          </span>
          {(job.since || job.until) && (
            <span className="text-[10px] text-muted-foreground">
              · {job.since ?? "..."} → {job.until ?? "..."}
            </span>
          )}
        </div>
        <span className="text-[11px] font-bold tabular-nums">{pct}%</span>
      </div>

      <PhaseTimeline job={job} />

      <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden mb-3">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isDone ? "bg-emerald-500" : isRunning ? "bg-violet-500 animate-pulse" : "bg-rose-500"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <StatChip label="Jami" value={job.total} color="slate" />
        <StatChip label="Topildi" value={job.found} color="emerald" />
        <StatChip label="Yo'q" value={job.missing} color="rose" />
        <StatChip label="Cache" value={job.cached} color="blue" />
        {job.cleaned > 0 && <StatChip label="Tozalandi" value={job.cleaned} color="amber" />}
        {job.do_refetch && (
          <>
            <StatChip label="Tortildi" value={job.fetched} color="violet" />
            <StatChip label="Tortib bo'lmadi" value={job.failed_fetch} color="rose" />
          </>
        )}
      </div>

      {job.errors && job.errors.length > 0 && (
        <details className="mt-3">
          <summary className="text-[11px] text-rose-600 cursor-pointer font-semibold">
            {job.errors.length} xatolik
          </summary>
          <div className="mt-2 max-h-32 overflow-y-auto space-y-1 text-[10px] font-mono">
            {job.errors.slice(-10).map((e, i) => (
              <div key={i} className="text-rose-700">log#{e.id}: {e.error}</div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

export default function ImageHealthPage() {
  const qc = useQueryClient();
  const canRun = usePermission("logs.view");
  const [activeJobId, setActiveJobId] = useState<string | null>(null);

  // Form
  const today = new Date();
  const monthAgo = new Date(today.getTime() - 30 * 86400_000);
  const [since, setSince] = useState(monthAgo.toISOString().slice(0, 10));
  const [until, setUntil] = useState(today.toISOString().slice(0, 10));
  const [limit, setLimit] = useState(0);
  const [doRefetch, setDoRefetch] = useState(true);
  const [workers, setWorkers] = useState(16);

  // Active job polling
  const { data: activeJob } = useQuery({
    queryKey: ["verify-job", activeJobId],
    queryFn: () => api.verifyImagesStatus(activeJobId!),
    enabled: !!activeJobId,
    refetchInterval: (q) => {
      const s = q.state.data?.status;
      return s === "running" || s === "queued" ? 1500 : false;
    },
  });

  // History (last 20)
  const { data: history } = useQuery({
    queryKey: ["verify-history"],
    queryFn: api.verifyImagesHistory,
    refetchInterval: 5000,
  });

  // On done — refresh history + invalidate logs
  useEffect(() => {
    if (activeJob && (activeJob.status === "done" || activeJob.status === "partial")) {
      qc.invalidateQueries({ queryKey: ["verify-history"] });
      qc.invalidateQueries({ queryKey: ["missing-images"] });
      qc.invalidateQueries({ queryKey: ["logs"] });
    }
  }, [activeJob?.status]);

  const startMut = useMutation({
    mutationFn: () => api.verifyImagesStart({
      since: since || null, until: until || null,
      limit, do_refetch: doRefetch, workers,
    }),
    onSuccess: (res) => {
      setActiveJobId(res.job_id);
      qc.invalidateQueries({ queryKey: ["verify-history"] });
      toast.success("Job ishga tushdi");
    },
    onError: () => toast.error("Job ishga tushira olmadik"),
  });

  return (
    <div className="p-5 lg:p-6 space-y-5">
      {/* Header */}
      <div className="animate-in flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <ScanLine className="w-6 h-6 text-violet-600" /> Rasm sog'lig'i
          </h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            DB'dagi rasmlar barcha R2 account'larda mavjudligini tekshirish va tiklash
          </p>
        </div>
      </div>

      {/* Hero — 4 phase explanation */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {[
          { i: 1, icon: Search, t: "Skanerlash", d: "Har log uchun image yo'lini 4 ta R2'da head_object", color: "from-blue-500 to-cyan-600" },
          { i: 2, icon: Database, t: "Cache tuzatish", d: "Topilgan rasm → Redis location yangilanadi", color: "from-emerald-500 to-teal-600" },
          { i: 3, icon: Trash2, t: "DB tozalash", d: "Topilmaganlar DB'da bo'shatiladi (image='')", color: "from-amber-500 to-orange-600" },
          { i: 4, icon: Download, t: "Qurilmadan tortish", d: "Bo'shatilganlarni qurilma buffer'idan qaytarib tortish", color: "from-violet-500 to-fuchsia-600" },
        ].map((p, i) => (
          <div key={p.i} className={`rounded-2xl bg-gradient-to-br ${p.color} text-white p-4 shadow-lg hero-card animate-in`} style={{ animationDelay: `${i * 80}ms` }}>
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-[11px] font-extrabold">{p.i}</span>
              <p.icon className="w-4 h-4" />
              <span className="text-[13px] font-bold">{p.t}</span>
            </div>
            <p className="text-[11px] text-white/85 mt-2 leading-tight">{p.d}</p>
          </div>
        ))}
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl border border-border/50 p-5 animate-in">
        <h3 className="text-[14px] font-bold mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-violet-600" /> Yangi tekshiruv
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">Since</label>
            <input type="date" value={since} onChange={(e) => setSince(e.target.value)}
                   className="w-full h-10 px-3 text-sm rounded-lg border border-border/60" />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">Until</label>
            <input type="date" value={until} onChange={(e) => setUntil(e.target.value)}
                   className="w-full h-10 px-3 text-sm rounded-lg border border-border/60" />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">Limit (0 = chegarasiz)</label>
            <input type="number" min={0} step={1000} value={limit} onChange={(e) => setLimit(+e.target.value)}
                   className="w-full h-10 px-3 text-sm rounded-lg border border-border/60" />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">Workers</label>
            <input type="number" min={1} max={64} value={workers} onChange={(e) => setWorkers(+e.target.value)}
                   className="w-full h-10 px-3 text-sm rounded-lg border border-border/60" />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-[13px] font-medium h-10 cursor-pointer">
              <input type="checkbox" checked={doRefetch} onChange={(e) => setDoRefetch(e.target.checked)}
                     className="w-4 h-4 accent-violet-600" />
              Qurilmadan tortish (4-faza)
            </label>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border/30">
          <p className="text-[11px] text-muted-foreground flex-1">
            Phase 1-3 har doim ishlaydi. Phase 4 — qurilma ring-buffer'iga bog'liq, eski rasmlar bo'lmasligi mumkin.
          </p>
          {canRun && (
            <button
              onClick={() => startMut.mutate()}
              disabled={startMut.isPending}
              className="h-10 px-5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:opacity-90 text-white font-semibold text-sm flex items-center gap-2 shadow-lg shadow-violet-500/30 disabled:opacity-50"
            >
              {startMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Tekshiruvni boshlash
            </button>
          )}
        </div>
      </div>

      {/* Active job */}
      {activeJobId && activeJob && (
        <div className="animate-in">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Joriy job</p>
          <JobCard job={activeJob} />
        </div>
      )}

      {/* History */}
      {history && history.jobs.length > 0 && (
        <div className="space-y-3">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">So'nggi tekshiruvlar</p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {history.jobs.filter(j => j.job_id !== activeJobId).slice(0, 8).map((j) => (
              <JobCard key={j.job_id} job={j} />
            ))}
          </div>
        </div>
      )}

      {!history?.jobs.length && !activeJobId && (
        <div className="text-center py-16 text-muted-foreground">
          <ImageOff className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Hali tekshiruv ishga tushirilmagan</p>
        </div>
      )}
    </div>
  );
}
