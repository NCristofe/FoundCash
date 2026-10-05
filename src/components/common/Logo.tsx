import { useId } from 'react';
import './Logo.css';

interface LogoMarkProps {
  size?: number;
  className?: string;
}

/** Símbolo do FoundCash: uma seta encontrando uma moeda. */
export function LogoMark({ size = 32, className = '' }: LogoMarkProps) {
  const gradientId = `logo-gradient-${useId().replace(/:/g, '')}`;

  return (
    <svg
      className={`logo-mark ${className}`}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#818CF8" />
          <stop offset="1" stopColor="#4F46E5" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill={`url(#${gradientId})`} />
      <path d="M21.5 11.8A7 7 0 1 0 23 16.2" stroke="#09090B" strokeWidth="2.6" strokeLinecap="round" />
      <path
        d="M25 7 18.4 13.6M18.2 9.4v4.4h4.4"
        stroke="#09090B"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="16.5" r="2" fill="#09090B" />
    </svg>
  );
}

interface LogoProps {
  href?: string;
  showWordmark?: boolean;
  size?: number;
}

export function Logo({ href = '#topo', showWordmark = true, size = 32 }: LogoProps) {
  return (
    <a className="logo" href={href} aria-label="FoundCash — voltar ao início">
      <LogoMark size={size} />
      {showWordmark && (
        <span className="logo-wordmark" aria-hidden="true">
          Found<span>Cash</span>
        </span>
      )}
    </a>
  );
}
