import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  CreditCard, Search, Calendar, ChevronLeft, ChevronRight,
  ArrowDownToLine, ArrowUpFromLine, X, Eye, User, Loader2,
} from "lucide-react";

const DOOR_LABEL: Record<number, string> = {
  2489019: "1-eshik",
  2489007: "2-eshik",
  2489005: "3-eshik",
  2488986: "4-eshik",
  2489002: "5-eshik",
  2489012: "6-eshik",
  2488993: "7-eshik",
  2488999: "8-eshik",
};

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
}

export default function CardLogsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [date, setDate] = useState("");
  const [direction, setDirection] = useState("");
  const [lightbox, setLightbox] = useState<string | null>(null);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["card-logs", page, search, date, direction],
    queryFn: () => api.getCardLogs({ page, per_page: 24, search, date, direction }),
    placeholderData: (prev: any) => prev,
  });

  function reset() {
    setPage(1);
  }

  return (
    <div className="p-5 lg:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3 animate-in">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            ID Karta Loglar
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            ID karta orqali kirish/chiqish yozuvlari
            {data && <span className="ml-2 font-medium text-foreground">({data.total} ta)</span>}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Passport yoki ID..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); reset(); }}
            className="h-9 w-full pl-9 pr-3 text-sm rounded-lg border border-border/60 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
          {search && (
            <button onClick={() => { setSearch(""); reset(); }} className="absolute right-2 top-1/2 -translate-y-1/2">
              <X className="w-3 h-3 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Direction toggle */}
        <div className="flex items-center rounded-lg border border-border/60 bg-white overflow-hidden h-9">
          {(["", "IN", "OUT"] as const).map((d) => (
            <button
              key={d}
              onClick={() => { setDirection(d); reset(); }}
              className={`h-full px-3 text-xs font-medium transition-colors ${
                direction === d ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {d === "" ? "Barchasi" : d === "IN" ? "↓ Kirish" : "↑ Chiqish"}
            </button>
          ))}
        </div>

        {/* Date */}
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="date"
            value={date}
            onChange={(e) => { setDate(e.target.value); reset(); }}
            className="h-9 px-3 text-sm rounded-lg border border-border/60 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
          {date && (
            <button onClick={() => { setDate(""); reset(); }} className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-muted">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="relative">
        {isFetching && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <div className="flex items-center gap-2 bg-white shadow border border-border/30 rounded-lg px-3 py-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
              <span className="text-[11px] text-muted-foreground font-medium">Yuklanmoqda...</span>
            </div>
          </div>
        )}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-3">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="rounded-xl bg-muted/40 overflow-hidden animate-pulse">
              <div className="aspect-[3/4] bg-muted/60" />
              <div className="p-2.5 space-y-1.5">
                <div className="h-3 bg-muted/60 rounded w-3/4" />
                <div className="h-2.5 bg-muted/40 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : (data?.data ?? []).length === 0 ? (
        <div className="text-center py-16 animate-in">
          <CreditCard className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">ID karta loglari topilmadi</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-3">
          {(data?.data ?? []).map((entry, i) => (
            <div
              key={entry.id}
              className="animate-in bg-white rounded-xl border border-border/40 overflow-hidden group hover:shadow-md transition-all"
              style={{ animationDelay: `${i * 20}ms` }}
            >
              {/* Image */}
              <div className="aspect-[3/4] bg-muted/30 relative">
                {entry.image ? (
                  <img src={entry.image} alt="" className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-12 h-12 rounded-full bg-white/70 flex items-center justify-center text-slate-500 font-bold text-sm">
                        {entry.full_name ? initials(entry.full_name) : <User className="w-5 h-5" />}
                      </div>
                    </div>
                  </div>
                )}

                {/* Hover overlay */}
                {entry.image && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2.5">
                    <button
                      onClick={() => setLightbox(entry.image)}
                      className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors"
                    >
                      <Eye className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {/* Direction badge */}
                <div className={`absolute top-2 left-2 flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                  entry.direction === "IN" ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                }`}>
                  {entry.direction === "IN"
                    ? <ArrowDownToLine className="w-2.5 h-2.5" />
                    : <ArrowUpFromLine className="w-2.5 h-2.5" />}
                  {entry.direction}
                </div>
              </div>

              {/* Info */}
              <div className="p-2.5 space-y-0.5">
                <p className="text-[12px] font-semibold text-foreground leading-tight truncate">
                  {entry.full_name || entry.name}
                </p>
                {entry.full_name && (
                  <p className="text-[10px] text-muted-foreground font-mono truncate">{entry.name}</p>
                )}
                <p className="text-[11px] text-muted-foreground tabular-nums">
                  {entry.time ? new Date(entry.time).toLocaleString("uz-UZ", {
                    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                  }) : "—"}
                </p>
                <p className="text-[10px] text-muted-foreground/60">
                  {DOOR_LABEL[entry.face_id] ?? `Qurilma ${entry.face_id}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>

      {/* Pagination */}
      {data && data.total_pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-muted-foreground">
            Jami <strong>{data.total}</strong> ta yozuv
          </p>
          <div className="flex items-center gap-1">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="w-8 h-8 flex items-center justify-center rounded-md border border-border/40 hover:bg-muted disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-medium px-2 tabular-nums">{page} / {data.total_pages}</span>
            <button
              disabled={page >= data.total_pages}
              onClick={() => setPage((p) => p + 1)}
              className="w-8 h-8 flex items-center justify-center rounded-md border border-border/40 hover:bg-muted disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <img src={lightbox} alt="" className="max-w-full max-h-[85vh] rounded-xl shadow-2xl animate-in" />
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
