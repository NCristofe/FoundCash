/**
 * Fonte única dos preços do FoundCash.
 * Usado pela landing page / app (Vite) E pela Edge Function do relatório mensal (Deno).
 * Mantenha este arquivo sem dependências.
 */

export type PlanId = 'essencial' | 'pro';
export type BillingCycle = 'monthly' | 'annual';

export interface PlanPricing {
  id: PlanId;
  name: string;
  /** Preço cobrado no plano mensal (R$/mês). */
  monthlyPrice: number;
  /** Preço mensal equivalente no plano anual (R$/mês). */
  annualMonthlyPrice: number;
  /** Máximo de oportunidades abertas (null = ilimitado). Espelha `essencial_open_limit()` no SQL. */
  openLimit: number | null;
}

export const TRIAL_DAYS = 14;

export const PLAN_PRICING: Record<PlanId, PlanPricing> = {
  essencial: { id: 'essencial', name: 'Essencial', monthlyPrice: 119, annualMonthlyPrice: 99, openLimit: 50 },
  pro: { id: 'pro', name: 'Pro', monthlyPrice: 199, annualMonthlyPrice: 169, openLimit: null },
};

/** Custo mensal efetivo da assinatura (usado no cálculo de ROI). */
export function monthlyCost(plan: PlanId, cycle: BillingCycle): number {
  const pricing = PLAN_PRICING[plan];
  return cycle === 'annual' ? pricing.annualMonthlyPrice : pricing.monthlyPrice;
}

/** ROI em "vezes" (ex.: 12.5 = 12,5x o valor da assinatura). */
export function roiMultiple(recovered: number, cost: number): number {
  if (cost <= 0) return 0;
  return Math.round((recovered / cost) * 10) / 10;
}
