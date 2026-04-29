import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { api, MigrationJob } from "@/lib/api";
import { useAnimatedNumber } from "@/hooks/useAnimatedNumber";
import { Skeleton } from "@/components/ui/skeleton";
import {
  HardDrive, Database, Router, Cpu,
  Wifi, CheckCircle, AlertTriangle, ArrowRight,
  Loader2, MoveRight, RefreshCw, Copy, Trash2,
  XCircle, Clock, Zap, FileCheck2, X, Info,
} from "lucide-react";

// Account label'lari dinamik — backend settings_info dan keladi (bu yerda
// fallback'lar bor: agar storage stats yo'q bo'lsa, hech bo'lmaganda
// account_key ko'rinadi).
function makeAccountLabels(
  accounts: Array<{ account_key?: string; name?: string }>,
): Record<string, string> {
  const out: Record<string, string> = {};
  accounts.forEach((a, i) => {
    const key = a.account_key ?? a.name;
    if (!key) return;
    // Backend `name` allaqachon "Account N (xxx)" ko'rinishida keladi;
    // bo'lmasa o'rniga to'qib chiqaramiz.
    const label = a.name && /Account/.test(a.name)
      ? a.name
      : `Account ${i + 1}${key === "primary" ? " (primary)" : ` (${key})`}`;
    out[key] = label;
  });
  return out;
}

