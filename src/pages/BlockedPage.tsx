import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, User } from "@/lib/api";
import { toast } from "sonner";
import {
  ShieldBan, ShieldCheck, Search, X, Loader2, Plus, Upload, FileSpreadsheet, List,
  UserSearch, XCircle,
} from "lucide-react";

// ─── Manual Bulk Modal ────────────────────────────────────────────
function BulkTextModal({ open, onClose, action }: { open: boolean; onClose: () => void; action: "block" | "unblock" }) {
  const qc = useQueryClient();
  const [text, setText] = useState("");

  const mut = useMutation({
    mutationFn: () => {
      const names = text.split(/[\n,\s]+/).map(n => n.trim()).filter(Boolean);
      return api.bulkBlock(names, action);
    },
    onMutate: () => {
      const count = text.split(/[\n,\s]+/).filter(Boolean).length;
      toast.loading(
        action === "block"
          ? `${count} ta user bloklanmoqda — 8 qurilma, biroz vaqt oladi...`
          : `${count} ta user blokdan chiqarilmoqda — 8 qurilma, biroz vaqt oladi...`,
        { id: "bulk-text" },
      );
    },
    onSuccess: (d: any) => {
      toast.success(`${d.success}/${d.total} user ${action === "block" ? "bloklandi" : "blokdan chiqarildi"}`,
        { id: "bulk-text", description: `Topilmadi: ${d.not_found}` });
      qc.invalidateQueries({ queryKey: ["blockedUsers"] });
      qc.invalidateQueries({ queryKey: ["users"] });
      setText("");
      onClose();
    },
    onError: () => toast.error("Xatolik", { id: "bulk-text" }),
  });

  if (!open) return null;
  const count = text.split(/[\n,\s]+/).filter(Boolean).length;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-border/30">
          <div>
            <h3 className="text-base font-bold">{action === "block" ? "Ro'yxat bo'yicha bloklash" : "Ro'yxat bo'yicha blokdan chiqarish"}</h3>
            <p className="text-[12px] text-muted-foreground mt-0.5">Passport raqamlarini yozing (har qatorda bitta yoki vergul bilan)</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-3">
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={8}
            placeholder="AD1234567&#10;AB7890123&#10;AC4567890&#10;..."
            className="w-full px-3 py-2.5 text-sm rounded-lg border border-border/60 focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono resize-none" />
          <p className="text-[11px] text-muted-foreground">
            {count > 0 ? `${count} ta passport kiritildi` : "Passport ro'yxatini yozing"}
          </p>
        </div>
        <div className="flex gap-2 p-5 pt-0">
          <button onClick={onClose} className="flex-1 h-10 rounded-lg text-sm font-medium bg-muted/50 hover:bg-muted">Bekor</button>
          <button onClick={() => mut.mutate()} disabled={count === 0 || mut.isPending}
            className={`flex-1 h-10 rounded-lg text-sm font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-2 ${action === "block" ? "bg-rose-500 hover:bg-rose-600" : "bg-emerald-500 hover:bg-emerald-600"}`}>
            {mut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : action === "block" ? <ShieldBan className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
            {action === "block" ? `${count} ta Bloklash` : `${count} ta Blokdan chiqarish`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Excel Import Modal ────────────────────────────────────────────
function ExcelImportModal({ open, onClose, action }: { open: boolean; onClose: () => void; action: "block" | "unblock" }) {
  const qc = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const mut = useMutation({
    mutationFn: () => {
      if (!file) throw new Error("Fayl tanlanmagan");
      return api.bulkBlockExcel(file, action);
    },
    onMutate: () => {
      toast.loading(
        action === "block"
          ? "Excel'dan userlar bloklanmoqda — 8 qurilma, biroz vaqt oladi..."
          : "Excel'dan userlar blokdan chiqarilmoqda — 8 qurilma, biroz vaqt oladi...",
        { id: "bulk-excel" },
      );
    },
    onSuccess: (d: any) => {
      toast.success(`${d.success}/${d.total} user ishlandi`, {
        id: "bulk-excel",
        description: `Topilmadi: ${d.not_found}`,
      });
      qc.invalidateQueries({ queryKey: ["blockedUsers"] });
      qc.invalidateQueries({ queryKey: ["users"] });
      setFile(null);
      onClose();
    },
    onError: () => toast.error("Excel import xatoligi", { id: "bulk-excel" }),
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-border/30">
          <div>
            <h3 className="text-base font-bold">Excel fayl import</h3>
            <p className="text-[12px] text-muted-foreground mt-0.5">{action === "block" ? "Bloklash" : "Blokdan chiqarish"}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 space-y-4">
          <div className="bg-blue-50/50 border border-blue-200/50 rounded-xl p-3">
            <p className="text-[11px] font-semibold text-blue-700 mb-2">Excel format (1 ta ustun):</p>
            <pre className="text-[10px] font-mono bg-white rounded-md p-2 text-muted-foreground">
{`passport
AD1234567
AB7890123
AC4567890`}
            </pre>
            <p className="text-[10px] text-blue-600/80 mt-2">
              Birinchi qator header bo'lishi mumkin (passport/name/id). Qolgan qatorlar passport raqamlari.
            </p>
          </div>

          <input ref={fileInput} type="file" accept=".xlsx,.xls" onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="hidden" />

          <button onClick={() => fileInput.current?.click()}
            className="w-full h-24 border-2 border-dashed border-border/60 rounded-xl hover:border-primary/40 hover:bg-muted/20 transition-all flex flex-col items-center justify-center gap-2 group">
            <FileSpreadsheet className={`w-6 h-6 ${file ? "text-emerald-600" : "text-muted-foreground group-hover:text-primary"}`} />
            <p className="text-[13px] font-semibold">
              {file ? file.name : "Excel fayl tanlang"}
            </p>
            {!file && <p className="text-[11px] text-muted-foreground">.xlsx yoki .xls</p>}
          </button>
        </div>

        <div className="flex gap-2 p-5 pt-0">
          <button onClick={onClose} className="flex-1 h-10 rounded-lg text-sm font-medium bg-muted/50 hover:bg-muted">Bekor</button>
          <button onClick={() => mut.mutate()} disabled={!file || mut.isPending}
            className={`flex-1 h-10 rounded-lg text-sm font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-2 ${action === "block" ? "bg-rose-500 hover:bg-rose-600" : "bg-emerald-500 hover:bg-emerald-600"}`}>
            {mut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {action === "block" ? "Bloklash" : "Blokdan chiqarish"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Single User Add/Block ─────────────────────────────────────────
function AddBlockModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["searchUsers", search],
    queryFn: () => api.getUsers({ search, per_page: 10 }),
    enabled: search.length > 1,
    staleTime: 10_000,
  });

  const blockMut = useMutation({
    mutationFn: (id: number) => api.blockUser(id),
    onMutate: (id) => {
      toast.loading("Bloklanmoqda — 8 qurilma, biroz vaqt oladi...", { id: `block-${id}` });
    },
    onSuccess: (d: any, id) => {
      toast.success(d.message, { id: `block-${id}` });
      qc.invalidateQueries({ queryKey: ["blockedUsers"] });
      qc.invalidateQueries({ queryKey: ["searchUsers"] });
    },
    onError: (_e, id) => toast.error("Xatolik — qaytadan urinib ko'ring", { id: `block-${id}` }),
  });

  if (!open) return null;
  const results = (data?.data ?? []).filter((u: User) => !u.is_blocked);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-in" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-border/30">
          <h3 className="text-base font-bold">Bitta userni bloklash</h3>
          <p className="text-[12px] text-muted-foreground mt-0.5">8 ta qurilmadan o'chirib tashlanadi</p>
        </div>
        <div className="p-5">
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input placeholder="Ism yoki passport..." value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") setSearch(searchInput); }}
                className="w-full h-10 pl-8 pr-3 text-sm rounded-lg border border-border/60 focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <button onClick={() => setSearch(searchInput)} className="h-10 px-4 text-xs font-semibold rounded-lg bg-primary text-white hover:bg-primary/90">Qidirish</button>
          </div>

          <div className="max-h-[300px] overflow-y-auto custom-scrollbar space-y-1">
            {!search ? <p className="text-sm text-muted-foreground text-center py-8">Qidirish uchun yozing</p>
              : isLoading ? <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin" /></div>
              : results.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">Faol user topilmadi</p>
              : results.map((u: User) => (
                <div key={u.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/30">
                  <div className="flex items-center gap-3">
                    {u.image ? <img src={u.image} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" />
                      : <div className="w-10 h-10 rounded-full bg-primary/60 flex items-center justify-center text-[12px] font-bold text-white">{(u.name || "?")[0]}</div>}
                    <div>
                      <p className="text-[13px] font-semibold">{u.full_name || u.name}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{u.name}</p>
                    </div>
                  </div>
                  <button onClick={() => blockMut.mutate(u.id)} disabled={blockMut.isPending}
                    className="h-8 px-3 rounded-lg text-[11px] font-bold bg-rose-500 text-white hover:bg-rose-600 disabled:opacity-50 flex items-center gap-1.5">
                    {blockMut.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldBan className="w-3 h-3" />}
                    Bloklash
                  </button>
                </div>
              ))}
          </div>
        </div>
        <div className="px-5 pb-5">
          <button onClick={onClose} className="w-full h-10 rounded-lg text-sm font-medium bg-muted/50 hover:bg-muted">Yopish</button>
        </div>
      </div>
    </div>
  );
}

// ─── Check User Status Modal ───────────────────────────────────────
function CheckUserModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [input, setInput] = useState("");
  const [checked, setChecked] = useState("");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["checkUser", checked],
    queryFn: () => api.checkUserStatus(checked),
    enabled: checked.length > 0,
    staleTime: 5_000,
  });

  const blockMut = useMutation({
    mutationFn: () => api.bulkBlock([checked], "block"),
    onMutate: () => toast.loading(`${checked} bloklanmoqda — 8 qurilma, biroz vaqt oladi...`, { id: `check-${checked}` }),
    onSuccess: () => {
      toast.success(`${checked} bloklandi`, { id: `check-${checked}` });
      refetch();
      qc.invalidateQueries({ queryKey: ["blockedUsers"] });
    },
    onError: () => toast.error("Xatolik — qaytadan urinib ko'ring", { id: `check-${checked}` }),
  });
  const unblockMut = useMutation({
    mutationFn: () => api.bulkBlock([checked], "unblock"),
    onMutate: () => toast.loading(`${checked} blokdan chiqarilmoqda — 8 qurilma, biroz vaqt oladi...`, { id: `check-${checked}` }),
    onSuccess: () => {
      toast.success(`${checked} blokdan chiqarildi`, { id: `check-${checked}` });
      refetch();
      qc.invalidateQueries({ queryKey: ["blockedUsers"] });
    },
    onError: () => toast.error("Xatolik — qaytadan urinib ko'ring", { id: `check-${checked}` }),
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-border/30">
          <div>
            <h3 className="text-base font-bold">User holatini tekshirish</h3>
            <p className="text-[12px] text-muted-foreground mt-0.5">Bloklangan yoki faol ekanini ko'rish</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <UserSearch className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input placeholder="AD1234567" value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") setChecked(input.trim()); }}
                className="w-full h-10 pl-8 pr-3 text-sm rounded-lg border border-border/60 focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono" />
            </div>
            <button onClick={() => setChecked(input.trim())} disabled={!input.trim()}
              className="h-10 px-4 text-xs font-semibold rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-50">
              Tekshirish
            </button>
          </div>

          {/* Result */}
          {checked && (
            <div className="border border-border/40 rounded-xl p-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : !data?.found ? (
                <div className="text-center py-4">
                  <XCircle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold">Topilmadi</p>
                  <p className="text-[11px] text-muted-foreground mt-1">{data?.message}</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-4 pb-3 border-b border-border/30">
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center ${data.is_blocked ? "bg-rose-100" : "bg-emerald-100"}`}>
                      {data.is_blocked ? <ShieldBan className="w-5 h-5 text-rose-600" /> : <ShieldCheck className="w-5 h-5 text-emerald-600" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-[14px] font-bold">{data.full_name}</p>
                      <p className="text-[11px] text-muted-foreground font-mono">{data.name}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${data.is_blocked ? "bg-rose-500 text-white" : "bg-emerald-500 text-white"}`}>
                      {data.status}
                    </span>
                  </div>

                  <div className="space-y-2 text-[12px]">
                    {data.role && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Lavozim</span>
                        <span className="font-semibold">{data.role}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Qurilmalar soni</span>
                      <span className="font-bold">{data.devices_count}</span>
                    </div>
                    {data.last_seen && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Oxirgi kirish</span>
                        <span className="font-semibold font-mono">{new Date(data.last_seen).toLocaleString("uz-UZ", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                    )}
                    {data.last_device && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Oxirgi qurilma</span>
                        <span className="font-semibold font-mono">{data.last_device}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-4 pt-3 border-t border-border/30">
                    {data.is_blocked ? (
                      <button onClick={() => unblockMut.mutate()} disabled={unblockMut.isPending}
                        className="flex-1 h-9 rounded-lg text-xs font-semibold bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 flex items-center justify-center gap-2">
                        {unblockMut.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                        Blokdan chiqarish
                      </button>
                    ) : (
                      <button onClick={() => blockMut.mutate()} disabled={blockMut.isPending}
                        className="flex-1 h-9 rounded-lg text-xs font-semibold bg-rose-500 text-white hover:bg-rose-600 disabled:opacity-50 flex items-center justify-center gap-2">
                        {blockMut.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldBan className="w-3.5 h-3.5" />}
                        Bloklash
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="px-5 pb-5">
          <button onClick={onClose} className="w-full h-10 rounded-lg text-sm font-medium bg-muted/50 hover:bg-muted">Yopish</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────
export default function BlockedPage() {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [showBulkText, setShowBulkText] = useState<"block" | "unblock" | null>(null);
  const [showExcel, setShowExcel] = useState<"block" | "unblock" | null>(null);
  const [showCheck, setShowCheck] = useState(false);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const perPage = 50;

  const queryKey = ["blockedUsers", page, search] as const;
  const { data: blockedData, isLoading, isFetching } = useQuery({
    queryKey,
    queryFn: () => api.getBlockedUsers({ page, per_page: perPage, search }),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });

  // name bo'yicha pending — UsersManagement.id bo'lmagan userlar uchun ham ishlaydi
  const [pendingNames, setPendingNames] = useState<Set<string>>(new Set());

  const unblockMut = useMutation({
    mutationFn: (name: string) => api.bulkBlock([name], "unblock"),
    onMutate: async (name: string) => {
      toast.loading(`${name} blokdan chiqarilmoqda — 8 qurilma, biroz vaqt oladi...`, { id: `unblock-${name}` });
      await qc.cancelQueries({ queryKey: ["blockedUsers"] });
      const prev = qc.getQueryData<{ total: number; page: number; per_page: number; total_pages: number; data: User[] }>(queryKey);
      if (prev) {
        qc.setQueryData(queryKey, {
          ...prev,
          total: Math.max(0, prev.total - 1),
          data: prev.data.filter((u) => u.name !== name),
        });
      }
      setPendingNames((s) => new Set(s).add(name));
      return { prev };
    },
    onError: (_err, name, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKey, ctx.prev);
      toast.error("Xatolik — qaytadan urinib ko'ring", { id: `unblock-${name}` });
    },
    onSuccess: (_d, name) => {
      toast.success(`${name} barcha turniketlardan blokdan chiqarildi`, { id: `unblock-${name}` });
    },
    onSettled: (_d, _e, name) => {
      setPendingNames((s) => {
        const n = new Set(s);
        n.delete(name);
        return n;
      });
      qc.invalidateQueries({ queryKey: ["blockedUsers"] });
      qc.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const blocked = blockedData?.data ?? [];
  const total = blockedData?.total ?? 0;
  const totalPages = blockedData?.total_pages ?? 1;
  const inDevices = (blockedData?.in_devices ?? []) as number[];
  const outDevices = (blockedData?.out_devices ?? []) as number[];

  return (
    <div className="p-5 lg:p-6 space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3 animate-in">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Bloklangan</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Jami: {total} ta
            {isFetching && !isLoading && <Loader2 className="w-3 h-3 inline ml-2 animate-spin text-primary" />}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setShowCheck(true)}
            className="h-9 px-3 rounded-lg text-xs font-semibold bg-blue-500 text-white hover:bg-blue-600 flex items-center gap-2">
            <UserSearch className="w-3.5 h-3.5" /> Tekshirish
          </button>
          <button onClick={() => setShowAdd(true)}
            className="h-9 px-3 rounded-lg text-xs font-semibold bg-rose-500 text-white hover:bg-rose-600 flex items-center gap-2">
            <Plus className="w-3.5 h-3.5" /> Bitta bloklash
          </button>
          <button onClick={() => setShowBulkText("block")}
            className="h-9 px-3 rounded-lg text-xs font-semibold bg-white border border-border hover:bg-muted flex items-center gap-2">
            <List className="w-3.5 h-3.5" /> Ro'yxat bilan
          </button>
          <button onClick={() => setShowExcel("block")}
            className="h-9 px-3 rounded-lg text-xs font-semibold bg-white border border-border hover:bg-muted flex items-center gap-2">
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Excel import
          </button>
          <button onClick={() => setShowBulkText("unblock")}
            className="h-9 px-3 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5" /> Blokdan chiqarish
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-2 animate-in" style={{ animationDelay: "50ms" }}>
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input placeholder="Ism yoki passport bo'yicha qidirish..." value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { setSearch(searchInput.trim()); setPage(1); } }}
            className="w-full h-9 pl-8 pr-8 text-sm rounded-lg border border-border/60 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20" />
          {searchInput && (
            <button onClick={() => { setSearchInput(""); setSearch(""); setPage(1); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded hover:bg-muted">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
        <button onClick={() => { setSearch(searchInput.trim()); setPage(1); }}
          className="h-9 px-4 text-xs font-semibold rounded-lg bg-primary text-white hover:bg-primary/90">
          Qidirish
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground animate-in" style={{ animationDelay: "75ms" }}>
        <span className="font-semibold">Qurilma holati:</span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-rose-500 border border-rose-600" /> Bloklangan
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-200" /> Ruxsat
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-muted border border-border/60" /> Yo'q
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-border/50 overflow-hidden animate-in" style={{ animationDelay: "100ms" }}>
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-12 skeleton" />)}
          </div>
        ) : blocked.length === 0 ? (
          <div className="text-center py-20">
            <ShieldCheck className="w-12 h-12 text-emerald-500/20 mx-auto mb-3" />
            <p className="text-[15px] font-semibold text-muted-foreground">Bloklangan foydalanuvchilar yo'q</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/40 bg-rose-50/30">
                {["#", "Foydalanuvchi", "Lavozim", "Qurilmalar", "Amal"].map((h) => (
                  <th key={h} className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {blocked.map((u, i) => (
                <tr key={u.id ?? u.name} className="border-b border-border/15 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 text-xs text-muted-foreground">{(page - 1) * perPage + i + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {u.image ? (
                        <img src={u.image} className="w-16 h-16 rounded-xl object-cover border-2 border-rose-100 shadow-sm" loading="lazy" />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-rose-400 flex items-center justify-center text-[20px] font-bold text-white">
                          {(u.name || "?")[0]}
                        </div>
                      )}
                      <div>
                        <p className="text-[14px] font-semibold">{u.full_name || u.name}</p>
                        <p className="text-[11px] text-muted-foreground font-mono">{u.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {u.role ? <span className="text-[11px] bg-primary/8 text-primary px-2 py-0.5 rounded-full font-medium">{u.role}</span> : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1.5">
                      {[
                        { label: "Kirish", devices: inDevices, arrow: "↓" },
                        { label: "Chiqish", devices: outDevices, arrow: "↑" },
                      ].map((row) => (
                        <div key={row.label} className="flex items-center gap-2">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground w-14 shrink-0">
                            {row.arrow} {row.label}
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {row.devices.map((fid) => {
                              const state = u.device_states?.[String(fid)] ?? "missing";
                              const styles =
                                state === "blocked" ? "bg-rose-500 text-white border-rose-600" :
                                state === "allowed" ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                                state === "missing" ? "bg-muted text-muted-foreground border-border/60" :
                                "bg-amber-100 text-amber-700 border-amber-200";
                              const stateLabel =
                                state === "blocked" ? "bloklangan" :
                                state === "allowed" ? "ruxsat" :
                                state === "missing" ? "qurilmada yo'q" : "noma'lum";
                              return (
                                <span key={fid} title={`${fid} (${row.label}) — ${stateLabel}`}
                                  className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${styles}`}>
                                  {String(fid).slice(-4)}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => unblockMut.mutate(u.name)}
                      disabled={!u.name || pendingNames.has(u.name)}
                      className="h-8 px-3 rounded-lg text-[11px] font-bold bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 flex items-center gap-1.5"
                      title="Barcha 8 turniketdan blokdan chiqarish">
                      {pendingNames.has(u.name) ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3 h-3" />}
                      Blokdan chiqarish
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-2 animate-in">
          <p className="text-[12px] text-muted-foreground">
            {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} / {total}
          </p>
          <div className="flex gap-1">
            <button onClick={() => setPage(1)} disabled={page === 1}
              className="h-8 px-3 text-xs font-semibold rounded-lg bg-white border border-border/60 hover:bg-muted disabled:opacity-40">«</button>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="h-8 px-3 text-xs font-semibold rounded-lg bg-white border border-border/60 hover:bg-muted disabled:opacity-40">‹</button>
            <span className="h-8 px-3 text-xs font-semibold rounded-lg bg-primary text-white flex items-center">
              {page} / {totalPages}
            </span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
              className="h-8 px-3 text-xs font-semibold rounded-lg bg-white border border-border/60 hover:bg-muted disabled:opacity-40">›</button>
            <button onClick={() => setPage(totalPages)} disabled={page >= totalPages}
              className="h-8 px-3 text-xs font-semibold rounded-lg bg-white border border-border/60 hover:bg-muted disabled:opacity-40">»</button>
          </div>
        </div>
      )}

      <AddBlockModal open={showAdd} onClose={() => setShowAdd(false)} />
      <BulkTextModal open={!!showBulkText} onClose={() => setShowBulkText(null)} action={showBulkText || "block"} />
      <ExcelImportModal open={!!showExcel} onClose={() => setShowExcel(null)} action={showExcel || "block"} />
      <CheckUserModal open={showCheck} onClose={() => setShowCheck(false)} />
    </div>
  );
}
