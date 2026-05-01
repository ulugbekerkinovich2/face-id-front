import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, AdminUserItem, RbacRole } from "@/lib/api";
import { usePermission } from "@/hooks/usePermission";
import {
  ShieldCheck, Plus, Pencil, Trash2, Search, X, Loader2, User, Eye, EyeOff,
} from "lucide-react";

const ROLE_BADGE: Record<string, string> = {
  super_admin: "bg-violet-500 text-white",
  admin: "bg-blue-500 text-white",
};

interface PermGroup { code: string; label: string }

function UserModal({
  open, onClose, editing, roles, permissionsByModule,
}: {
  open: boolean;
  onClose: () => void;
  editing?: AdminUserItem | null;
  roles: RbacRole[];
  permissionsByModule: Record<string, PermGroup[]>;
}) {
  const qc = useQueryClient();
  const isEdit = !!editing;
  const [username, setUsername] = useState(editing?.username ?? "");
  const [fullName, setFullName] = useState(editing?.full_name ?? "");
  const [email, setEmail] = useState(editing?.email ?? "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState(editing?.role ?? "admin");
  const [isActive, setIsActive] = useState(editing?.is_active ?? true);
  const [extraPerms, setExtraPerms] = useState<Set<string>>(new Set(editing?.extra_permissions ?? []));

  const mut = useMutation({
    mutationFn: () => {
      const body: any = { full_name: fullName, email, role, is_active: isActive,
                          extra_permissions: Array.from(extraPerms) };
      if (password) body.password = password;
      if (!isEdit) {
        body.username = username;
        return api.rbacCreateUser(body);
      }
      return api.rbacUpdateUser(editing!.id, body);
    },
    onSuccess: () => {
      toast.success(isEdit ? "Yangilandi" : "Yaratildi");
      qc.invalidateQueries({ queryKey: ["rbac-users"] });
      onClose();
    },
    onError: (e: any) => toast.error(e?.error || "Xato"),
  });

  if (!open) return null;
  const togglePerm = (code: string) => {
    setExtraPerms(prev => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code); else next.add(code);
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-border/30 sticky top-0 bg-white z-10">
          <h3 className="text-base font-bold">{isEdit ? `Tahrirlash — ${editing!.username}` : "Yangi admin yaratish"}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">Username *</label>
              <input value={username} onChange={(e) => setUsername(e.target.value)} disabled={isEdit}
                     className="w-full h-10 px-3 text-sm rounded-lg border border-border/60 disabled:bg-muted/40" />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                     className="w-full h-10 px-3 text-sm rounded-lg border border-border/60" />
            </div>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">F.I.O</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)}
                   className="w-full h-10 px-3 text-sm rounded-lg border border-border/60" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
                Parol {isEdit ? "(bo'sh - o'zgarmaydi)" : "*"}
              </label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={password}
                       onChange={(e) => setPassword(e.target.value)}
                       placeholder={isEdit ? "•••••••• (o'zgartirish uchun yozing)" : "Yangi parol"}
                       className="w-full h-10 pl-3 pr-10 text-sm rounded-lg border border-border/60" />
                <button type="button" onClick={() => setShowPassword(s => !s)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
                        aria-label={showPassword ? "Yashirish" : "Ko'rsatish"}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">Role *</label>
              <select value={role} onChange={(e) => setRole(e.target.value)}
                      className="w-full h-10 px-3 text-sm rounded-lg border border-border/60 bg-white">
                {roles.map(r => <option key={r.name} value={r.name}>{r.label || r.name}</option>)}
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-[13px] font-medium pt-1">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)}
                   className="w-4 h-4 accent-violet-600" />
            Aktiv foydalanuvchi
          </label>

          <div className="pt-3 border-t border-border/30">
            <p className="text-[11px] font-semibold text-muted-foreground mb-2">Qo'shimcha permissionlar (rolga qo'shimcha)</p>
            <div className="space-y-3">
              {Object.entries(permissionsByModule).map(([mod, perms]) => (
                <div key={mod}>
                  <p className="text-[10px] font-bold text-violet-600 uppercase tracking-wider mb-1.5">{mod}</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {perms.map(p => (
                      <label key={p.code} className="flex items-center gap-2 text-[12px] p-2 rounded-lg hover:bg-muted/40 cursor-pointer">
                        <input type="checkbox" checked={extraPerms.has(p.code)}
                               onChange={() => togglePerm(p.code)}
                               className="w-3.5 h-3.5 accent-violet-600" />
                        <span>{p.label}</span>
                        <span className="ml-auto text-[10px] text-muted-foreground font-mono">{p.code}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-2 p-5 pt-0 sticky bottom-0 bg-white border-t border-border/30">
          <button onClick={onClose} className="flex-1 h-10 rounded-lg text-sm font-medium bg-muted/50 hover:bg-muted">Bekor</button>
          <button onClick={() => mut.mutate()} disabled={mut.isPending}
                  className="flex-1 h-10 rounded-lg text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {mut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            {isEdit ? "Saqlash" : "Yaratish"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const canCreate = usePermission("admin_users.create");
  const canUpdate = usePermission("admin_users.update");
  const canDelete = usePermission("admin_users.delete");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AdminUserItem | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["rbac-users", search],
    queryFn: () => api.rbacUsers({ search }),
  });
  const { data: rolesData } = useQuery({
    queryKey: ["rbac-roles"],
    queryFn: api.rbacRoles,
    staleTime: 60_000,
  });
  const { data: permsData } = useQuery({
    queryKey: ["rbac-perms"],
    queryFn: api.rbacPermissions,
    staleTime: 300_000,
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.rbacDeleteUser(id),
    onSuccess: () => { toast.success("O'chirildi"); qc.invalidateQueries({ queryKey: ["rbac-users"] }); },
    onError: () => toast.error("O'chira olmadik"),
  });

  const users = data?.users ?? [];
  return (
    <div className="p-5 lg:p-6 space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3 animate-in">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-violet-600" /> Admin foydalanuvchilar
          </h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Tizimga kira oluvchi foydalanuvchilar va ularning ruxsatlari
          </p>
        </div>
        {canCreate && (
          <button onClick={() => { setEditing(null); setShowModal(true); }}
                  className="h-10 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm flex items-center gap-2 shadow-lg shadow-violet-500/20">
            <Plus className="w-4 h-4" /> Yangi
          </button>
        )}
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input placeholder="username, FIO, email..." value={search}
                 onChange={(e) => setSearch(e.target.value)}
                 className="w-full h-10 pl-8 pr-3 text-sm rounded-lg border border-border/60 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border/50 overflow-hidden animate-in">
        {isLoading ? (
          <div className="p-5 space-y-2">
            {[...Array(4)].map((_, i) => <div key={i} className="h-14 skeleton" />)}
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16">
            <User className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Admin foydalanuvchilar yo'q</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/40 bg-muted/30">
                {["#", "User", "Role", "Status", "Oxirgi kirish", "Amal"].map(h => (
                  <th key={h} className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u.id} className="border-b border-border/15 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 text-xs text-muted-foreground">{i + 1}</td>
                  <td className="px-4 py-3">
                    <p className="text-[13px] font-bold">{u.full_name || u.username}</p>
                    <p className="text-[11px] text-muted-foreground font-mono">@{u.username}{u.email && ` · ${u.email}`}</p>
                    {u.extra_permissions.length > 0 && (
                      <p className="text-[10px] text-violet-600 mt-0.5">+{u.extra_permissions.length} qo'shimcha permission</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${ROLE_BADGE[u.role] ?? "bg-slate-300 text-white"}`}>
                      {u.role_label || u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.is_active
                      ? <span className="text-[11px] font-semibold text-emerald-600">● Aktiv</span>
                      : <span className="text-[11px] text-muted-foreground">○ Bloklangan</span>}
                  </td>
                  <td className="px-4 py-3 text-[11px] text-muted-foreground tabular-nums">
                    {u.last_login ? new Date(u.last_login).toLocaleString("uz-UZ", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {canUpdate && (
                        <button onClick={() => { setEditing(u); setShowModal(true); }}
                                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-violet-50 text-violet-600">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {canDelete && (
                        <button onClick={() => {
                          if (confirm(`${u.username}'ni o'chirib yuboraylikmi?`)) deleteMut.mutate(u.id);
                        }} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-rose-50 text-rose-500">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Roles summary */}
      {rolesData && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {rolesData.roles.map(r => (
            <div key={r.name} className="bg-white rounded-2xl border border-border/50 p-4">
              <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${ROLE_BADGE[r.name] ?? "bg-slate-300 text-white"}`}>
                {r.label || r.name}
              </span>
              <p className="text-[24px] font-extrabold tabular-nums mt-2">{r.user_count}</p>
              <p className="text-[11px] text-muted-foreground">foydalanuvchi · {r.permissions.length} permission</p>
            </div>
          ))}
        </div>
      )}

      <UserModal
        key={showModal ? (editing?.id ?? "new") : "closed"}
        open={showModal} onClose={() => setShowModal(false)}
        editing={editing}
        roles={rolesData?.roles ?? []}
        permissionsByModule={permsData?.by_module ?? {}}
      />
    </div>
  );
}
