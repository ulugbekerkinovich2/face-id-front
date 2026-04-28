import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Search, ChevronLeft, ChevronRight, ArrowDownToLine,
  ArrowUpFromLine, Calendar, ScrollText, X, Eye, ShieldBan,
} from "lucide-react";
import AttendanceSheet from "@/components/AttendanceSheet";

export default function LogsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [date, setDate] = useState("");
  const [direction, setDirection] = useState("");
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["logs", page, search, date, direction],
    queryFn: () => api.getLogs({ page, per_page: 25, search, date, direction }),
    staleTime: 15_000,
    placeholderData: (prev: any) => prev,
  });


  const handleSearch = () => { setSearch(searchInput); setPage(1); };

  return (
    <div className="p-5 lg:p-6 space-y-5">
      <div className="animate-in">
        <h1 className="text-2xl font-extrabold tracking-tight">Loglar</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          Kirish / chiqish yozuvlari {data ? `(${data.total.toLocaleString()} ta)` : ""}
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-border/50 p-3 flex flex-wrap gap-2 animate-in" style={{ animationDelay: "50ms" }}>
        <div className="flex-1 min-w-[180px] flex gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input placeholder="Ism bo'yicha..." value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="w-full h-9 pl-8 pr-3 text-sm rounded-lg border border-border/60 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
          </div>
          <button onClick={handleSearch} className="h-9 px-4 text-xs font-semibold rounded-lg bg-primary text-white hover:bg-primary/90">Qidirish</button>
        </div>

        <div className="flex items-center gap-2">
          {/* Direction filter */}
          <div className="flex bg-muted/60 rounded-lg p-0.5">
            {[
              { v: "", l: "Barchasi" },
              { v: "IN", l: "Kirish" },
              { v: "OUT", l: "Chiqish" },
            ].map((d) => (
              <button key={d.v} onClick={() => { setDirection(d.v); setPage(1); }}
                className={`text-[11px] font-medium px-2.5 py-1.5 rounded-md transition-all ${direction === d.v ? "bg-white text-foreground shadow-sm" : "text-muted-foreground"}`}>
                {d.l}
              </button>
            ))}
          </div>

          <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
          <input type="date" value={date} onChange={(e) => { setDate(e.target.value); setPage(1); }}
            className="h-9 px-3 text-sm rounded-lg border border-border/60 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
          {(search || date || direction) && (
            <button onClick={() => { setSearch(""); setSearchInput(""); setDate(""); setDirection(""); setPage(1); }}
              className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-muted"><X className="w-3.5 h-3.5" /></button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-border/50 overflow-hidden animate-in" style={{ animationDelay: "100ms" }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/40 bg-muted/20">
                {["#", "Rasm", "Ism", "Yo'nalish", "Qurilma", "O'xshashlik", "Vaqt"].map((h) => (
                  <th key={h} className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i} className="border-b border-border/20">
                    <td colSpan={7} className="px-4 py-4"><div className="h-10 skeleton w-full" /></td>
                  </tr>
                ))
              ) : (data?.data ?? []).length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-20">
                    <ScrollText className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Ma'lumot topilmadi</p>
                  </td>
                </tr>
              ) : (
                (data?.data ?? []).map((log, i) => {
                  const isBlocked = log.is_blocked;
                  return (
                  <tr key={log.id} className={`border-b border-border/15 hover:bg-primary/[0.02] transition-colors group ${isBlocked ? "bg-rose-50/50" : ""}`}>
                    <td className="px-4 py-2 text-xs text-muted-foreground tabular-nums w-10">
                      {(page - 1) * 25 + i + 1}
                    </td>

                    {/* Rasm - kattaroq */}
                    <td className="px-4 py-2">
                      {log.image ? (
                        <div className="relative cursor-pointer group/img" onClick={() => setLightbox(log.image)}>
                          <img src={log.image} alt="" loading="lazy"
                            className="w-14 h-14 rounded-xl object-cover border-2 border-white shadow-md group-hover/img:shadow-lg group-hover/img:scale-105 transition-all duration-200" />
                          <div className="absolute inset-0 rounded-xl bg-black/0 group-hover/img:bg-black/10 transition-all flex items-center justify-center">
                            <Eye className="w-4 h-4 text-white opacity-0 group-hover/img:opacity-100 transition-opacity drop-shadow-lg" />
                          </div>
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                          <span className="text-[14px] font-bold text-muted-foreground/40">
                            {(log.name || "?")[0]}
                          </span>
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          className="text-[13px] font-semibold hover:text-primary hover:underline underline-offset-2 transition-colors text-left"
                          onClick={() => setSelectedName(log.name)}
                        >
                          {log.name || "Noma'lum"}
                        </button>
                        {isBlocked && (
                          <span className="inline-flex items-center gap-0.5 text-[8px] bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded-full font-bold">
                            <ShieldBan className="w-2.5 h-2.5" />BLOK
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-2">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full ${
                        log.direction === "IN"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-rose-50 text-rose-600"
                      }`}>
                        {log.direction === "IN"
                          ? <ArrowDownToLine className="w-3 h-3" />
                          : <ArrowUpFromLine className="w-3 h-3" />}
                        {log.direction === "IN" ? "Kirish" : "Chiqish"}
                      </span>
                    </td>

                    <td className="px-4 py-2 text-[12px] text-muted-foreground font-mono">{log.face_id}</td>

                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${
                            log.similarity >= 85 ? "bg-emerald-500" : log.similarity >= 70 ? "bg-amber-500" : "bg-rose-500"
                          }`} style={{ width: `${log.similarity}%` }} />
                        </div>
                        <span className={`text-[11px] font-bold tabular-nums w-8 text-right ${
                          log.similarity >= 85 ? "text-emerald-600" : log.similarity >= 70 ? "text-amber-600" : "text-rose-500"
                        }`}>
                          {log.similarity}%
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-2 text-[12px] text-muted-foreground tabular-nums">
                      {log.time ? (
                        <div>
                          <p className="font-medium">{new Date(log.time).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })}</p>
                          <p className="text-[10px] text-muted-foreground/60">{new Date(log.time).toLocaleDateString("uz-UZ", { day: "numeric", month: "short" })}</p>
                        </div>
                      ) : "—"}
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.total_pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border/30 bg-muted/10">
            <p className="text-[11px] text-muted-foreground">
              Sahifa <strong>{page}</strong> / {data.total_pages} &middot; Jami <strong>{data.total.toLocaleString()}</strong>
            </p>
            <div className="flex items-center gap-1">
              <button disabled={page <= 1} onClick={() => setPage(1)}
                className="w-8 h-8 flex items-center justify-center rounded-md border border-border/40 hover:bg-muted disabled:opacity-20 transition-colors text-xs font-bold">1</button>
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                className="w-8 h-8 flex items-center justify-center rounded-md border border-border/40 hover:bg-muted disabled:opacity-20 transition-colors">
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-semibold px-3 tabular-nums bg-primary/5 rounded-md py-1.5">{page}</span>
              <button disabled={page >= data.total_pages} onClick={() => setPage(p => p + 1)}
                className="w-8 h-8 flex items-center justify-center rounded-md border border-border/40 hover:bg-muted disabled:opacity-20 transition-colors">
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button disabled={page >= data.total_pages} onClick={() => setPage(data.total_pages)}
                className="w-8 h-8 flex items-center justify-center rounded-md border border-border/40 hover:bg-muted disabled:opacity-20 transition-colors text-xs font-bold">{data.total_pages}</button>
            </div>
          </div>
        )}
      </div>

      {/* Attendance detail sheet */}
      <AttendanceSheet
        name={selectedName}
        open={!!selectedName}
        onClose={() => setSelectedName(null)}
      />

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in" onClick={() => setLightbox(null)}>
          <div className="relative max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <img src={lightbox} alt="" className="w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl" />
            <button onClick={() => setLightbox(null)}
              className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-white shadow-xl flex items-center justify-center hover:bg-muted transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
