import { useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

/**
 * Anima um número até `target` quando `start` for verdadeiro.
 * Quando o alvo muda depois, anima a partir do valor atual (não volta a zero).
 */
export function useCountUp(target: number, start: boolean, duration = 1200): number {
  const reducedMotion = usePrefersReducedMotion();
  const [value, setValue] = useState(0);
  const currentRef = useRef(0);

  useEffect(() => {
    if (!start) return;

    if (reducedMotion) {
      currentRef.current = target;
      setValue(target);
      return;
    }

    let frame = 0;
    const from = currentRef.current;
    const startedAt = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = from + (target - from) * eased;
      currentRef.current = next;
      setValue(next);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, start, duration, reducedMotion]);

  return value;
}
