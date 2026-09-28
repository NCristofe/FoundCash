import { useCountUp } from '../../hooks/useCountUp';
import { formatValue, type NumberFormat } from '../../utils/format';

interface CountUpProps {
  value: number;
  start: boolean;
  format?: NumberFormat;
  duration?: number;
  className?: string;
}

/**
 * Número com contagem animada. O valor final fica disponível para leitores
 * de tela desde o início; a animação é apenas visual.
 */
export function CountUp({ value, start, format = 'number', duration, className = '' }: CountUpProps) {
  const current = useCountUp(value, start, duration);
  const display = format === 'percent' ? current : Math.round(current);

  return (
    <span className={`tabular ${className}`}>
      <span aria-hidden="true">{formatValue(display, format)}</span>
      <span className="sr-only">{formatValue(value, format)}</span>
    </span>
  );
}
