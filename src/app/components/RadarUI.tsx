import { useId, type CSSProperties } from 'react';

/** Prioridade 0–100 como anel. Coral a partir de 70 (agir primeiro). */
export function ScoreRing({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' }) {
  const radius = 21;
  const length = 2 * Math.PI * radius;
  return (
    <span className={`score-ring score-ring--${size}`} role="img" aria-label={`Prioridade ${score} de 100`}>
      <svg viewBox="0 0 50 50" aria-hidden="true">
        <circle cx="25" cy="25" r={radius} className="score-ring-track" />
        <circle
          cx="25"
          cy="25"
          r={radius}
          className={`score-ring-fill ${score >= 70 ? 'is-high' : ''}`}
          strokeDasharray={length}
          strokeDashoffset={length * (1 - score / 100)}
        />
      </svg>
      {size === 'md' && <b aria-hidden="true">{score}</b>}
    </span>
  );
}

/** Linha com área, desenhada ao montar; o último ponto fica marcado. */
export function Sparkline({ values }: { values: number[] }) {
  const gradientId = `spark-${useId().replace(/:/g, '')}`;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = values.map((value, index) => [
    (index / Math.max(1, values.length - 1)) * 300,
    58 - ((value - min) / range) * 50,
  ]);
  const line = points.map(([x, y], index) => `${index ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const [lastX, lastY] = points[points.length - 1];

  return (
    <svg className="spark" viewBox="0 0 300 64" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#818cf8" stopOpacity="0.35" />
          <stop offset="1" stopColor="#818cf8" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L300 64 L0 64 Z`} fill={`url(#${gradientId})`} />
      <path className="spark-line" d={line} pathLength={1} />
      <circle className="spark-dot" cx={lastX} cy={lastY} r="4.5" />
    </svg>
  );
}

/** Anel de progresso (0–1). */
export function RingGauge({ ratio, label }: { ratio: number; label: string }) {
  const gradientId = `ring-${useId().replace(/:/g, '')}`;
  const length = 2 * Math.PI * 38;
  return (
    <svg className="ring" viewBox="0 0 92 92" aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#818cf8" />
          <stop offset="1" stopColor="#6366f1" />
        </linearGradient>
      </defs>
      <circle className="ring-track" cx="46" cy="46" r="38" />
      <circle
        className="ring-fill"
        cx="46"
        cy="46"
        r="38"
        stroke={`url(#${gradientId})`}
        strokeDasharray={length}
        style={{ '--ring-offset': length * (1 - Math.min(1, Math.max(0, ratio))), '--ring-length': length } as CSSProperties}
      />
      <text x="46" y="52" textAnchor="middle">
        {label}
      </text>
    </svg>
  );
}

/** Barras por semana; a maior fica em jade. */
export function WeekBars({ values }: { values: number[] }) {
  const max = Math.max(1, ...values);
  return (
    <div className="week-bars" aria-hidden="true">
      {values.map((value, index) => (
        <span key={index} className={value > 0 && value === max ? 'is-top' : value > 0 ? 'is-on' : ''}>
          <i style={{ '--h': `${Math.max(6, (value / max) * 100)}%`, '--d': `${400 + index * 80}ms` } as CSSProperties} />
          <small>S{index + 1}</small>
        </span>
      ))}
    </div>
  );
}

/** Partículas jade saindo de um ponto do canvas (comemoração de venda fechada). */
export function burst(canvas: HTMLCanvasElement | null) {
  if (!canvas || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  canvas.width = rect.width * ratio;
  canvas.height = rect.height * ratio;
  const context = canvas.getContext('2d');
  if (!context) return;
  context.scale(ratio, ratio);
  const colors = ['#818cf8', '#eafff6', '#6366f1', '#b8ffe3'];
  const particles = Array.from({ length: 80 }, () => ({
    x: rect.width * 0.22,
    y: rect.height * 0.42,
    vx: (Math.random() * 2 - 0.4) * 7,
    vy: (Math.random() * -1.2 - 0.2) * 7,
    size: 2 + Math.random() * 4,
    life: 1,
    color: colors[Math.floor(Math.random() * colors.length)],
  }));
  const tick = () => {
    context.clearRect(0, 0, rect.width, rect.height);
    let alive = false;
    particles.forEach((particle) => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.22;
      particle.life -= 0.016;
      if (particle.life <= 0) return;
      alive = true;
      context.globalAlpha = particle.life;
      context.fillStyle = particle.color;
      context.beginPath();
      context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      context.fill();
    });
    if (alive) requestAnimationFrame(tick);
    else context.clearRect(0, 0, rect.width, rect.height);
  };
  tick();
}

export function RadarLoader({ label }: { label: string }) {
  return (
    <div className="radar-loader" role="status">
      <span className="radar-loader-dot" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
