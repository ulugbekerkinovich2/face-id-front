import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, InsideEntry } from "@/lib/api";
import { Users, X, Eye, User, Loader2, Clock } from "lucide-react";
import { useState } from "react";
import AttendanceSheet from "@/components/AttendanceSheet";
import { useNewIds } from "@/hooks/useNewIds";
import { useLiveStream } from "@/hooks/useLiveStream";
import { useFlipChildren } from "@/hooks/useFlipChildren";

function timeAgo(iso: string) {
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 60) return `${sec}s oldin`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} daq oldin`;
  const h = Math.floor(min / 60);
  return `${h} soat ${min % 60} daq oldin`;
}

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0] ?? "").join("").toUpperCase();
}

export default function InsidePage() {
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const { data, isLoading, dataUpdatedAt } = useQuery({
    queryKey: ["inside"],
    queryFn: api.getInsideNow,
    // Polling kamaytirilgan — WS orqali real-time keladi
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  // Yangi log kelganda Inside ro'yxatini yangilash — IN bo'lsa qo'shamiz, OUT bo'lsa olib tashlaymiz
  useLiveStream<{ id: number; name: string; direction: "IN" | "OUT" | "UNKNOWN" }>(
    ["logs"],
    () => {
      // Inside count IN/OUT ga bog'liq — query'ni invalidate qilamiz
      queryClient.invalidateQueries({ queryKey: ["inside"] });
    },
  );

  const count = data?.count ?? 0;
  const list: InsideEntry[] = data?.data ?? [];
  const newIds = useNewIds(list, (e: any) => e.id || `${e.name}-${e.last_seen}`, 3000);
  const gridRef = useFlipChildren<HTMLDivElement>([list]);

  return (
    <div className="p-5 lg:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3 animate-in">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
            </span>
            Hozir ichkarida
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Binoga kirgan va hali chiqmagan shaxslar
          </p>
        </div>
        <div className="flex items-center gap-3">
          {dataUpdatedAt && (
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(dataUpdatedAt).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          )}
          {/* Big counter */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-2 flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600" />
            <span className="text-2xl font-extrabold text-emerald-700 tabular-nums">{count}</span>
            <span className="text-xs text-emerald-600 font-medium">kishi</span>
          </div>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
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
      ) : list.length === 0 ? (
        <div className="text-center py-24 animate-in">
          <div className="w-20 h-20 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-4">
            <Users className="w-9 h-9 text-muted-foreground/20" />
          </div>
          <p className="text-base font-semibold text-muted-foreground/60">Hozir hech kim ichkarida emas</p>
          <p className="text-sm text-muted-foreground/40 mt-1">Yangilanish har 60 soniyada</p>
        </div>
      ) : (
        <div ref={gridRef} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
          {list.map((person, i) => {
            const personId = (person as any).id || `${person.name}-${(person as any).last_seen}`;
            const isNew = newIds.has(personId);
            return (
            <div
              key={person.name}
              className={`bg-white rounded-xl border border-emerald-100 ring-1 ring-emerald-100 overflow-hidden group hover:shadow-lg hover:shadow-emerald-500/10 transition-all ${
                isNew ? "flash-new" : "animate-in"
              }`}
              style={isNew ? undefined : { animationDelay: `${i * 25}ms` }}
            >
              {/* Image */}
              <div className="aspect-[3/4] bg-gradient-to-br from-emerald-50 to-teal-50 relative">
                {person.image ? (
                  <>
                    <img src={person.image} alt="" loading="lazy" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2.5">
                      <button
                        onClick={() => setLightbox(person.image!)}
                        className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors"
                      >
                        <Eye className="w-3 h-3" />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-white/80 flex items-center justify-center text-emerald-600 font-bold text-lg shadow-sm">
                      {person.full_name || person.name ? initials(person.full_name || person.name) : <User className="w-6 h-6" />}
                    </div>
                  </div>
                )}

                {/* Online dot */}
                <div className="absolute top-2 right-2 flex items-center gap-1 bg-emerald-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                  Ichkarida
                </div>
              </div>

              {/* Info */}
              <div className="p-2.5 space-y-0.5">
                <button
                  onClick={() => setSelectedName(person.name)}
                  className="text-[12px] font-semibold text-foreground leading-tight truncate w-full text-left hover:text-emerald-600 transition-colors"
                >
                  {person.full_name || person.name}
                </button>
                {person.full_name && (
                  <p className="text-[10px] text-muted-foreground font-mono truncate">{person.name}</p>
                )}
                <p className="text-[11px] text-emerald-600 font-medium tabular-nums flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  {timeAgo(person.entry_time)}
                </p>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {/* Loader overlay while refetching */}
      {!isLoading && (
        <div className="fixed bottom-6 right-6 pointer-events-none">
          <Loader2 className="w-4 h-4 text-muted-foreground/20 animate-spin" />
        </div>
      )}

      <AttendanceSheet name={selectedName} open={!!selectedName} onClose={() => setSelectedName(null)} />

      {lightbox && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="" className="max-w-full max-h-[85vh] rounded-xl shadow-2xl animate-in" />
          <button onClick={() => setLightbox(null)} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
