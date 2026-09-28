import { ArrowRight } from 'lucide-react';
import { useUI } from '../../context/useUI';
import type { PlanId } from '../../data/pricing';

interface StartButtonProps {
  label?: string;
  planId?: PlanId;
  size?: 'sm' | 'md' | 'lg';
  block?: boolean;
  variant?: 'primary' | 'secondary';
  withArrow?: boolean;
  /** Executado antes de abrir o cadastro (ex.: fechar o menu mobile). */
  onClick?: () => void;
}

/** Botão de CTA principal: abre o fluxo de cadastro. */
export function StartButton({
  label = 'Começar gratuitamente',
  planId = 'free',
  size = 'md',
  block = false,
  variant = 'primary',
  withArrow = true,
  onClick,
}: StartButtonProps) {
  const { openAuth } = useUI();
  const classes = ['btn', `btn-${variant}`, size !== 'md' && `btn-${size}`, block && 'btn-block']
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      className={classes}
      onClick={() => {
        onClick?.();
        openAuth('signup', planId);
      }}
    >
      {label}
      {withArrow && <ArrowRight className="icon-arrow" size={18} aria-hidden="true" />}
    </button>
  );
}
