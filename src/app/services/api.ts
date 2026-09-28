import { requireSupabase } from '../../lib/supabase';
import type {
  MessageTemplate,
  MonthlyReport,
  NewOpportunity,
  Opportunity,
  OpportunityEvent,
} from '../../lib/types';

export type OpportunityChanges = Partial<
  Pick<Opportunity, 'client_name' | 'whatsapp' | 'value' | 'follow_up_on' | 'status' | 'loss_reason' | 'last_contact_at'>
>;

/** O Postgres devolve `numeric` como string; normalizamos para number. */
function toOpportunity(row: Record<string, unknown>): Opportunity {
  return { ...(row as unknown as Opportunity), value: Number(row.value) };
}

export async function fetchOpportunities(): Promise<Opportunity[]> {
  const { data, error } = await requireSupabase()
    .from('opportunities')
    .select('*')
    .order('follow_up_on', { ascending: true })
    .limit(5000);
  if (error) throw error;
  return (data ?? []).map(toOpportunity);
}

export async function insertOpportunity(input: NewOpportunity): Promise<Opportunity> {
  const { data, error } = await requireSupabase().from('opportunities').insert(input).select('*').single();
  if (error) throw error;
  return toOpportunity(data);
}

export async function updateOpportunity(id: string, changes: OpportunityChanges): Promise<Opportunity> {
  const { data, error } = await requireSupabase()
    .from('opportunities')
    .update(changes)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return toOpportunity(data);
}

export async function deleteOpportunity(id: string): Promise<void> {
  const { error } = await requireSupabase().from('opportunities').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchEvents(opportunityId: string): Promise<OpportunityEvent[]> {
  const { data, error } = await requireSupabase()
    .from('opportunity_events')
    .select('id, opportunity_id, kind, created_at')
    .eq('opportunity_id', opportunityId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []) as OpportunityEvent[];
}

export async function fetchTemplates(): Promise<MessageTemplate[]> {
  const { data, error } = await requireSupabase()
    .from('message_templates')
    .select('id, title, body')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as MessageTemplate[];
}

export async function saveTemplate(template: { id?: string; title: string; body: string }): Promise<MessageTemplate> {
  const client = requireSupabase().from('message_templates');
  const payload = { title: template.title, body: template.body };
  const { data, error } = template.id
    ? await client.update({ ...payload, updated_at: new Date().toISOString() }).eq('id', template.id).select('id, title, body').single()
    : await client.insert(payload).select('id, title, body').single();
  if (error) throw error;
  return data as MessageTemplate;
}

export async function deleteTemplate(id: string): Promise<void> {
  const { error } = await requireSupabase().from('message_templates').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchMonthlyReports(): Promise<MonthlyReport[]> {
  const { data, error } = await requireSupabase()
    .from('monthly_reports')
    .select('id, month, recovered, recovered_count, subscription_cost, roi, sent_at')
    .order('month', { ascending: false })
    .limit(24);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    ...(row as MonthlyReport),
    recovered: Number(row.recovered),
    subscription_cost: Number(row.subscription_cost),
    roi: Number(row.roi),
  }));
}
