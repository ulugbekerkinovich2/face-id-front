import { useState, useEffect, useRef } from "react";

export function useAnimatedNumber(target: number, duration = 800) {
  const [value, setValue] = useState(0);
  const prev = useRef(0);

  useEffect(() => {
    const start = prev.current;
    const diff = target - start;
    if (diff === 0) return;

    const startTime = performance.now();

    function step(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      const current = Math.round(start + diff * eased);
      setValue(current);

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        prev.current = target;
      }
    }

    requestAnimationFrame(step);
  }, [target, duration]);

  return value;
}
