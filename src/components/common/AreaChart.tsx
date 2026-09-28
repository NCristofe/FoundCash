import { useId, useMemo } from 'react';
import './AreaChart.css';

interface AreaChartProps {
  values: number[];
  labels: string[];
  /** Quando verdadeiro, o gráfico é revelado da esquerda para a direita. */
  drawn: boolean;
  ariaLabel: string;
  /** Altura do viewBox (a largura é fixa em 320) — controla a proporção. */
  height?: number;
}

const WIDTH = 320;
const PADDING = 10;

function buildPaths(values: number[], height: number) {
  const max = Math.max(...values) * 1.08;
  const min = Math.min(...values) * 0.82;
  const range = max - min || 1;
  const step = (WIDTH - PADDING * 2) / Math.max(values.length - 1, 1);

  const points = values.map((value, index) => ({
    x: PADDING + index * step,
    y: height - PADDING - ((value - min) / range) * (height - PADDING * 2),
  }));

  const line = points.reduce((path, point, index) => {
    if (index === 0) return `M${point.x},${point.y}`;
    const previous = points[index - 1];
    const controlX = (previous.x + point.x) / 2;
    return `${path} C${controlX},${previous.y} ${controlX},${point.y} ${point.x},${point.y}`;
  }, '');

  const first = points[0];
  const last = points[points.length - 1];
  const area = `${line} L${last.x},${height} L${first.x},${height} Z`;

  return { line, area, last };
}

export function AreaChart({ values, labels, drawn, ariaLabel, height = 120 }: AreaChartProps) {
  const gradientId = `area-${useId().replace(/:/g, '')}`;
  const { line, area, last } = useMemo(() => buildPaths(values, height), [values, height]);

  return (
    <figure className="area-chart" aria-label={ariaLabel} role="img">
      <div className={`area-chart-plot ${drawn ? 'is-drawn' : ''}`}>
        <svg viewBox={`0 0 ${WIDTH} ${height}`} aria-hidden="true" focusable="false">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22C55E" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#22C55E" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map((ratio) => (
            <line
              key={ratio}
              x1="0"
              x2={WIDTH}
              y1={height * ratio}
              y2={height * ratio}
              className="area-chart-grid"
            />
          ))}
          <path d={area} fill={`url(#${gradientId})`} />
          <path d={line} className="area-chart-line" />
          <circle cx={last.x} cy={last.y} r="7" className="area-chart-halo" />
          <circle cx={last.x} cy={last.y} r="3.5" className="area-chart-dot" />
        </svg>
      </div>
      <div className="area-chart-labels" aria-hidden="true">
        {labels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
    </figure>
  );
}
