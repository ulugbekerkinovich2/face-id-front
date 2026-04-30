import { useEffect, useRef, useState } from "react";

/**
 * Ro'yxat keladigan yangi (oldingi render'da bo'lmagan) elementlarning
 * id'lari to'plamini qaytaradi. Birinchi render'da hech narsa "yangi" emas
 * (eski yozuvlar foydalanuvchini ko'r qilib yubormasin).
 *
 * Yangi id'lar `clearAfterMs` (default 3000) keyin to'plamdan chiqariladi —
 * shu vaqt davomida ular `.flash-new` CSS animatsiyasini qo'llashi mumkin.
 *
 * @example
 *   const newIds = useNewIds(logs, l => l.id);
 *   <div className={newIds.has(log.id) ? "flash-new" : ""}>...</div>
 */
export function useNewIds<T>(
  items: T[] | undefined,
  getId: (item: T) => string | number,
  clearAfterMs = 3000,
): Set<string | number> {
  const seenRef = useRef<Set<string | number> | null>(null);
  const [newIds, setNewIds] = useState<Set<string | number>>(new Set());

  useEffect(() => {
    if (!items) return;
    const currentIds = items.map(getId);

    // Birinchi marta — barchasini "ko'rilgan" deb belgilaymiz, hech narsa yangi emas
    if (seenRef.current === null) {
      seenRef.current = new Set(currentIds);
      return;
    }

    const seen = seenRef.current;
    const fresh: (string | number)[] = [];
    for (const id of currentIds) {
      if (!seen.has(id)) fresh.push(id);
    }

    if (fresh.length === 0) return;

    // Yangilarni ko'rilgan ro'yxatga qo'shamiz va flash-set'ga ulaymiz
    fresh.forEach((id) => seen.add(id));
    setNewIds((prev) => {
      const next = new Set(prev);
      fresh.forEach((id) => next.add(id));
      return next;
    });

    // Animatsiya tugagandan keyin set'dan chiqaramiz — qayta render trigger qilmaslik uchun
    const tid = setTimeout(() => {
      setNewIds((prev) => {
        const next = new Set(prev);
        fresh.forEach((id) => next.delete(id));
        return next;
      });
    }, clearAfterMs);

    return () => clearTimeout(tid);
  }, [items, getId, clearAfterMs]);

  return newIds;
}
