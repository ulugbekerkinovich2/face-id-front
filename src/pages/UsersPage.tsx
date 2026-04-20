import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, User } from "@/lib/api";
import { toast } from "sonner";
import {
  Search, UserPlus, Trash2,
  ChevronLeft, ChevronRight, Users, X, Loader2,
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

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["users", page, search],
    queryFn: () => api.getUsers({ page, per_page: 30, search }),
    staleTime: 15_000,
    placeholderData: (prev: any) => prev,
  });

  const deleteMut = useMutation({
    mutationFn: api.deleteUser,
    onSuccess: () => { toast.success("O'chirildi"); qc.invalidateQueries({ queryKey: ["users"] }); },
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
                        {u.image ? (
                          <img src={u.image} className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-sm" loading="lazy" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/60 to-primary flex items-center justify-center text-[11px] font-bold text-white">
                            {(u.name || "?")[0]}
                          </div>
                        )}
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
