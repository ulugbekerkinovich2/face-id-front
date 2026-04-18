import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, User } from "@/lib/api";
import { toast } from "sonner";
import {
  ShieldBan, ShieldCheck, Search, X, Loader2, UserX, Plus,
} from "lucide-react";

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
    onSuccess: (d: any) => {
      toast.success(d.message, { description: `${d.devices_ok}/${d.devices_total} qurilmada` });
      qc.invalidateQueries({ queryKey: ["blockedUsers"] });
      qc.invalidateQueries({ queryKey: ["searchUsers"] });
    },
    onError: () => toast.error("Xatolik"),
  });

  if (!open) return null;

  const results = (data?.data ?? []).filter((u: User) => !(u.extra_info || "").startsWith("BLOCKED|"));

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-in" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-border/30">
          <h3 className="text-base font-bold">Foydalanuvchini bloklash</h3>
          <p className="text-[12px] text-muted-foreground mt-0.5">Barcha 8 ta qurilmadan chiqarib tashlanadi</p>
        </div>

        <div className="p-5">
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input placeholder="Ism yoki passport raqami..." value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") setSearch(searchInput); }}
                className="w-full h-10 pl-8 pr-3 text-sm rounded-lg border border-border/60 focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <button onClick={() => setSearch(searchInput)}
              className="h-10 px-4 text-xs font-semibold rounded-lg bg-primary text-white hover:bg-primary/90">Qidirish</button>
          </div>

          <div className="max-h-[300px] overflow-y-auto custom-scrollbar space-y-1">
            {!search ? (
              <p className="text-sm text-muted-foreground text-center py-8">Ism kiriting va qidiring</p>
            ) : isLoading ? (
              <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
            ) : results.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Faol foydalanuvchi topilmadi</p>
            ) : results.map((u: User) => (
              <div key={u.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  {u.image ? (
                    <img src={u.image} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/60 to-primary flex items-center justify-center text-[12px] font-bold text-white">
                      {(u.name || "?")[0]}
                    </div>
                  )}
                  <div>
                    <p className="text-[13px] font-semibold">{u.full_name || u.name}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{u.name}</p>
                    {u.role && <span className="text-[9px] bg-primary/8 text-primary px-1.5 py-0.5 rounded-full font-medium">{u.role}</span>}
                  </div>
                </div>
                <button onClick={() => blockMut.mutate(u.id)} disabled={blockMut.isPending}
                  className="h-8 px-3 rounded-lg text-[11px] font-bold bg-rose-500 text-white hover:bg-rose-600 disabled:opacity-50 flex items-center gap-1.5 transition-all">
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

export default function BlockedPage() {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["blockedUsers"],
    queryFn: async () => {
      // Barcha userlardan BLOCKED larni filter
      const all: User[] = [];
      let page = 1;
      while (true) {
        const res = await api.getUsers({ page, per_page: 50 });
        const blocked = res.data.filter((u: User) => (u.extra_info || "").startsWith("BLOCKED|"));
        all.push(...blocked);
        if (page >= res.total_pages) break;
        page++;
      }
      return all;
    },
    staleTime: 30_000,
  });

  const unblockMut = useMutation({
    mutationFn: (id: number) => api.unblockUser(id),
    onSuccess: (d: any) => {
      toast.success(d.message, { description: `${d.devices_ok}/${d.devices_total} qurilmada` });
      qc.invalidateQueries({ queryKey: ["blockedUsers"] });
    },
    onError: () => toast.error("Xatolik"),
  });

  const blocked = data ?? [];

  return (
    <div className="p-5 lg:p-6 space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3 animate-in">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Bloklangan foydalanuvchilar</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            {blocked.length} ta bloklangan
            {isFetching && !isLoading && <Loader2 className="w-3 h-3 inline ml-2 animate-spin text-primary" />}
          </p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="h-9 px-4 rounded-lg text-xs font-semibold bg-rose-500 text-white hover:bg-rose-600 flex items-center gap-2 shadow-sm shadow-rose-500/20">
          <Plus className="w-3.5 h-3.5" /> Bloklash
        </button>
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
            <p className="text-[12px] text-muted-foreground/60 mt-1">Barcha foydalanuvchilar faol</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/40 bg-rose-50/30">
                {["#", "Foydalanuvchi", "Lavozim", "Qurilma", "Amal"].map((h) => (
                  <th key={h} className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {blocked.map((u, i) => (
                <tr key={u.id} className="border-b border-border/15 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 text-xs text-muted-foreground">{i + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      {u.image ? (
                        <img src={u.image} className="w-9 h-9 rounded-full object-cover border-2 border-rose-100 shadow-sm" loading="lazy" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-rose-400 flex items-center justify-center text-[11px] font-bold text-white">
                          {(u.name || "?")[0]}
                        </div>
                      )}
                      <div>
                        <p className="text-[13px] font-semibold">{u.full_name || u.name}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{u.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {u.role ? <span className="text-[11px] bg-primary/8 text-primary px-2 py-0.5 rounded-full font-medium">{u.role}</span> : "—"}
                  </td>
                  <td className="px-4 py-3 text-[12px] text-muted-foreground font-mono">{u.face_id || "—"}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => unblockMut.mutate(u.id)} disabled={unblockMut.isPending}
                      className="h-8 px-3 rounded-lg text-[11px] font-bold bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 flex items-center gap-1.5 transition-all">
                      {unblockMut.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3 h-3" />}
                      Blokdan chiqarish
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <AddBlockModal open={showAdd} onClose={() => setShowAdd(false)} />
    </div>
  );
}
