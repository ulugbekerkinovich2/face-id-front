import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileSpreadsheet, Loader2, Search, User, X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

const UZ_MONTHS = [
  "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
  "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr",
];

export default function ExportAttendanceDialog({ open, onClose }: Props) {
  const today = new Date();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [selected, setSelected] = useState<{ name: string; full_name: string; role: string } | null>(null);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [workStart, setWorkStart] = useState("09:00");
  const [workEnd, setWorkEnd] = useState("18:00");
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setQuery(""); setDebounced(""); setSelected(null);
      setError(null); setSuccess(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 250);
    return () => clearTimeout(t);
  }, [query]);

  const { data: results, isFetching } = useQuery({
    queryKey: ["export-names", debounced],
    queryFn: () => api.searchExportNames(debounced),
    enabled: open && (debounced.length > 0 || !selected),
    staleTime: 30_000,
  });

  const yearOptions = useMemo(() => {
    const y = today.getFullYear();
    return [y - 2, y - 1, y, y + 1];
  }, [today]);

  const handleDownload = async () => {
    if (!selected) {
      setError("Avval foydalanuvchini tanlang");
      return;
    }
    setDownloading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await api.exportUserMonth(selected.name, year, month, workStart, workEnd);
      setSuccess(`✓ ${res.filename} (${(res.size / 1024).toFixed(1)} KB)`);
    } catch (e: any) {
      setError(e.message || "Eksport xatosi");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && !downloading && onClose()}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-lg max-h-[85vh] p-0 overflow-hidden top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border/40">
          <DialogTitle className="flex items-center gap-2 text-base">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Davomat eksporti — Excel
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Foydalanuvchini va oyni tanlang. Hisobot rahbariyatga taqdim qilishga tayyor formatda yuklanadi.
          </p>
        </DialogHeader>

        <div className="px-5 py-4 space-y-4 overflow-y-auto">
          {/* Name autocomplete */}
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
              Foydalanuvchi
            </label>
            {selected ? (
              <div className="mt-1.5 flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-primary/5 border border-primary/20">
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{selected.full_name}</p>
                  <p className="text-[11px] text-muted-foreground font-mono truncate">
                    {selected.name}{selected.role ? ` · ${selected.role}` : ""}
                  </p>
                </div>
                <button
                  onClick={() => { setSelected(null); setQuery(""); inputRef.current?.focus(); }}
                  className="w-7 h-7 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-colors flex items-center justify-center"
                  title="O'zgartirish"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="relative mt-1.5">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ism, familiya, passport yoki rolni yozing"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                {isFetching && (
                  <Loader2 className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground animate-spin" />
                )}
              </div>
            )}

            {/* Search results */}
            {!selected && (results?.data?.length ?? 0) > 0 && (
              <div className="mt-2 max-h-56 overflow-y-auto rounded-xl border border-border/60 divide-y divide-border/40 custom-scrollbar">
                {results!.data.map((u) => (
                  <button
                    key={u.name}
                    onClick={() => setSelected(u)}
                    className="w-full text-left px-3 py-2 hover:bg-muted/60 transition-colors flex items-center gap-2"
                  >
                    <User className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{u.full_name}</p>
                      <p className="text-[10px] text-muted-foreground font-mono truncate">
                        {u.name}{u.role ? ` · ${u.role}` : ""}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {!selected && debounced && !isFetching && (results?.data?.length ?? 0) === 0 && (
              <p className="mt-2 text-xs text-muted-foreground italic">
                Hech kim topilmadi.
              </p>
            )}
          </div>

          {/* Year + Month */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Yil</label>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="mt-1.5 w-full px-3 py-2 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Oy</label>
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="mt-1.5 w-full px-3 py-2 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {UZ_MONTHS.map((m, i) => (
                  <option key={i} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Work hours */}
          <details className="rounded-xl border border-border/60 bg-muted/20">
            <summary className="px-3 py-2 text-xs font-semibold text-muted-foreground cursor-pointer">
              Ish vaqti chegaralari (kechikishni hisoblash uchun)
            </summary>
            <div className="px-3 pb-3 grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-muted-foreground">Boshlanishi</label>
                <input
                  type="time"
                  value={workStart}
                  onChange={(e) => setWorkStart(e.target.value)}
                  className="mt-1 w-full px-2 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground">Tugashi</label>
                <input
                  type="time"
                  value={workEnd}
                  onChange={(e) => setWorkEnd(e.target.value)}
                  className="mt-1 w-full px-2 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
          </details>

          {/* Status */}
          {error && (
            <div className="px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 text-xs font-medium">
              ⚠ {error}
            </div>
          )}
          {success && (
            <div className="px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
              {success}
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-border/40 bg-muted/20 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            disabled={downloading}
            className="h-9 px-4 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            Yopish
          </button>
          <button
            onClick={handleDownload}
            disabled={!selected || downloading}
            className="h-9 px-4 rounded-xl text-sm font-semibold bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            {downloading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Yuklanmoqda...
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Yuklab olish
              </>
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
