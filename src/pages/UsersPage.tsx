import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, User } from "@/lib/api";
import { toast } from "sonner";
import {
  Search, UserPlus, Trash2, ShieldBan, ShieldCheck,
  ChevronLeft, ChevronRight, Users, X, Loader2,
} from "lucide-react";

function AddUserModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [gender, setGender] = useState(0);
  const [extraInfo, setExtraInfo] = useState("");

  const mutation = useMutation({
    mutationFn: () => api.addUser({ name, gender, extra_info: extraInfo }),
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["users"] });
      onClose();
      setName(""); setGender(0); setExtraInfo("");
    },
    onError: (e: any) => toast.error(e.message || "Xatolik yuz berdi"),
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-border/30">
          <h3 className="text-base font-semibold">Yangi foydalanuvchi</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Ism *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ism Familiya"
              className="w-full h-10 px-3 text-sm rounded-lg border border-border/60 bg-muted/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Jinsi</label>
            <div className="flex gap-2">
              {[{ v: 0, l: "Erkak" }, { v: 1, l: "Ayol" }].map((g) => (
                <button key={g.v} onClick={() => setGender(g.v)}
                  className={`flex-1 h-10 rounded-lg text-sm font-medium transition-all ${gender === g.v ? "bg-primary text-white shadow-sm" : "bg-muted/50 text-muted-foreground hover:bg-muted"}`}>
                  {g.l}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Qo'shimcha ma'lumot</label>
            <textarea value={extraInfo} onChange={(e) => setExtraInfo(e.target.value)} rows={2} placeholder="Izoh..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-border/60 bg-muted/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none" />
          </div>
        </div>
        <div className="flex gap-2 p-5 pt-0">
          <button onClick={onClose} className="flex-1 h-10 rounded-lg text-sm font-medium bg-muted/50 hover:bg-muted transition-colors">Bekor qilish</button>
          <button onClick={() => mutation.mutate()} disabled={!name.trim() || mutation.isPending}
            className="flex-1 h-10 rounded-lg text-sm font-semibold bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            Qo'shish
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["users", page, search],
    queryFn: () => api.getUsers({ page, per_page: 20, search }),
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteUser,
    onSuccess: () => { toast.success("Foydalanuvchi o'chirildi"); queryClient.invalidateQueries({ queryKey: ["users"] }); },
    onError: () => toast.error("O'chirishda xatolik"),
  });

  const blockMutation = useMutation({
    mutationFn: ({ id, action }: { id: number; action: "block" | "unblock" }) =>
      action === "block" ? api.blockUser(id) : api.unblockUser(id),
    onSuccess: (data) => { toast.success(data.blocked ? "Bloklandi" : "Blokdan chiqarildi"); queryClient.invalidateQueries({ queryKey: ["users"] }); },
    onError: () => toast.error("Xatolik yuz berdi"),
  });

  const isBlocked = (user: User) => (user.extra_info || "").startsWith("BLOCKED|");

  return (
    <div className="p-5 lg:p-6 space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3 animate-in">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Foydalanuvchilar</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Qurilmalardagi barcha foydalanuvchilar</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="h-9 px-4 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-sm shadow-primary/20">
          <UserPlus className="w-3.5 h-3.5" /> Yangi qo'shish
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-border/40 p-3.5 flex gap-2.5 animate-in" style={{ animationDelay: "50ms" }}>
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input placeholder="Ism bo'yicha qidirish..." value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { setSearch(searchInput); setPage(1); } }}
            className="w-full h-9 pl-8 pr-3 text-sm rounded-lg border border-border/60 bg-muted/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
        </div>
        <button onClick={() => { setSearch(searchInput); setPage(1); }}
          className="h-9 px-4 text-xs font-semibold rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors">Qidirish</button>
        {search && <button onClick={() => { setSearch(""); setSearchInput(""); setPage(1); }}
          className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-muted"><X className="w-3.5 h-3.5" /></button>}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-[160px] skeleton" />)}
        </div>
      ) : (data?.data ?? []).length === 0 ? (
        <div className="text-center py-16 animate-in">
          <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Foydalanuvchilar topilmadi</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
          {(data?.data ?? []).map((user, i) => {
            const blocked = isBlocked(user);
            return (
              <div key={user.id} className={`animate-in bg-white rounded-xl border overflow-hidden transition-all hover:shadow-md ${blocked ? "border-rose-200/60 bg-rose-50/30" : "border-border/40"}`}
                style={{ animationDelay: `${i * 40}ms` }}>
                <div className={`h-0.5 ${blocked ? "bg-rose-400" : "bg-gradient-to-r from-primary/60 to-primary"}`} />
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    {user.image ? (
                      <img src={user.image} className="w-11 h-11 rounded-xl object-cover border-2 border-white shadow-sm" />
                    ) : (
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold text-white shadow-sm ${blocked ? "bg-rose-400" : "bg-gradient-to-br from-primary/80 to-primary"}`}>
                        {(user.name || "?")[0]}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold truncate">{user.full_name || user.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {user.role && <span className="text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">{user.role}</span>}
                        {blocked && <span className="text-[10px] text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded font-semibold">BLOKLANGAN</span>}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">{user.gender === "female" ? "Ayol" : "Erkak"} &middot; ID: {user.uid}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1.5 mt-3 pt-3 border-t border-border/30">
                    {blocked ? (
                      <button onClick={() => blockMutation.mutate({ id: user.id, action: "unblock" })}
                        className="flex-1 h-8 rounded-lg text-[11px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors flex items-center justify-center gap-1.5">
                        <ShieldCheck className="w-3 h-3" /> Blokdan chiqarish
                      </button>
                    ) : (
                      <button onClick={() => blockMutation.mutate({ id: user.id, action: "block" })}
                        className="flex-1 h-8 rounded-lg text-[11px] font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors flex items-center justify-center gap-1.5">
                        <ShieldBan className="w-3 h-3" /> Bloklash
                      </button>
                    )}
                    <button onClick={() => { if (confirm(`"${user.name}" ni o'chirishga ishonchingiz komilmi?`)) deleteMutation.mutate(user.id); }}
                      className="h-8 w-8 rounded-lg flex items-center justify-center bg-rose-50 text-rose-500 hover:bg-rose-100 transition-colors">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {data && data.total_pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-muted-foreground">Jami <strong>{data.total}</strong></p>
          <div className="flex items-center gap-1">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="w-8 h-8 flex items-center justify-center rounded-md border border-border/40 hover:bg-muted disabled:opacity-30 transition-colors"><ChevronLeft className="w-3.5 h-3.5" /></button>
            <span className="text-xs font-medium px-2 tabular-nums">{page} / {data.total_pages}</span>
            <button disabled={page >= data.total_pages} onClick={() => setPage(p => p + 1)} className="w-8 h-8 flex items-center justify-center rounded-md border border-border/40 hover:bg-muted disabled:opacity-30 transition-colors"><ChevronRight className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      )}

      <AddUserModal open={showAdd} onClose={() => setShowAdd(false)} />
    </div>
  );
}
