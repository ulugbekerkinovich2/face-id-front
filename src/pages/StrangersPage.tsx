import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  Ghost, Trash2, Calendar, ChevronLeft, ChevronRight,
  ArrowDownToLine, ArrowUpFromLine, X, Eye, Loader2,
} from "lucide-react";

export default function StrangersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [date, setDate] = useState("");
  const [lightbox, setLightbox] = useState<string | null>(null);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["strangers", page, date],
    queryFn: () => api.getStrangers({ page, per_page: 24, date }),
    placeholderData: (prev: any) => prev,
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteStranger,
    onSuccess: () => { toast.success("O'chirildi"); queryClient.invalidateQueries({ queryKey: ["strangers"] }); },
  });

  return (
    <div className="p-5 lg:p-6 space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3 animate-in">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Notanish yuzlar</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Tizimda ro'yxatdan o'tmagan shaxslar</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
          <input type="date" value={date} onChange={(e) => { setDate(e.target.value); setPage(1); }}
            className="h-9 px-3 text-sm rounded-lg border border-border/60 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
          {date && <button onClick={() => { setDate(""); setPage(1); }} className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-muted"><X className="w-3.5 h-3.5" /></button>}
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
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => <div key={i} className="aspect-square skeleton rounded-xl" />)}
        </div>
      ) : (data?.data ?? []).length === 0 ? (
        <div className="text-center py-16 animate-in">
          <Ghost className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Notanish yuzlar topilmadi</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
          {(data?.data ?? []).map((s, i) => (
            <div key={s.id} className="animate-in bg-white rounded-xl border border-border/40 overflow-hidden group hover:shadow-md transition-all"
              style={{ animationDelay: `${i * 30}ms` }}>
              {/* Image */}
              <div className="aspect-square bg-muted/30 relative">
                {s.image ? (
                  <img src={s.image} alt="" className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Ghost className="w-8 h-8 text-muted-foreground/20" />
                  </div>
                )}
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-2.5">
                  {s.image && (
                    <button onClick={() => setLightbox(s.image)}
                      className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors">
                      <Eye className="w-3 h-3" />
                    </button>
                  )}
                  <button onClick={() => deleteMutation.mutate(s.id)}
                    className="w-7 h-7 rounded-full bg-rose-500/90 text-white flex items-center justify-center hover:bg-rose-500 transition-colors">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

                {/* Direction badge */}
                <div className={`absolute top-2 left-2 flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                  s.direction === "IN" ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                }`}>
                  {s.direction === "IN" ? <ArrowDownToLine className="w-2.5 h-2.5" /> : <ArrowUpFromLine className="w-2.5 h-2.5" />}
                  {s.direction}
                </div>
              </div>

              {/* Info */}
              <div className="p-2.5">
                <p className="text-[11px] text-muted-foreground tabular-nums">
                  {s.time ? new Date(s.time).toLocaleString("uz-UZ", {
                    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                  }) : "—"}
                </p>
                <p className="text-[10px] text-muted-foreground/60 font-mono mt-0.5">
                  Qurilma: {s.device_id}
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
          <p className="text-[11px] text-muted-foreground">Jami <strong>{data.total}</strong></p>
          <div className="flex items-center gap-1">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="w-8 h-8 flex items-center justify-center rounded-md border border-border/40 hover:bg-muted disabled:opacity-30 transition-colors"><ChevronLeft className="w-3.5 h-3.5" /></button>
            <span className="text-xs font-medium px-2 tabular-nums">{page} / {data.total_pages}</span>
            <button disabled={page >= data.total_pages} onClick={() => setPage(p => p + 1)} className="w-8 h-8 flex items-center justify-center rounded-md border border-border/40 hover:bg-muted disabled:opacity-30 transition-colors"><ChevronRight className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      )}

      {/* Lightbox */}
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
