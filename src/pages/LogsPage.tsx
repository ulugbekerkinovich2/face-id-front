import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Search, ChevronLeft, ChevronRight, ArrowDownToLine,
  ArrowUpFromLine, Calendar, ScrollText, X, Eye, ShieldBan,
  Loader2, User, Clock, Briefcase,
} from "lucide-react";
import AttendanceSheet from "@/components/AttendanceSheet";

const DOOR_LABEL: Record<number, string> = {
  2489019: "1-eshik", 2489007: "2-eshik", 2489005: "3-eshik",
  2488986: "4-eshik", 2489002: "5-eshik", 2489012: "6-eshik",
  2488993: "7-eshik", 2488999: "8-eshik",
};

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0] ?? "").join("").toUpperCase();
}

function similarityColor(s: number) {
  if (s >= 85) return "bg-emerald-500";
  if (s >= 70) return "bg-amber-400";
  return "bg-rose-500";
}

export default function LogsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [date, setDate] = useState("");
  const [direction, setDirection] = useState("");
  const [role, setRole] = useState("");
  const [timeFrom, setTimeFrom] = useState("");
  const [timeTo, setTimeTo] = useState("");
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState<string | null>(null);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["logs", page, search, date, direction, role, timeFrom, timeTo],
    queryFn: () => api.getLogs({ page, per_page: 24, search, date, direction, role, time_from: timeFrom, time_to: timeTo }),
    staleTime: 15_000,
    placeholderData: (prev: any) => prev,
  });

  const { data: rolesData } = useQuery({
    queryKey: ["roles"],
    queryFn: api.getRoles,
    staleTime: 3_600_000,
  });

  const handleSearch = () => { setSearch(searchInput); setPage(1); };
  const hasFilter = !!(search || date || direction || role || timeFrom || timeTo);
  const clearAll = () => {
    setSearch(""); setSearchInput(""); setDate(""); setDirection("");
    setRole(""); setTimeFrom(""); setTimeTo(""); setPage(1);
  };

  return (
    <div className="p-5 lg:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3 animate-in">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-primary" />
            Kirish / Chiqish Loglar
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Yuz aniqlash orqali qayd etilgan yozuvlar
            {data && <span className="ml-2 font-medium text-foreground">({data.total.toLocaleString()} ta)</span>}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="flex gap-2 flex-1 min-w-[180px] max-w-xs">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Ism bo'yicha..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="w-full h-9 pl-9 pr-3 text-sm rounded-lg border border-border/60 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          <button onClick={handleSearch} className="h-9 px-3 text-xs font-semibold rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors">
            Qidirish
          </button>
        </div>

        {/* Direction */}
        <div className="flex items-center rounded-lg border border-border/60 bg-background overflow-hidden h-9">
          {(["", "IN", "OUT"] as const).map((d) => (
            <button
              key={d}
              onClick={() => { setDirection(d); setPage(1); }}
              className={`h-full px-3 text-xs font-medium transition-colors ${
                direction === d ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {d === "" ? "Barchasi" : d === "IN" ? "↓ Kirish" : "↑ Chiqish"}
            </button>
          ))}
        </div>

        {/* Date */}
        <div className="flex items-center gap-1.5 h-9 px-2.5 rounded-lg border border-border/60 bg-background">
          <Calendar className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          <input
            type="date"
            value={date}
            onChange={(e) => { setDate(e.target.value); setPage(1); }}
            className="h-full text-sm bg-transparent focus:outline-none text-foreground"
          />
        </div>

        {/* Time range */}
        <div className="flex items-center gap-1.5 h-9 px-2.5 rounded-lg border border-border/60 bg-background">
          <Clock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          <input
            type="time"
            value={timeFrom}
            onChange={(e) => { setTimeFrom(e.target.value); setPage(1); }}
            className="h-full text-sm bg-transparent focus:outline-none w-[76px] text-foreground"
            title="Boshlanish vaqti"
          />
          <span className="text-muted-foreground text-xs">—</span>
          <input
            type="time"
            value={timeTo}
            onChange={(e) => { setTimeTo(e.target.value); setPage(1); }}
            className="h-full text-sm bg-transparent focus:outline-none w-[76px] text-foreground"
            title="Tugash vaqti"
          />
        </div>

        {/* Role filter */}
        <div className="flex items-center gap-1.5 h-9 px-2.5 rounded-lg border border-border/60 bg-background">
          <Briefcase className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          <select
            value={role}
            onChange={(e) => { setRole(e.target.value); setPage(1); }}
            className="h-full text-sm bg-transparent focus:outline-none text-foreground pr-1 max-w-[140px]"
          >
            <option value="">Barcha lavozim</option>
            {(rolesData?.roles ?? []).map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        {hasFilter && (
          <button onClick={clearAll} className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-muted border border-border/40 text-muted-foreground hover:text-foreground transition-colors" title="Filtrlarni tozalash">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
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
          <div className="text-center py-20 animate-in">
            <ScrollText className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Ma'lumot topilmadi</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-3">
            {(data?.data ?? []).map((log, i) => (
              <div
                key={log.id}
                className={`animate-in bg-white rounded-xl border overflow-hidden group hover:shadow-md transition-all ${
                  log.is_blocked ? "border-rose-200 ring-1 ring-rose-200" : "border-border/40"
                }`}
                style={{ animationDelay: `${i * 20}ms` }}
              >
                {/* Image */}
                <div className="aspect-[3/4] bg-muted/30 relative">
                  {log.image ? (
                    <>
                      <img
                        src={log.image} alt="" loading="lazy"
                        className="w-full h-full object-cover"
                      />
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2.5">
                        <button
                          onClick={() => setLightbox(log.image)}
                          className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-12 h-12 rounded-full bg-white/70 flex items-center justify-center text-slate-500 font-bold text-sm">
                          {log.name ? initials(log.name) : <User className="w-5 h-5" />}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Direction badge */}
                  <div className={`absolute top-2 left-2 flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                    log.direction === "IN" ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                  }`}>
                    {log.direction === "IN"
                      ? <ArrowDownToLine className="w-2.5 h-2.5" />
                      : <ArrowUpFromLine className="w-2.5 h-2.5" />}
                    {log.direction === "IN" ? "Kirish" : "Chiqish"}
                  </div>

                  {/* Similarity badge */}
                  {log.similarity != null && (
                    <div className={`absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white ${similarityColor(log.similarity)}`}>
                      {log.similarity}%
                    </div>
                  )}

                  {/* Blocked badge */}
                  {log.is_blocked && (
                    <div className="absolute bottom-2 right-2 flex items-center gap-0.5 bg-rose-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                      <ShieldBan className="w-2.5 h-2.5" />
                      BLOK
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-2.5 space-y-1">
                  <button
                    onClick={() => setSelectedName(log.name)}
                    className="text-[12px] font-semibold text-foreground leading-tight truncate w-full text-left hover:text-primary transition-colors"
                  >
                    {log.name || "Noma'lum"}
                  </button>

                  {/* Time */}
                  <p className="text-[11px] text-muted-foreground tabular-nums">
                    {log.time ? new Date(log.time).toLocaleString("uz-UZ", {
                      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                    }) : "—"}
                  </p>

                  {/* Similarity bar */}
                  {log.similarity != null && (
                    <div className="flex items-center gap-1.5">
                      <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${similarityColor(log.similarity)}`}
                          style={{ width: `${log.similarity}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <p className="text-[10px] text-muted-foreground/60">
                    {DOOR_LABEL[log.face_id] ?? `Qurilma ${log.face_id}`}
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
            Sahifa <strong>{page}</strong> / {data.total_pages} &middot; Jami <strong>{data.total.toLocaleString()}</strong>
          </p>
          <div className="flex items-center gap-1">
            <button disabled={page <= 1} onClick={() => setPage(1)}
              className="w-8 h-8 flex items-center justify-center rounded-md border border-border/40 hover:bg-muted disabled:opacity-20 transition-colors text-xs font-bold">
              1
            </button>
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
              className="w-8 h-8 flex items-center justify-center rounded-md border border-border/40 hover:bg-muted disabled:opacity-20 transition-colors">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-semibold px-3 tabular-nums bg-primary/5 rounded-md py-1.5">{page}</span>
            <button disabled={page >= data.total_pages} onClick={() => setPage((p) => p + 1)}
              className="w-8 h-8 flex items-center justify-center rounded-md border border-border/40 hover:bg-muted disabled:opacity-20 transition-colors">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button disabled={page >= data.total_pages} onClick={() => setPage(data.total_pages)}
              className="w-8 h-8 flex items-center justify-center rounded-md border border-border/40 hover:bg-muted disabled:opacity-20 transition-colors text-xs font-bold">
              {data.total_pages}
            </button>
          </div>
        </div>
      )}

      {/* Attendance sheet */}
      <AttendanceSheet
        name={selectedName}
        open={!!selectedName}
        onClose={() => setSelectedName(null)}
      />

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
