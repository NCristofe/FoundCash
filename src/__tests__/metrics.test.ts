import { describe, expect, it } from 'vitest';
import { activeSummary, openOpportunities, recoveredThisMonth } from '../app/metrics';
import type { Opportunity } from '../lib/types';

const base = {
  id: '1', user_id: 'u', client_name: 'X', whatsapp: null, value: 1000, follow_up_on: '2026-01-01', status: 'open',
  loss_reason: null, last_contact_at: null, closed_at: null, created_at: '', updated_at: '', stage: 'proposta',
  stage_changed_at: '', city: null, client_type: null, monthly_kwh: null, system_kwp: null, seller: null,
  lead_source: null, interest: null, proposal_expires_on: null, notes: null,
} as Opportunity;

const make = (over: Partial<Opportunity>): Opportunity => ({ ...base, ...over });

describe('métricas do painel', () => {
  const now = new Date().toISOString();
  const longAgo = '2020-01-15T12:00:00.000Z';
  const items = [
    make({ id: 'a', value: 1000 }),
    make({ id: 'b', value: 2500 }),
    make({ id: 'c', value: 4000, status: 'won', closed_at: now }),
    make({ id: 'd', value: 9000, status: 'won', closed_at: longAgo }),
    make({ id: 'e', value: 700, status: 'lost' }),
  ];

  it('lista só as abertas', () => {
    expect(openOpportunities(items).map((item) => item.id)).toEqual(['a', 'b']);
  });

  it('soma o dinheiro em propostas abertas', () => {
    expect(activeSummary(items)).toEqual({ total: 3500, count: 2 });
  });

  it('conta como recuperado só o que fechou neste mês', () => {
    expect(recoveredThisMonth(items)).toEqual({ total: 4000, count: 1 });
  });
});
