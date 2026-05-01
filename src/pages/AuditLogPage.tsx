import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { History, ChevronLeft, ChevronRight, Search } from "lucide-react";

const ACTION_BADGE: Record<string, string> = {
  "auth.login": "bg-emerald-100 text-emerald-700",
  "auth.logout": "bg-slate-100 text-slate-700",
  "admin_user.create": "bg-blue-100 text-blue-700",
  "admin_user.update": "bg-amber-100 text-amber-700",
  "admin_user.delete": "bg-rose-100 text-rose-700",
  "user.block": "bg-rose-100 text-rose-700",
  "user.unblock": "bg-emerald-100 text-emerald-700",
  "role.update": "bg-violet-100 text-violet-700",
};

export default function AuditLogPage() {
  const [page, setPage] = useState(1);
  const [actor, setActor] = useState("");
  const [action, setAction] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["audit", page, actor, action],
    queryFn: () => api.rbacAudit({ page, per_page: 50, actor, action }),
    placeholderData: (prev: any) => prev,
  });

  const rows = data?.data ?? [];
  return (
    <div className="p-5 lg:p-6 space-y-5">
      <div className="animate-in">
        <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
          <History className="w-6 h-6 text-violet-600" /> Audit log
        </h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">Kim, qachon, qaysi ishni qildi</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input placeholder="Foydalanuvchi..." value={actor}
                 onChange={(e) => { setActor(e.target.value); setPage(1); }}
                 className="w-full h-9 pl-8 pr-3 text-sm rounded-lg border border-border/60 bg-white" />
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input placeholder="Action (auth.login)..." value={action}
                 onChange={(e) => { setAction(e.target.value); setPage(1); }}
                 className="w-full h-9 pl-8 pr-3 text-sm rounded-lg border border-border/60 bg-white" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border/50 overflow-hidden animate-in">
        {isLoading && rows.length === 0 ? (
          <div className="p-5 space-y-2">{[...Array(8)].map((_, i) => <div key={i} className="h-12 skeleton" />)}</div>
        ) : rows.length === 0 ? (
          <div className="text-center py-16">
            <History className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Yozuvlar yo'q</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/40 bg-muted/30">
                {["Vaqt", "Foydalanuvchi", "Action", "Target", "Method/Path", "IP"].map(h => (
                  <th key={h} className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-b border-border/15 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 text-[11px] text-muted-foreground tabular-nums whitespace-nowrap">
                    {new Date(r.created_at).toLocaleString("uz-UZ", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-[12px] font-semibold">{r.actor_username || "—"}</p>
                    {r.actor_role && <p className="text-[10px] text-muted-foreground">{r.actor_role}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ACTION_BADGE[r.action] ?? "bg-slate-100 text-slate-600"}`}>
                      {r.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[11px]">
                    {r.target_type ? `${r.target_type}#${r.target_id}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-[10px] font-mono text-muted-foreground truncate max-w-[280px]">
                    <span className="font-bold mr-1">{r.method}</span>{r.path}
                    {r.status_code && <span className="ml-1 opacity-70">[{r.status_code}]</span>}
                  </td>
                  <td className="px-4 py-3 text-[10px] font-mono text-muted-foreground">{r.ip || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {data && data.total_pages > 1 && (
        <div className="flex items-center justify-between gap-2">
          <p className="text-[12px] text-muted-foreground">
            {(page - 1) * data.per_page + 1}–{Math.min(page * data.per_page, data.total)} / {data.total}
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
    </div>
  );
}
