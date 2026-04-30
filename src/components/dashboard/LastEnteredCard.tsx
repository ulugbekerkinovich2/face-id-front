import { ArrowDownToLine, User } from "lucide-react";

interface Props {
  data: { name: string; time: string; image: string; face_id: number } | null;
}

const DOOR_LABEL: Record<number, string> = {
  2489019: "1-eshik", 2489007: "2-eshik", 2489005: "3-eshik",
  2488986: "4-eshik", 2489002: "5-eshik", 2489012: "6-eshik",
  2488993: "7-eshik", 2488999: "8-eshik",
};

function initials(s: string) {
  return s.split(" ").slice(0, 2).map(w => w[0] ?? "").join("").toUpperCase();
}

export function LastEnteredCard({ data }: Props) {
  if (!data) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <p className="text-sm text-muted-foreground">Bugun hech kim kirmagan</p>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-4 animate-in">
      <div className="relative flex-shrink-0">
        {data.image ? (
          <img
            src={data.image}
            alt=""
            className="w-20 h-20 rounded-2xl object-cover shadow-lg ring-4 ring-emerald-100"
          />
        ) : (
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
            {data.name ? initials(data.name) : <User className="w-8 h-8" />}
          </div>
        )}
        <span className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center ring-4 ring-white shadow">
          <ArrowDownToLine className="w-3.5 h-3.5" />
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">Oxirgi kirgan</p>
        <p className="text-[15px] font-extrabold truncate mt-0.5">{data.name || "Noma'lum"}</p>
        <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
          <span className="font-bold text-foreground tabular-nums">{data.time}</span>
          <span className="opacity-50">•</span>
          <span>{DOOR_LABEL[data.face_id] ?? `Qurilma ${data.face_id}`}</span>
        </div>
      </div>
    </div>
  );
}
