import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, User } from "@/lib/api";
import { useLiveStream } from "@/hooks/useLiveStream";
import { toast } from "sonner";
import {
  Search, UserPlus, Trash2,
  ChevronLeft, ChevronRight, Users, X, Loader2, RefreshCw, CheckCircle2, AlertTriangle, Database, Router,
} from "lucide-react";

function AddUserModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [gender, setGender] = useState(0);
  const [extraInfo, setExtraInfo] = useState("");
  const mut = useMutation({
    mutationFn: () => api.addUser({ name, gender, extra_info: extraInfo }),
    onSuccess: (d) => { toast.success(d.message); qc.invalidateQueries({ queryKey: ["users"] }); onClose(); setName(""); setGender(0); setExtraInfo(""); },
    onError: (e: any) => toast.error(e.message || "Xatolik"),
  });
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-border/30">
          <h3 className="text-base font-bold">Yangi foydalanuvchi</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Ism *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ism Familiya"
              className="w-full h-10 px-3 text-sm rounded-lg border border-border/60 focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Jinsi</label>
            <div className="flex gap-2">
              {[{ v: 0, l: "Erkak" }, { v: 1, l: "Ayol" }].map((g) => (
                <button key={g.v} onClick={() => setGender(g.v)}
                  className={`flex-1 h-10 rounded-lg text-sm font-medium transition-all ${gender === g.v ? "bg-primary text-white" : "bg-muted/50 text-muted-foreground"}`}>{g.l}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Izoh</label>
            <input value={extraInfo} onChange={(e) => setExtraInfo(e.target.value)} placeholder="Qo'shimcha..."
              className="w-full h-10 px-3 text-sm rounded-lg border border-border/60 focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
        </div>
        <div className="flex gap-2 p-5 pt-0">
          <button onClick={onClose} className="flex-1 h-10 rounded-lg text-sm font-medium bg-muted/50 hover:bg-muted">Bekor</button>
          <button onClick={() => mut.mutate()} disabled={!name.trim() || mut.isPending}
            className="flex-1 h-10 rounded-lg text-sm font-semibold bg-primary text-white hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
            {mut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />} Qo'shish
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [missingQuery, setMissingQuery] = useState("");
  const [selectedMissingDevice, setSelectedMissingDevice] = useState<string>("ALL");
  const syncToastRef = useRef<string | null>(null);

  const { data: syncStatus } = useQuery({
    queryKey: ["users-sync-status"],
    queryFn: api.getUsersSyncStatus,
    refetchInterval: (q) => {
      const status = q.state.data?.status;
      return status === "queued" || status === "running" ? 2000 : 15000;
    },
  });

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["users", page, search],
    queryFn: () => api.getUsers({ page, per_page: 30, search }),
    staleTime: 15_000,
    refetchInterval: syncStatus?.status === "queued" || syncStatus?.status === "running" ? 5000 : false,
    placeholderData: (prev: any) => prev,
  });

  const { data: usersMgmt } = useQuery({
    queryKey: ["users-management-analytics"],
    queryFn: api.getUsersManagementAnalytics,
    staleTime: 120_000,
    refetchInterval: syncStatus?.status === "queued" || syncStatus?.status === "running" ? 5000 : false,
  });

  const deleteMut = useMutation({
    mutationFn: api.deleteUser,
    onSuccess: () => { toast.success("O'chirildi"); qc.invalidateQueries({ queryKey: ["users"] }); },
  });

  const syncMut = useMutation({
    mutationFn: api.startUsersSync,
    onSuccess: (res) => {
      toast.success(res.message || "Device sync ishga tushdi");
      qc.invalidateQueries({ queryKey: ["users-sync-status"] });
    },
    onError: (e: any) => toast.error(e.message || "Users sync ishga tushmadi"),
  });

  useEffect(() => {
    if (!syncStatus?.updated_at) return;
    const marker = `${syncStatus.status}:${syncStatus.updated_at}`;
    if (syncToastRef.current === marker) return;

    if (syncStatus.status === "done") {
      syncToastRef.current = marker;
      toast.success(`Users sync tugadi: ${syncStatus.created ?? 0} ta yangi, ${syncStatus.updated ?? 0} ta yangilandi`);
      qc.invalidateQueries({ queryKey: ["users"] });
      return;
    }

    if (syncStatus.status === "error") {
      syncToastRef.current = marker;
      toast.error(syncStatus.error || "Users sync xatolik bilan tugadi");
    }
  }, [qc, syncStatus]);

  useLiveStream(["events"], (event) => {
    if (event.channel !== "events") return;
    const type = event.data?.type;
    if (type === "users.sync.started" || type === "users.sync.completed") {
      qc.invalidateQueries({ queryKey: ["users-sync-status"] });
      qc.invalidateQueries({ queryKey: ["users-management-analytics"] });
    }
    if (type === "users.sync.completed") {
      qc.invalidateQueries({ queryKey: ["users"] });
    }
  });

  const isSyncRunning = syncStatus?.status === "queued" || syncStatus?.status === "running";
  const syncProcessed = syncStatus?.processed ?? 0;
  const syncCreated = syncStatus?.created ?? 0;
  const syncUpdated = syncStatus?.updated ?? 0;
  const syncSkipped = syncStatus?.skipped ?? 0;
  const syncFailed = syncStatus?.failed ?? 0;
  const syncDevicesDone = syncStatus?.devices_done ?? 0;
  const syncDevicesTotal = syncStatus?.devices_total ?? 0;
  const syncPct = syncDevicesTotal > 0 ? Math.round((syncDevicesDone / syncDevicesTotal) * 100) : 0;
  const selectedMissingDeviceData =
    selectedMissingDevice === "ALL"
      ? null
      : usersMgmt?.missing_by_device?.find((item) => item.device_id === selectedMissingDevice) ?? null;
  const missingUsersSource =
    selectedMissingDeviceData?.missing_users ?? usersMgmt?.incomplete_users ?? [];
  const filteredMissingUsers = missingUsersSource.filter((item) => {
    const q = missingQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      item.name?.toLowerCase().includes(q) ||
      item.full_name?.toLowerCase().includes(q) ||
      item.role?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-5 lg:p-6 space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3 animate-in">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Foydalanuvchilar</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Jami: {data?.total?.toLocaleString() ?? "..."}
            {isFetching && !isLoading && <Loader2 className="w-3 h-3 inline ml-2 animate-spin text-primary" />}
          </p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="h-9 px-4 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-primary/90 flex items-center gap-2 shadow-sm shadow-primary/20">
          <UserPlus className="w-3.5 h-3.5" /> Yangi
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-border/50 p-4 lg:p-5 space-y-4 animate-in" style={{ animationDelay: "25ms" }}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                {isSyncRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
              </div>
              <div>
                <h2 className="text-sm font-bold">Qurilmadan foydalanuvchilarni tortish</h2>
                <p className="text-[12px] text-muted-foreground">
                  Device user list bazaga sync qilinadi va jadval avtomatik yangilanadi
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={() => syncMut.mutate()}
            disabled={syncMut.isPending || isSyncRunning}
            className="h-10 px-4 rounded-xl bg-primary text-white hover:bg-primary/90 disabled:opacity-50 text-sm font-semibold flex items-center gap-2 shadow-sm shadow-primary/20"
          >
            {syncMut.isPending || isSyncRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Hozir sync qilish
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold ${
            isSyncRunning ? "bg-blue-50 text-blue-700" :
            syncStatus?.status === "done" ? "bg-emerald-50 text-emerald-700" :
            syncStatus?.status === "error" ? "bg-rose-50 text-rose-700" :
            "bg-muted text-muted-foreground"
          }`}>
            {isSyncRunning && <Loader2 className="w-3 h-3 animate-spin" />}
            {syncStatus?.status === "done" && <CheckCircle2 className="w-3 h-3" />}
            {syncStatus?.status === "error" && <AlertTriangle className="w-3 h-3" />}
            Status: {syncStatus?.status || "idle"}
          </span>
          {syncStatus?.updated_at && (
            <span className="text-muted-foreground">
              Oxirgi yangilanish: {new Date(syncStatus.updated_at).toLocaleString()}
            </span>
          )}
          {syncStatus?.current_device && isSyncRunning && (
            <span className="text-muted-foreground">
              Hozirgi qurilma: <span className="font-mono">{syncStatus.current_device}</span>
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { label: "Ko'rildi", value: syncProcessed, tone: "from-slate-50 to-slate-100 text-slate-800" },
            { label: "Yangi", value: syncCreated, tone: "from-emerald-50 to-emerald-100 text-emerald-700" },
            { label: "Yangilandi", value: syncUpdated, tone: "from-sky-50 to-sky-100 text-sky-700" },
            { label: "Skip", value: syncSkipped, tone: "from-amber-50 to-amber-100 text-amber-700" },
            { label: "Xato", value: syncFailed, tone: "from-rose-50 to-rose-100 text-rose-700" },
          ].map((item) => (
            <div key={item.label} className={`rounded-xl bg-gradient-to-br ${item.tone} border border-border/40 p-3`}>
              <p className="text-[10px] uppercase tracking-wider font-bold opacity-70">{item.label}</p>
              <p className="text-2xl font-extrabold tabular-nums mt-1">{item.value.toLocaleString()}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-border/40 bg-muted/20 p-3">
          <div className="flex items-center justify-between text-[11px] font-semibold mb-2">
            <span>Qurilmalar progressi</span>
            <span className="tabular-nums">{syncDevicesDone} / {syncDevicesTotal}</span>
          </div>
          <div className="w-full h-2 rounded-full bg-primary/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${syncPct}%` }}
            />
          </div>
        </div>

        {syncStatus?.status === "error" && syncStatus.error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-700">
            {syncStatus.error}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-border/50 p-4 lg:p-5 space-y-4 animate-in" style={{ animationDelay: "35ms" }}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center">
                <Router className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold">Turniket qurilmalari kesimida foydalanuvchilar</h2>
                <p className="text-[12px] text-muted-foreground">
                  Qaysi turniketda qancha user bor va qaysi user aynan qaysi turniketda yo‘qligi
                </p>
              </div>
            </div>
          </div>
          <div className="text-[11px] text-muted-foreground text-right">
            <div>Status: <span className="font-semibold text-foreground">{usersMgmt?.status?.status || "idle"}</span></div>
            {usersMgmt?.generated_at && <div>{new Date(usersMgmt.generated_at).toLocaleString()}</div>}
          </div>
        </div>

        {!usersMgmt ? (
          <div className="grid md:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => <div key={i} className="h-24 skeleton rounded-xl" />)}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              {[
                { label: "Unikal user", value: usersMgmt.summary.unique_users, tone: "from-sky-50 to-sky-100 text-sky-700" },
                { label: "Jami nusxa", value: usersMgmt.summary.total_rows, tone: "from-slate-50 to-slate-100 text-slate-800" },
                { label: "Hammasida bor", value: usersMgmt.summary.users_on_all_devices, tone: "from-emerald-50 to-emerald-100 text-emerald-700" },
                { label: "Yo'q qurilmali", value: usersMgmt.summary.users_missing_some_devices, tone: "from-amber-50 to-amber-100 text-amber-700" },
                { label: "Qamrov", value: `${usersMgmt.summary.coverage_pct}%`, tone: "from-violet-50 to-violet-100 text-violet-700" },
              ].map((item) => (
                <div key={item.label} className={`rounded-xl bg-gradient-to-br ${item.tone} border border-border/40 p-3`}>
                  <p className="text-[10px] uppercase tracking-wider font-bold opacity-70">{item.label}</p>
                  <p className="text-2xl font-extrabold tabular-nums mt-1">
                    {typeof item.value === "number" ? item.value.toLocaleString() : item.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid xl:grid-cols-[1.2fr_1fr] gap-4">
              <div className="rounded-xl border border-border/40 overflow-hidden">
                <div className="px-4 py-3 border-b border-border/30 bg-muted/20">
                  <h3 className="text-[12px] font-bold">Qurilma bo‘yicha sonlar</h3>
                </div>
                <div className="divide-y divide-border/20">
                  {usersMgmt.by_device.map((device) => (
                    <button
                      key={device.device_id}
                      onClick={() => setSelectedMissingDevice(device.device_id)}
                      className={`w-full text-left px-4 py-3 transition-colors ${
                        selectedMissingDevice === device.device_id ? "bg-primary/5" : "hover:bg-muted/20"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-[13px] font-bold">{device.device_id}</p>
                          <p className="text-[11px] text-muted-foreground font-mono">{device.ip}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[12px] font-bold tabular-nums">{device.unique_users.toLocaleString()} user</p>
                          <p className="text-[11px] text-amber-600">{device.coverage_pct}% qamrov</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-2 mt-2 text-[11px]">
                        <div className="rounded-lg bg-muted/30 px-2 py-1">
                          <p className="text-muted-foreground">Jami</p>
                          <p className="font-bold tabular-nums">{device.total_rows.toLocaleString()}</p>
                        </div>
                        <div className="rounded-lg bg-emerald-50 px-2 py-1">
                          <p className="text-emerald-700">Aktiv</p>
                          <p className="font-bold tabular-nums text-emerald-700">{device.active_rows.toLocaleString()}</p>
                        </div>
                        <div className="rounded-lg bg-rose-50 px-2 py-1">
                          <p className="text-rose-700">Blok</p>
                          <p className="font-bold tabular-nums text-rose-700">{device.blocked_rows.toLocaleString()}</p>
                        </div>
                        <div className="rounded-lg bg-amber-50 px-2 py-1">
                          <p className="text-amber-700">Rasmsiz</p>
                          <p className="font-bold tabular-nums text-amber-700">{device.missing_image_rows.toLocaleString()}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-border/40 overflow-hidden">
                <div className="px-4 py-3 border-b border-border/30 bg-muted/20 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-[12px] font-bold">
                        {selectedMissingDevice === "ALL"
                          ? "Ayrim turniketlarda yo‘q userlar"
                          : `${selectedMissingDevice} da yo‘q userlar`}
                      </h3>
                      <p className="text-[11px] text-muted-foreground">
                        {selectedMissingDevice === "ALL"
                          ? "Har bir user uchun yo‘q bo‘lgan turniketlar ro‘yxati"
                          : "Tanlangan turniketda yo‘q foydalanuvchilar"}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedMissingDevice("ALL")}
                      className={`h-8 px-3 rounded-lg text-[11px] font-semibold transition-colors ${
                        selectedMissingDevice === "ALL" ? "bg-primary text-white" : "bg-white border border-border/50 hover:bg-muted"
                      }`}
                    >
                      Hammasi
                    </button>
                  </div>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={missingQuery}
                      onChange={(e) => setMissingQuery(e.target.value)}
                      placeholder="Ism yoki lavozim..."
                      className="w-full h-9 pl-8 pr-3 text-sm rounded-lg border border-border/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                <div className="max-h-[520px] overflow-y-auto divide-y divide-border/20">
                  {filteredMissingUsers.length === 0 ? (
                    <div className="px-4 py-10 text-center text-[12px] text-muted-foreground">
                      Muammo topilmadi
                    </div>
                  ) : (
                    filteredMissingUsers.map((item: any) => (
                      <div key={`${item.name}-${item.last_seen || "none"}`} className="px-4 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[12px] font-bold truncate">{item.full_name || item.name}</p>
                            <p className="text-[10px] text-muted-foreground font-mono truncate">{item.name}</p>
                          </div>
                          <span className="text-[11px] font-bold text-amber-600 whitespace-nowrap">
                            {item.device_count}/{usersMgmt.summary.devices_total}
                          </span>
                        </div>
                        {item.role && (
                          <p className="text-[10px] text-primary mt-1">{item.role}</p>
                        )}
                        {"missing_devices" in item && Array.isArray(item.missing_devices) ? (
                          <p className="text-[11px] text-muted-foreground mt-1">
                            Yo‘q turniketlar: {item.missing_devices.join(", ")}
                          </p>
                        ) : (
                          <p className="text-[11px] text-muted-foreground mt-1">
                            Tanlangan turniketda yo‘q
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-border/50 p-3 flex gap-2 animate-in" style={{ animationDelay: "50ms" }}>
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input placeholder="Ism yoki passport..." value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { setSearch(searchInput); setPage(1); } }}
            className="w-full h-9 pl-8 pr-3 text-sm rounded-lg border border-border/60 focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <button onClick={() => { setSearch(searchInput); setPage(1); }}
          className="h-9 px-4 text-xs font-semibold rounded-lg bg-primary text-white hover:bg-primary/90">Qidirish</button>
        {search && <button onClick={() => { setSearch(""); setSearchInput(""); setPage(1); }}
          className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-muted"><X className="w-3.5 h-3.5" /></button>}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-border/50 overflow-hidden animate-in" style={{ animationDelay: "100ms" }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/40 bg-muted/20">
                {["#", "Foydalanuvchi", "Lavozim", "Qurilma", ""].map((h) => (
                  <th key={h} className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(10)].map((_, i) => (
                  <tr key={i} className="border-b border-border/20"><td colSpan={6} className="px-4 py-3"><div className="h-5 skeleton" /></td></tr>
                ))
              ) : (data?.data ?? []).length === 0 ? (
                <tr><td colSpan={5} className="text-center py-16">
                  <Users className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Topilmadi</p>
                </td></tr>
              ) : (data?.data ?? []).map((u, i) => (
                  <tr key={u.id} className="border-b border-border/15 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-2 text-xs text-muted-foreground tabular-nums">{(page - 1) * 30 + i + 1}</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/60 to-primary flex items-center justify-center text-[11px] font-bold text-white">
                          {(u.name || "?")[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold truncate max-w-[220px]">{u.full_name || u.name}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">{u.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      {u.role ? <span className="text-[11px] bg-primary/8 text-primary px-2 py-0.5 rounded-full font-medium">{u.role}</span> : <span className="text-[11px] text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-2 text-[12px] text-muted-foreground font-mono">{u.face_id || "—"}</td>
                    <td className="px-4 py-2">
                      <button onClick={() => { if (confirm(`"${u.name}" o'chirilsinmi?`)) deleteMut.mutate(u.id); }}
                        disabled={deleteMut.isPending}
                        className="w-8 h-8 rounded-lg flex items-center justify-center bg-rose-50 text-rose-500 hover:bg-rose-100 disabled:opacity-50 transition-all">
                        {deleteMut.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                    </td>
                  </tr>
              ))}
            </tbody>
          </table>
        </div>

        {data && data.total_pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border/30 bg-muted/10">
            <p className="text-[11px] text-muted-foreground">Jami <strong>{data.total.toLocaleString()}</strong></p>
            <div className="flex items-center gap-1">
              <button disabled={page <= 1} onClick={() => setPage(1)} className="w-8 h-8 flex items-center justify-center rounded-md border border-border/40 hover:bg-muted disabled:opacity-20 text-xs font-bold">1</button>
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="w-8 h-8 flex items-center justify-center rounded-md border border-border/40 hover:bg-muted disabled:opacity-20"><ChevronLeft className="w-3.5 h-3.5" /></button>
              <span className="text-xs font-semibold px-3 tabular-nums bg-primary/5 rounded-md py-1.5">{page}</span>
              <button disabled={page >= data.total_pages} onClick={() => setPage(p => p + 1)} className="w-8 h-8 flex items-center justify-center rounded-md border border-border/40 hover:bg-muted disabled:opacity-20"><ChevronRight className="w-3.5 h-3.5" /></button>
              <button disabled={page >= data.total_pages} onClick={() => setPage(data.total_pages)} className="w-8 h-8 flex items-center justify-center rounded-md border border-border/40 hover:bg-muted disabled:opacity-20 text-xs font-bold">{data.total_pages}</button>
            </div>
          </div>
        )}
      </div>
      <AddUserModal open={showAdd} onClose={() => setShowAdd(false)} />
    </div>
  );
}