function fmtDuration(secs: number) {
  if (secs < 60) return `${Math.round(secs)}s`;
  const m = Math.floor(secs / 60), s = Math.round(secs % 60);
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function fmtBytes(b: number): string {
  if (!b || b < 0) return "0 B";
  if (b < 1024) return `${b} B`;
  if (b < 1024 ** 2) return `${(b / 1024).toFixed(1)} KB`;
  if (b < 1024 ** 3) return `${(b / 1024 ** 2).toFixed(1)} MB`;
  return `${(b / 1024 ** 3).toFixed(2)} GB`;
}

interface StorageAccount {
  name: string;
  account_key?: string;
  size_gb?: number;
  max_gb?: number;
  files?: number;
  error?: string;
}

function MigrationSection({
  accountNames,
  storageAccounts,
  accountLabels,
}: {
  accountNames: string[];
  storageAccounts: StorageAccount[];
  accountLabels: Record<string, string>;
}) {
  const ACCOUNT_LABELS = accountLabels;  // local alias — kod o'zgarishi minimal
  const queryClient = useQueryClient();
  const [source, setSource] = useState("");
  const [dest, setDest] = useState("");
  const [maxGbInput, setMaxGbInput] = useState("");  // bo'sh = chegarasiz
  const [deleteSource, setDeleteSource] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const [elapsed, setElapsed] = useState(0);

  // Pre-flight ma'lumotlari — source/dest tanlanganda hisoblanadi.
  const accByKey = (key: string) =>
    storageAccounts.find((a) => (a.account_key ?? a.name) === key);
  const srcAcc = source ? accByKey(source) : undefined;
  const dstAcc = dest ? accByKey(dest) : undefined;
  const sourceSizeGb = srcAcc?.size_gb ?? 0;
  const sourceFiles = srcAcc?.files ?? 0;
  const destFreeGb = Math.max(0, (dstAcc?.max_gb ?? 0) - (dstAcc?.size_gb ?? 0));

  const maxGbNum = Number(maxGbInput.trim());
  const maxGbValid = Number.isFinite(maxGbNum) && maxGbNum > 0 ? maxGbNum : null;
  const effectiveCopyGb = maxGbValid ? Math.min(sourceSizeGb, maxGbValid) : sourceSizeGb;
  const willOverflow = !!dstAcc && effectiveCopyGb > destFreeGb;
  const willPartial = !!srcAcc && maxGbValid !== null && maxGbValid < sourceSizeGb;

  const { data: jobData } = useQuery({
    queryKey: ["migration-status", activeJobId],
    queryFn: () => api.getMigrationStatus(activeJobId!),
    enabled: !!activeJobId,
    refetchInterval: (q) => {
      const s = q.state.data?.status;
      const active = s === "running" || s === "listing" || s === "queued"
        || s === "deleting" || s === "cancelling";
      return active ? 2000 : false;
    },
  });

  const { data: historyData } = useQuery({
    queryKey: ["migration-list"],
    queryFn: api.getMigrationList,
    staleTime: 10_000,
  });

  const ACTIVE_STATES = new Set([
    "queued", "listing", "running", "deleting", "cancelling",
  ]);
  const isRunning = !!jobData && ACTIVE_STATES.has(jobData.status);

  // Elapsed timer
  useEffect(() => {
    if (isRunning) {
      if (!startedAtRef.current) startedAtRef.current = Date.now();
      const id = setInterval(() => setElapsed(Math.floor((Date.now() - startedAtRef.current!) / 1000)), 1000);
      return () => clearInterval(id);
    } else if (jobData && !ACTIVE_STATES.has(jobData.status)) {
      startedAtRef.current = null;
    }
  }, [isRunning, jobData?.status]);

  // Status transitions uchun toast — tugaganda foydalanuvchi xabardor bo'ladi
  const lastStatusRef = useRef<string | null>(null);
  useEffect(() => {
    if (!jobData) return;
    const status = jobData.status;
    if (lastStatusRef.current === status) return;
    lastStatusRef.current = status;

    if (!ACTIVE_STATES.has(status)) {
      queryClient.invalidateQueries({ queryKey: ["storage"] });
      queryClient.invalidateQueries({ queryKey: ["migration-list"] });
    }

    const tid = `mig-final-${activeJobId ?? "x"}`;
    if (status === "done") {
      toast.success(
        `Migration tugadi — ${jobData.copied.toLocaleString()} fayl ko'chirildi`,
        { id: tid, description: jobData.deleted ? `Manbadan ${jobData.deleted} ta o'chirildi` : undefined },
      );
    } else if (status === "partial") {
      toast.warning(
        `Qisman tugadi — ${jobData.copied} muvaffaqiyatli, ${jobData.failed} xato`,
        { id: tid },
      );
    } else if (status === "stopped_max_gb") {
      toast.info(
        `Limit yetdi — ${jobData.copied} fayl ko'chirildi, ${jobData.remaining_keys ?? 0} qoldi`,
        { id: tid },
      );
    } else if (status === "cancelled") {
      toast.info(`To'xtatildi — ${jobData.copied} fayl ko'chirilgan`, { id: tid });
    } else if (status === "error") {
      toast.error(`Xato: ${jobData.error ?? "noma'lum"}`, { id: tid });
    }
  }, [jobData?.status]);

  const mutation = useMutation({
    mutationFn: () =>
      api.startMigration(source, dest, {
        maxGb: maxGbValid,
        deleteSource,
      }),
    onMutate: () => toast.loading("Migration ishga tushirilmoqda...", { id: "mig-start" }),
    onSuccess: (res) => {
      setActiveJobId(res.job_id);
      startedAtRef.current = Date.now();
      setElapsed(0);
      setShowConfirm(false);
      toast.success(
        `Migration boshlandi${maxGbValid ? ` (max ${maxGbValid} GB)` : ""}`,
        { id: "mig-start" },
      );
      queryClient.invalidateQueries({ queryKey: ["migration-list"] });
    },
    onError: (e: any) => toast.error(`Boshlanmadi: ${e?.message ?? "xato"}`, { id: "mig-start" }),
  });

  const cancelMutation = useMutation({
    mutationFn: () => api.cancelMigration(activeJobId!),
    onMutate: () => toast.loading("To'xtatilmoqda — copied fayllar manbadan o'chiriladi", { id: "mig-cancel" }),
    onSuccess: () => {
      toast.success("Cancel signali yuborildi", { id: "mig-cancel" });
      queryClient.invalidateQueries({ queryKey: ["migration-status", activeJobId] });
    },
    onError: () => toast.error("To'xtata olmadi", { id: "mig-cancel" }),
  });

  const clearHistoryMutation = useMutation({
    mutationFn: () => api.clearMigrationHistory(),
    onSuccess: () => {
      setActiveJobId(null);
      queryClient.invalidateQueries({ queryKey: ["migration-list"] });
      queryClient.removeQueries({ queryKey: ["migration-status"] });
    },
  });

  const pct = jobData && jobData.total > 0 ? Math.round((jobData.copied / jobData.total) * 100) : 0;
  const speed = elapsed > 0 && jobData ? jobData.copied / elapsed : 0; // files/sec
  const eta = speed > 0 && jobData ? (jobData.total - jobData.copied) / speed : null;

  const statusColor: Record<string, string> = {
    done: "text-emerald-600", partial: "text-amber-600",
    error: "text-rose-600", running: "text-blue-600",
    listing: "text-blue-500", queued: "text-muted-foreground",
    deleting: "text-violet-600", cancelling: "text-amber-600",
    cancelled: "text-rose-500", stopped_max_gb: "text-amber-700",
  };
  const statusBg: Record<string, string> = {
    done: "bg-emerald-500", partial: "bg-amber-500",
    error: "bg-rose-500", running: "bg-violet-500",
    listing: "bg-blue-400", queued: "bg-slate-300",
    deleting: "bg-violet-400", cancelling: "bg-amber-400",
    cancelled: "bg-rose-400", stopped_max_gb: "bg-amber-500",
  };
  const statusLabel: Record<string, string> = {
    done: "✓ Muvaffaqiyatli ko'chirildi", partial: "⚠ Qisman bajarildi",
    error: "✗ Xato yuz berdi", running: "Ko'chirilmoqda...",
    listing: "Fayllar sanalimoqda...", queued: "Navbatda...",
    deleting: "Manbadan o'chirilmoqda...",
    cancelling: "To'xtatilmoqda...",
    cancelled: "✗ To'xtatildi",
    stopped_max_gb: "⏹ Limit (max GB) yetdi",
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
        <div className="w-28">
          <label className="text-[11px] text-muted-foreground font-medium mb-1 block" title="Bu rundagi maksimal ko'chirish hajmi">
            Max GB
          </label>
          <input
            type="number"
            min={0}
            step={0.5}
            placeholder="hammasi"
            value={maxGbInput}
            onChange={(e) => setMaxGbInput(e.target.value)}
            disabled={isRunning}
            className="w-full h-9 px-2.5 text-sm rounded-lg border border-border/60 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        {!isRunning ? (
          <button
            onClick={() => setShowConfirm(true)}
            disabled={!source || !dest || mutation.isPending}
            className="h-9 px-4 text-sm font-semibold rounded-lg bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {mutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MoveRight className="w-3.5 h-3.5" />}
            Ko'chirish
          </button>
        ) : (
          <button
            onClick={() => cancelMutation.mutate()}
            disabled={cancelMutation.isPending || jobData?.status === "cancelling"}
            className="h-9 px-4 text-sm font-semibold rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            title="Migrationni to'xtatish — copied fayllar manbada o'chiriladi (duplicate yo'q)"
          >
            {cancelMutation.isPending || jobData?.status === "cancelling"
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <X className="w-3.5 h-3.5" />}
            To'xtatish
          </button>
        )}
      </div>

      {/* Pre-flight — Ko'chirish bosishdan oldin holatni ko'rsatadi */}
      {!isRunning && source && dest && srcAcc && dstAcc && (
        <div className={`rounded-xl border p-3 mb-4 text-[12px] ${
          willOverflow ? "border-rose-200 bg-rose-50/40"
          : willPartial ? "border-amber-200 bg-amber-50/40"
          : "border-blue-200 bg-blue-50/30"
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <Info className={`w-3.5 h-3.5 ${
              willOverflow ? "text-rose-500" : willPartial ? "text-amber-500" : "text-blue-500"
            }`} />
            <span className="font-semibold">
              {willOverflow ? "Diqqat: dest'da bo'sh joy yetmaydi"
                : willPartial ? `Limit: ${maxGbValid} GB ko'chiriladi, qoldig'i ${ACCOUNT_LABELS[source]}'da qoladi`
                : "Tayyor"}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-[11px]">
            <div>
              <p className="text-muted-foreground mb-0.5">Manba ({ACCOUNT_LABELS[source] ?? source})</p>
              <p className="font-bold tabular-nums">{sourceSizeGb.toFixed(2)} GB</p>
              <p className="text-muted-foreground tabular-nums">{sourceFiles.toLocaleString()} fayl</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-0.5">Ko'chiriladi</p>
              <p className={`font-bold tabular-nums ${willOverflow ? "text-rose-600" : ""}`}>
                {effectiveCopyGb.toFixed(2)} GB
              </p>
              {willPartial && <p className="text-amber-600 text-[10px]">{(sourceSizeGb - effectiveCopyGb).toFixed(2)} GB qoladi</p>}
            </div>
            <div>
              <p className="text-muted-foreground mb-0.5">Manzil bo'sh joyi</p>
              <p className={`font-bold tabular-nums ${willOverflow ? "text-rose-600" : "text-emerald-600"}`}>
                {destFreeGb.toFixed(2)} GB
              </p>
              <p className="text-muted-foreground tabular-nums">
                {(dstAcc.size_gb ?? 0).toFixed(1)} / {(dstAcc.max_gb ?? 0).toFixed(0)} GB ishlatilgan
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowConfirm(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-border/30">
              <h3 className="text-base font-bold">Migrationni boshlash</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Tasdiqlashdan keyin ko'chirish boshlanadi</p>
            </div>
            <div className="p-5 space-y-3 text-[13px]">
              <div className="flex items-center justify-between py-1.5 border-b border-border/20">
                <span className="text-muted-foreground">Manba</span>
                <span className="font-semibold">{ACCOUNT_LABELS[source] ?? source}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border/20">
                <span className="text-muted-foreground">Manzil</span>
                <span className="font-semibold">{ACCOUNT_LABELS[dest] ?? dest}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border/20">
                <span className="text-muted-foreground">Ko'chiriladi</span>
                <span className="font-semibold tabular-nums">
                  {effectiveCopyGb.toFixed(2)} GB
                  {sourceFiles > 0 && <span className="text-muted-foreground ml-2">({sourceFiles.toLocaleString()} fayl)</span>}
                </span>
              </div>
              {maxGbValid && (
                <div className="flex items-center justify-between py-1.5 border-b border-border/20">
                  <span className="text-muted-foreground">Max GB chegarasi</span>
                  <span className="font-semibold">{maxGbValid} GB</span>
                </div>
              )}

              <label className="flex items-start gap-2.5 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={deleteSource}
                  onChange={(e) => setDeleteSource(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-violet-600"
                />
                <div className="flex-1">
                  <p className="font-medium text-[12px]">Manbadan o'chirish</p>
                  <p className="text-[11px] text-muted-foreground">
                    {deleteSource
                      ? "Muvaffaqiyatli ko'chirilgan fayllar manbadan o'chiriladi (duplicate yo'q)"
                      : "⚠ Fayllar har ikkala account'da qoladi (duplicate)"}
                  </p>
                </div>
              </label>

              {willOverflow && (
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500 flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] text-rose-700">
                    Manzil bo'sh joyi yetmaydi: kerak {effectiveCopyGb.toFixed(2)} GB, bor {destFreeGb.toFixed(2)} GB.
                    Max GB chegarasini kichikroq qiling yoki boshqa account tanlang.
                  </p>
                </div>
              )}
            </div>
            <div className="flex gap-2 p-5 pt-0">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 h-10 rounded-lg text-sm font-medium bg-muted/50 hover:bg-muted"
              >
                Bekor
              </button>
              <button
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending || willOverflow}
                className="flex-1 h-10 rounded-lg text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <MoveRight className="w-4 h-4" />}
                Boshlash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active job — detailed progress */}
      {activeJobId && jobData && (
        <div className={`rounded-xl border mb-4 overflow-hidden ${
          jobData.status === "done" ? "border-emerald-200 bg-emerald-50/30"
          : jobData.status === "error" ? "border-rose-200 bg-rose-50/30"
          : jobData.status === "partial" ? "border-amber-200 bg-amber-50/30"
          : "border-violet-200 bg-violet-50/20"
        }`}>
          {/* Header bar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-inherit">
            <div className="flex items-center gap-2">
              {isRunning && <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-600" />}
              <span className={`text-[13px] font-bold ${statusColor[jobData.status] ?? ""}`}>
                {statusLabel[jobData.status] ?? jobData.status}
              </span>
            </div>
            <span className="text-[11px] text-muted-foreground font-mono">
              {ACCOUNT_LABELS[jobData.source] ?? jobData.source}
              <ArrowRight className="inline w-3 h-3 mx-1" />
              {ACCOUNT_LABELS[jobData.dest] ?? jobData.dest}
            </span>
          </div>

          {/* Progress bar */}
          {(jobData.total > 0 || isRunning) && (
            <div className="px-4 pt-3 pb-1">
              <div className="flex items-center justify-between text-[11px] mb-1.5">
                <span className="font-semibold tabular-nums">
                  {jobData.copied.toLocaleString()} / {jobData.total.toLocaleString()} fayl
                  {jobData.total_bytes ? (
                    <span className="text-muted-foreground ml-2 font-normal">
                      ({fmtBytes(jobData.copied_bytes ?? 0)} / {fmtBytes(jobData.total_bytes)})
                    </span>
                  ) : null}
                </span>
                <span className="font-bold tabular-nums">{pct}%</span>
              </div>
              <div className="w-full h-4 rounded-full bg-slate-100 overflow-hidden relative">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${statusBg[jobData.status] ?? "bg-slate-400"} ${isRunning ? "animate-pulse" : ""}`}
                  style={{ width: `${pct}%` }}
                />
                {/* Striped animation overlay while running */}
                {isRunning && pct > 0 && (
                  <div
                    className="absolute inset-0 rounded-full opacity-20"
                    style={{
                      width: `${pct}%`,
                      background: "repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,255,255,0.5) 8px, rgba(255,255,255,0.5) 16px)",
                      backgroundSize: "32px 32px",
                      animation: "slide 1s linear infinite",
                    }}
                  />
                )}
              </div>
            </div>
          )}

          {/* Stats grid */}
          <div className="grid grid-cols-4 gap-0 divide-x divide-border/30 px-4 py-3">
            <div className="pr-4 text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <FileCheck2 className="w-3 h-3 text-emerald-500" />
                <span className="text-[10px] text-muted-foreground font-medium">Ko'chirildi</span>
              </div>
              <p className="text-[15px] font-extrabold tabular-nums text-emerald-600">{jobData.copied.toLocaleString()}</p>
            </div>
            <div className="px-4 text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <Copy className="w-3 h-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground font-medium">Qoldi</span>
              </div>
              <p className="text-[15px] font-extrabold tabular-nums text-foreground">
                {Math.max(0, jobData.total - jobData.copied).toLocaleString()}
              </p>
            </div>
            <div className="px-4 text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <XCircle className="w-3 h-3 text-rose-400" />
                <span className="text-[10px] text-muted-foreground font-medium">Xato</span>
              </div>
              <p className={`text-[15px] font-extrabold tabular-nums ${jobData.failed > 0 ? "text-rose-600" : "text-muted-foreground/40"}`}>
                {jobData.failed}
              </p>
            </div>
            <div className="pl-4 text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <Trash2 className="w-3 h-3 text-slate-400" />
                <span className="text-[10px] text-muted-foreground font-medium">O'chirildi</span>
              </div>
              <p className="text-[15px] font-extrabold tabular-nums text-slate-500">{jobData.deleted}</p>
            </div>
          </div>

          {/* Speed / ETA / Elapsed */}
          {isRunning && elapsed > 0 && (
            <div className="flex items-center gap-4 px-4 pb-3 text-[11px] text-muted-foreground flex-wrap">
              <div className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-violet-500" />
                <span className="tabular-nums font-medium">
                  {speed >= 1 ? `${speed.toFixed(1)} fayl/s` : `${(speed * 60).toFixed(1)} fayl/min`}
                </span>
              </div>
              {jobData.copied_bytes !== undefined && jobData.copied_bytes > 0 && (
                <div className="flex items-center gap-1">
                  <span className="tabular-nums font-medium text-violet-600">
                    {fmtBytes(jobData.copied_bytes / elapsed)}/s
                  </span>
                </div>
              )}
              {eta !== null && eta > 0 && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-blue-400" />
                  <span className="tabular-nums">ETA: {fmtDuration(eta)}</span>
                </div>
              )}
              <div className="ml-auto flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span className="tabular-nums">{fmtDuration(elapsed)} o'tdi</span>
              </div>
            </div>
          )}

          {/* Done summary */}
          {(jobData.status === "done" || jobData.status === "partial") && elapsed > 0 && (
            <div className="flex items-center gap-2 px-4 pb-3 text-[11px] text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>Davomiyligi: {fmtDuration(elapsed)}</span>
              {speed > 0 && <span>· O'rtacha: {speed.toFixed(1)} fayl/s</span>}
            </div>
          )}

          {/* Error list */}
          {(jobData.errors ?? []).length > 0 && (
            <div className="px-4 pb-3">
              <p className="text-[10px] font-bold text-rose-600 mb-1.5 uppercase tracking-wider">Xatolar ({jobData.errors!.length})</p>
              <div className="space-y-1 max-h-24 overflow-y-auto">
                {jobData.errors!.map((e, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-[10px]">
                    <XCircle className="w-3 h-3 text-rose-400 flex-shrink-0 mt-0.5" />
                    <span className="text-rose-700 font-mono break-all">{e.key}</span>
                    <span className="text-muted-foreground ml-auto flex-shrink-0">{e.error}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {jobData.error && (
            <div className="px-4 pb-3">
              <p className="text-[11px] text-rose-600 font-medium">{jobData.error}</p>
            </div>
          )}
        </div>
      )}

      {/* History */}
      {(historyData?.jobs ?? []).length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">So'nggi migratsiyalar</p>
            <button
              onClick={() => {
                if (confirm("Tarix tozalansinmi? Faol task'larga ta'sir qilmaydi.")) {
                  clearHistoryMutation.mutate();
                }
              }}
              disabled={clearHistoryMutation.isPending}
              className="h-6 px-2 text-[10px] font-medium rounded-md text-rose-600 hover:bg-rose-50 disabled:opacity-50 flex items-center gap-1"
              title="Tarixni Redis'dan o'chirish"
            >
              {clearHistoryMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
              Tozalash
            </button>
          </div>
          <div className="space-y-1.5">
            {(historyData?.jobs ?? []).slice(0, 5).map((j) => {
              const isActive = j.job_id === activeJobId;
              return (
                <div
                  key={j.job_id}
                  onClick={() => setActiveJobId(j.job_id)}
                  className={`flex items-center justify-between text-[11px] px-3 py-2.5 rounded-lg cursor-pointer transition-colors border ${
                    isActive ? "border-violet-200 bg-violet-50/40" : "border-transparent bg-muted/30 hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusBg[j.status] ?? "bg-slate-300"}`} />
                    <span className="text-muted-foreground">
                      {ACCOUNT_LABELS[j.source] ?? j.source}
                      <ArrowRight className="inline w-2.5 h-2.5 mx-1" />
                      {ACCOUNT_LABELS[j.dest] ?? j.dest}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {j.total > 0 && (
                      <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${statusBg[j.status] ?? "bg-slate-300"}`}
                          style={{ width: `${j.total > 0 ? Math.round((j.copied / j.total) * 100) : 0}%` }}
                        />
                      </div>
                    )}
                    <span className="tabular-nums text-muted-foreground w-14 text-right">{j.total.toLocaleString()} fayl</span>
                    <span className={`font-semibold w-20 text-right ${statusColor[j.status] ?? ""}`}>{statusLabel[j.status]?.replace(/[✓⚠✗] /, "") ?? j.status}</span>
                  </div>
                </div>
              );
            })}
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
      <MigrationSection
        accountNames={(storage?.accounts ?? info?.r2?.accounts ?? []).map((a: any) => a.account_key || a.name).filter(Boolean)}
        storageAccounts={storage?.accounts ?? []}
        accountLabels={makeAccountLabels(storage?.accounts ?? info?.r2?.accounts ?? [])}
      />

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
