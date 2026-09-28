import { ArrowRight } from 'lucide-react';
import { useAuth } from '../../auth/useAuth';
import { signupPath, trialCtaLabel, type BillingCycle, type PlanId } from '../../data/pricing';
import { Link } from '../../router/Link';

interface StartButtonProps {
  label?: string;
  planId?: PlanId;
  cycle?: BillingCycle;
  size?: 'sm' | 'md' | 'lg';
  block?: boolean;
  variant?: 'primary' | 'secondary';
  withArrow?: boolean;
  /** Executado antes da navegação (ex.: fechar o menu mobile). */
  onClick?: () => void;
}

/** CTA principal: leva ao cadastro (ou ao painel, se o usuário já estiver logado). */
export function StartButton({
  label = trialCtaLabel,
  planId = 'essencial',
  cycle = 'monthly',
  size = 'md',
  block = false,
  variant = 'primary',
  withArrow = true,
  onClick,
}: StartButtonProps) {
  const { session } = useAuth();
  const classes = ['btn', `btn-${variant}`, size !== 'md' && `btn-${size}`, block && 'btn-block']
    .filter(Boolean)
    .join(' ');

  return (
    <Link to={session ? '/app' : signupPath(planId, cycle)} className={classes} onClick={onClick}>
      {session ? 'Abrir meu painel' : label}
      {withArrow && <ArrowRight className="icon-arrow" size={18} aria-hidden="true" />}
    </Link>
  );
}
