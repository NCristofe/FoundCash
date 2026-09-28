/**
 * Cálculos do painel. A métrica principal é o VALOR RECUPERADO:
 * soma das oportunidades marcadas como ganhas no período.
 */
import { monthlyCost, roiMultiple } from '../../supabase/functions/_shared/plans.ts';
import type { LossReason, Opportunity, Profile } from '../lib/types';
import { daysFromToday, isInCurrentMonth } from '../utils/dates';

export type PrioritySort = 'value' | 'date';

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

export function subscriptionRoi(recovered: number, profile: Profile) {
  const cost = monthlyCost(profile.plan, profile.billing_cycle);
  return { cost, roi: roiMultiple(recovered, cost) };
}

/** Oportunidades com follow-up para hoje ou atrasadas, ordenadas por valor ou por data. */
export function priorityToday(items: Opportunity[], sort: PrioritySort, limit: number): Opportunity[] {
  const due = openOpportunities(items).filter((item) => daysFromToday(item.follow_up_on) <= 0);

  return due
    .sort((a, b) => {
      if (sort === 'value') return b.value - a.value || a.follow_up_on.localeCompare(b.follow_up_on);
      return a.follow_up_on.localeCompare(b.follow_up_on) || b.value - a.value;
    })
    .slice(0, limit);
}

export function dueCount(items: Opportunity[]): number {
  return openOpportunities(items).filter((item) => daysFromToday(item.follow_up_on) <= 0).length;
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
