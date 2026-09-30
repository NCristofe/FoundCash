import { useId } from 'react';
import { stages } from '../../config/niche';
import type { Analysis } from '../radar';

/** Prioridade 0–100 desenhada como intensidade de sinal. */
export function SignalMeter({ score, showValue = true }: { score: number; showValue?: boolean }) {
  const filled = Math.max(1, Math.ceil(score / 20));
  const level = score >= 70 ? 'high' : score >= 40 ? 'mid' : 'low';
  return (
    <span className={`signal signal--${level}`} role="img" aria-label={`Prioridade ${score} de 100`}>
      <span className="signal-bars" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((bar) => (
          <i key={bar} className={bar <= filled ? 'is-on' : ''} />
        ))}
      </span>
      {showValue && (
        <span className="signal-value" aria-hidden="true">
          {score}
        </span>
      )}
    </span>
  );
}

const CENTER = 100;
const INNER = 16;
const OUTER = 84;
/** Dias sem contato que levam o ponto até a borda. */
const MAX_DAYS = 30;

function hash(text: string): number {
  let value = 0;
  for (let index = 0; index < text.length; index += 1) value = (value * 31 + text.charCodeAt(index)) >>> 0;
  return value;
}

function polar(angleDeg: number, radius: number) {
  const angle = ((angleDeg - 90) * Math.PI) / 180;
  return { x: CENTER + radius * Math.cos(angle), y: CENTER + radius * Math.sin(angle) };
}

/**
 * Cada ponto é uma oportunidade aberta real: o setor é a etapa, a distância do
 * centro é o tempo sem contato e o tamanho é o valor.
 */
export function RadarScope({ analyses }: { analyses: Analysis[] }) {
  const gradientId = `sweep-${useId().replace(/:/g, '')}`;
  const sector = 360 / stages.length;
  const maxValue = Math.max(1, ...analyses.map((item) => item.opportunity.value));
  const riskCount = analyses.filter((item) => item.atRisk).length;

  return (
    <svg
      className="radar-scope"
      viewBox="-12 -12 224 224"
      role="img"
      aria-label={`Radar: ${analyses.length} oportunidades abertas, ${riskCount} com sinais de abandono. Quanto mais longe do centro, mais tempo sem contato.`}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="var(--green)" stopOpacity="0" />
          <stop offset="1" stopColor="var(--green)" stopOpacity="0.28" />
        </linearGradient>
      </defs>

      {[INNER + (OUTER - INNER) * (3 / MAX_DAYS), INNER + (OUTER - INNER) * (10 / MAX_DAYS), OUTER].map((radius) => (
        <circle key={radius} className="radar-ring" cx={CENTER} cy={CENTER} r={radius} />
      ))}
      {stages.map((stage, index) => {
        const edge = polar(index * sector, OUTER);
        const label = polar((index + 0.5) * sector, OUTER + 11);
        return (
          <g key={stage.id}>
            <line className="radar-spoke" x1={CENTER} y1={CENTER} x2={edge.x} y2={edge.y} />
            <text className="radar-label" x={label.x} y={label.y} textAnchor="middle" dominantBaseline="middle">
              {stage.short}
            </text>
          </g>
        );
      })}
      <text className="radar-ring-label" x={CENTER + 3} y={CENTER - (INNER + (OUTER - INNER) * 0.1) - 2}>
        3d
      </text>
      <text className="radar-ring-label" x={CENTER + 3} y={CENTER - (INNER + (OUTER - INNER) * (10 / MAX_DAYS)) - 2}>
        10d
      </text>
      <text className="radar-ring-label" x={CENTER + 3} y={CENTER - OUTER - 2}>
        30d+
      </text>

      <g className="radar-sweep">
        <path d={`M${CENTER} ${CENTER} L${CENTER} ${CENTER - OUTER} A${OUTER} ${OUTER} 0 0 1 ${polar(50, OUTER).x} ${polar(50, OUTER).y} Z`} fill={`url(#${gradientId})`} />
        <line className="radar-sweep-edge" x1={CENTER} y1={CENTER} x2={polar(50, OUTER).x} y2={polar(50, OUTER).y} />
      </g>

      {analyses.map((item) => {
        const index = stages.findIndex((stage) => stage.id === item.opportunity.stage);
        const jitter = ((hash(item.opportunity.id) % 1000) / 1000 - 0.5) * 0.7;
        const distance = INNER + (Math.min(item.daysSinceTouch, MAX_DAYS) / MAX_DAYS) * (OUTER - INNER);
        const point = polar((index + 0.5 + jitter) * sector, distance);
        const size = 2.4 + 4.2 * Math.sqrt(item.opportunity.value / maxValue);
        const hot = item.signals.some((signal) => signal.kind === 'responded' || signal.kind === 'viewed');
        const tone = item.atRisk ? 'risk' : hot ? 'hot' : 'ok';
        return (
          <g key={item.opportunity.id} className={`radar-blip radar-blip--${tone}`}>
            {tone !== 'ok' && <circle className="radar-blip-pulse" cx={point.x} cy={point.y} r={size} />}
            <circle cx={point.x} cy={point.y} r={size} />
          </g>
        );
      })}

      <circle className="radar-core" cx={CENTER} cy={CENTER} r="3" />
    </svg>
  );
}

export function RadarLoader({ label }: { label: string }) {
  return (
    <div className="radar-loader" role="status">
      <span className="radar-loader-scope" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
