/**
 * Planos exibidos na landing page e nas configurações.
 * Os VALORES ficam em `supabase/functions/_shared/plans.ts` (fonte única,
 * compartilhada com o relatório mensal de ROI). Aqui ficam só os textos.
 */
import {
  PLAN_PRICING,
  TRIAL_DAYS,
  type BillingCycle,
  type PlanId,
  type PlanPricing,
} from '../../supabase/functions/_shared/plans.ts';

export { TRIAL_DAYS };
export type { BillingCycle, PlanId };

export interface PricingPlan extends PlanPricing {
  description: string;
  features: string[];
  highlighted?: boolean;
  badge?: string;
}

export const pricingPlans: PricingPlan[] = [
  {
    ...PLAN_PRICING.essencial,
    description: 'Para o integrador que cuida das próprias vendas.',
    features: [
      'Entrada rápida de propostas (menos de 15 segundos)',
      'Dashboard de dinheiro recuperado',
      'Lembretes de follow-up',
      `Até ${PLAN_PRICING.essencial.openLimit} propostas abertas`,
      'Scripts de abordagem prontos',
      'Relatório mensal de ROI por e-mail',
    ],
  },
  {
    ...PLAN_PRICING.pro,
    description: 'Para empresas com volume de propostas e equipe comercial.',
    features: [
      'Tudo do Essencial',
      'Propostas ilimitadas',
      'Scripts de abordagem personalizáveis',
      'Relatórios avançados de perda',
    ],
    highlighted: true,
    badge: 'Mais completo',
  },
];

export const billingCycleLabels: Record<BillingCycle, string> = {
  monthly: 'Mensal',
  annual: 'Anual',
};

export const trialCtaLabel = `Testar grátis por ${TRIAL_DAYS} dias`;
export const pricingNote = `${TRIAL_DAYS} dias grátis • Sem cartão de crédito • Cancele quando quiser.`;

export function getPlanById(id: PlanId): PricingPlan {
  return pricingPlans.find((plan) => plan.id === id) ?? pricingPlans[0];
}

export function priceFor(plan: PricingPlan, cycle: BillingCycle): number {
  return cycle === 'annual' ? plan.annualMonthlyPrice : plan.monthlyPrice;
}

/** Maior desconto percentual do plano anual (para o selo "Economize até X%"). */
export const maxAnnualDiscount = Math.max(
  ...pricingPlans.map((plan) => Math.round((1 - plan.annualMonthlyPrice / plan.monthlyPrice) * 100)),
);

export function signupPath(plan: PlanId = 'essencial', cycle: BillingCycle = 'monthly'): string {
  return `/cadastro?plano=${plan}&ciclo=${cycle}`;
}
