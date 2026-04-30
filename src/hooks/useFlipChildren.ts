import { useEffect, useRef } from "react";

/**
 * FLIP animation hook (First-Last-Invert-Play). Container DOM elementga
 * `ref` biriktiring va `key` bilan farqlanadigan `deps`ni bering. Render
 * paytida child element'lar pozitsiyasi o'zgargan bo'lsa, ularni eski
 * joydan yangi joyga **mayin** sirpantiradi (transform animatsiya).
 *
 * Yangi qo'shilgan element'lar (oldingi pozitsiyasi yo'q) — animatsiyaga
 * tushmaydi, ulardagi `flash-new` kabi enter animation'larini buzmaydi.
 *
 * @example
 *   const ref = useFlipChildren<HTMLDivElement>([data?.data]);
 *   <div ref={ref}>
 *     {items.map(it => <Card key={it.id} ... />)}
 *   </div>
 */
export function useFlipChildren<T extends HTMLElement = HTMLElement>(deps: unknown[]) {
  const ref = useRef<T | null>(null);
  const positionsRef = useRef<Map<Element, DOMRect>>(new Map());

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const prevPositions = positionsRef.current;
    const currentChildren = Array.from(container.children) as HTMLElement[];

    // Eski element'larning yangi pozitsiyasi
    currentChildren.forEach((el) => {
      const prevRect = prevPositions.get(el);
      if (!prevRect) return;  // yangi element — animatsiyaga tushmaydi

      const newRect = el.getBoundingClientRect();
      const dx = prevRect.left - newRect.left;
      const dy = prevRect.top - newRect.top;

      if (dx === 0 && dy === 0) return;

      // Invert: eski joyga qaytaramiz
      el.style.transition = "none";
      el.style.transform = `translate(${dx}px, ${dy}px)`;

      // Play: keyingi frame'da yangi joyga sirpantiramiz
      requestAnimationFrame(() => {
        el.style.transition = "transform 480ms cubic-bezier(0.34, 1.56, 0.64, 1)";
        el.style.transform = "";
      });

      // Animatsiya tugagach style'ni tozalash
      const cleanup = () => {
        el.style.transition = "";
        el.style.transform = "";
        el.removeEventListener("transitionend", cleanup);
      };
      el.addEventListener("transitionend", cleanup);
    });

    // Yangi pozitsiyalarni saqlab qo'yamiz (keyingi render uchun)
    const newPositions = new Map<Element, DOMRect>();
    currentChildren.forEach((el) => {
      newPositions.set(el, el.getBoundingClientRect());
    });
    positionsRef.current = newPositions;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return ref;
}
