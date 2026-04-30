import { useEffect } from "react";
import { X, Download } from "lucide-react";

interface Props {
  src: string | null;
  onClose: () => void;
  caption?: string;
}

/** Modal lightbox — har qaerda rasmga bosilganda chaqiriladi. */
export function ImageLightbox({ src, onClose, caption }: Props) {
  useEffect(() => {
    if (!src) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [src, onClose]);

  if (!src) return null;
  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur flex items-center justify-center text-white transition-colors"
        title="Yopish (Esc)"
      >
        <X className="w-5 h-5" />
      </button>
      <a
        href={src} target="_blank" rel="noreferrer"
        download
        onClick={(e) => e.stopPropagation()}
        className="absolute top-4 right-16 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur flex items-center justify-center text-white transition-colors"
        title="Yuklab olish"
      >
        <Download className="w-5 h-5" />
      </a>
      <img
        src={src}
        alt=""
        onClick={(e) => e.stopPropagation()}
        className="max-w-[92vw] max-h-[88vh] object-contain rounded-2xl shadow-2xl ring-2 ring-white/20"
        style={{ animation: "flashDrop 0.5s cubic-bezier(0.34,1.56,0.64,1) both" }}
      />
      {caption && (
        <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/90 text-sm bg-black/40 backdrop-blur px-4 py-2 rounded-full">
          {caption}
        </p>
      )}
    </div>
  );
}
