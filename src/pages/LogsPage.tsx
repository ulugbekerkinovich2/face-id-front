import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowDownToLine,
  ArrowUpFromLine,
  Calendar,
  ScrollText,
  X,
} from "lucide-react";

export default function LogsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [date, setDate] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["logs", page, search, date],
    queryFn: () => api.getLogs({ page, per_page: 25, search, date }),
    refetchInterval: 60_000,
  });

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  return (
    <div className="p-5 lg:p-6 space-y-5">
      <div className="animate-in">
        <h1 className="text-xl font-bold tracking-tight">Kirish / Chiqish Loglari</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Barcha qurilmalardan kelgan ma'lumotlar
        </p>
      </div>

      {/* Filters */}
      <div
        className="bg-white rounded-xl border border-border/40 p-3.5 flex flex-wrap gap-2.5 animate-in"
        style={{ animationDelay: "50ms" }}
      >
        <div className="flex-1 min-w-[180px] flex gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Ism bo'yicha qidirish..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="w-full h-9 pl-8 pr-3 text-sm rounded-lg border border-border/60 bg-muted/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
            />
          </div>
          <button
            onClick={handleSearch}
            className="h-9 px-4 text-xs font-semibold rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
          >
            Qidirish
          </button>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setPage(1);
            }}
            className="h-9 px-3 text-sm rounded-lg border border-border/60 bg-muted/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
          {(search || date) && (
            <button
              onClick={() => {
                setSearch("");
                setSearchInput("");
                setDate("");
                setPage(1);
              }}
              className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div
        className="bg-white rounded-xl border border-border/40 overflow-hidden animate-in"
        style={{ animationDelay: "100ms" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/40">
                <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 w-10">
                  #
                </th>
                <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                  Ism
                </th>
                <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                  Yo'nalish
                </th>
                <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                  Qurilma
                </th>
                <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                  O'xshashlik
                </th>
                <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                  Vaqt
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? [...Array(8)].map((_, i) => (
                    <tr key={i} className="border-b border-border/20">
                      <td colSpan={6} className="px-4 py-3">
                        <div className="h-4 skeleton w-full" />
                      </td>
                    </tr>
                  ))
                : (data?.data ?? []).length === 0
                ? (
                    <tr>
                      <td colSpan={6} className="text-center py-16">
                        <ScrollText className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Ma'lumot topilmadi</p>
                      </td>
                    </tr>
                  )
                : (data?.data ?? []).map((log, i) => (
                    <tr
                      key={log.id}
                      className="border-b border-border/20 hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-4 py-2.5 text-xs text-muted-foreground tabular-nums">
                        {(page - 1) * 25 + i + 1}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          {log.image ? (
                            <img
                              src={log.image}
                              alt=""
                              className="w-7 h-7 rounded-full object-cover border-2 border-white shadow-sm"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center text-[10px] text-muted-foreground font-medium">
                              {(log.name || "?")[0]}
                            </div>
                          )}
                          <span className="text-[13px] font-medium">
                            {log.name || "Noma'lum"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            log.direction === "IN"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-rose-50 text-rose-600"
                          }`}
                        >
                          {log.direction === "IN" ? (
                            <ArrowDownToLine className="w-2.5 h-2.5" />
                          ) : (
                            <ArrowUpFromLine className="w-2.5 h-2.5" />
                          )}
                          {log.direction === "IN" ? "Kirish" : "Chiqish"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground font-mono">
                        {log.face_id}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-14 h-1.5 rounded-full bg-muted/80 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                log.similarity >= 80
                                  ? "bg-emerald-500"
                                  : log.similarity >= 60
                                  ? "bg-amber-500"
                                  : "bg-rose-500"
                              }`}
                              style={{ width: `${log.similarity}%` }}
                            />
                          </div>
                          <span className="text-[11px] text-muted-foreground tabular-nums w-7 text-right">
                            {log.similarity}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground tabular-nums">
                        {log.time
                          ? new Date(log.time).toLocaleString("uz-UZ", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.total_pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border/30">
            <p className="text-[11px] text-muted-foreground">
              Jami <strong>{data.total.toLocaleString()}</strong> yozuv
            </p>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="w-8 h-8 flex items-center justify-center rounded-md border border-border/40 hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-medium px-2 tabular-nums">
                {page} / {data.total_pages}
              </span>
              <button
                disabled={page >= data.total_pages}
                onClick={() => setPage((p) => p + 1)}
                className="w-8 h-8 flex items-center justify-center rounded-md border border-border/40 hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
