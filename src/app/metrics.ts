/**
 * Cálculos do painel. A métrica principal é o VALOR RECUPERADO:
 * soma das oportunidades marcadas como ganhas no período.
 */
import { monthlyCost, roiMultiple } from '../../supabase/functions/_shared/plans.ts';
import type { LossReason, Opportunity, Profile } from '../lib/types';
import { isInCurrentMonth } from '../utils/dates';

const sum = (items: Opportunity[]) => items.reduce((total, item) => total + item.value, 0);

export function openOpportunities(items: Opportunity[]): Opportunity[] {
  return items.filter((item) => item.status === 'open');
}

export function activeSummary(items: Opportunity[]) {
  const open = openOpportunities(items);
  return { total: sum(open), count: open.length };
}

export function recoveredThisMonth(items: Opportunity[]) {
  const won = items.filter((item) => item.status === 'won' && item.closed_at && isInCurrentMonth(item.closed_at));
  return { total: sum(won), count: won.length };
}

const WEEK_MS = 7 * 86_400_000;

/** Valor em jogo no fim de cada uma das últimas `weeks` semanas (a última é hoje). */
export function openValueHistory(items: Opportunity[], weeks = 8): number[] {
  const now = Date.now();
  return Array.from({ length: weeks }, (_, index) => {
    const at = now - (weeks - 1 - index) * WEEK_MS;
    return sum(
      items.filter(
        (item) => Date.parse(item.created_at) <= at && (item.status === 'open' || !item.closed_at || Date.parse(item.closed_at) > at),
      ),
    );
  });
}

/** Vendas fechadas no mês atual por semana do mês (1–7, 8–14…), até a semana de hoje. */
export function wonByWeekThisMonth(items: Opportunity[]): number[] {
  const buckets = [0, 0, 0, 0, 0];
  items.forEach((item) => {
    if (item.status !== 'won' || !item.closed_at || !isInCurrentMonth(item.closed_at)) return;
    const index = Math.min(4, Math.floor((new Date(item.closed_at).getDate() - 1) / 7));
    buckets[index] += item.value;
  });
  return buckets.slice(0, Math.min(4, Math.floor((new Date().getDate() - 1) / 7)) + 1);
}

export function subscriptionRoi(recovered: number, profile: Profile) {
  const cost = monthlyCost(profile.desired_plan, profile.desired_cycle);
  return { cost, roi: roiMultiple(recovered, cost) };
}

export function lossReport(items: Opportunity[]) {
  const lost = items.filter((item) => item.status === 'lost');
  const byReason = new Map<LossReason, { value: number; count: number }>();

  lost.forEach((item) => {
    const reason = item.loss_reason ?? 'outro';
    const current = byReason.get(reason) ?? { value: 0, count: 0 };
    byReason.set(reason, { value: current.value + item.value, count: current.count + 1 });
  });

  const closed = items.filter((item) => item.status !== 'open').length;

  return {
    total: sum(lost),
    count: lost.length,
    /** % das propostas fechadas (ganhas + perdidas) que foram perdidas. */
    lossRate: closed ? Math.round((lost.length / closed) * 100) : 0,
    reasons: [...byReason.entries()]
      .map(([reason, data]) => ({ reason, ...data }))
      .sort((a, b) => b.value - a.value),
    recent: [...lost].sort((a, b) => (b.closed_at ?? '').localeCompare(a.closed_at ?? '')).slice(0, 10),
  };
}
