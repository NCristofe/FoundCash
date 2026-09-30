import { requireSupabase } from '../../lib/supabase';
import type {
  MessageTemplate,
  MonthlyReport,
  NewOpportunity,
  Opportunity,
  OpportunityEvent,
  ProposalLink,
  ProposalResponse,
  PublicProposal,
} from '../../lib/types';

const PROPOSALS_BUCKET = 'proposals';

export type OpportunityChanges = Partial<
  Omit<Opportunity, 'id' | 'user_id' | 'closed_at' | 'created_at' | 'updated_at' | 'stage_changed_at'>
>;

const numberOrNull = (value: unknown) => (value === null || value === undefined ? null : Number(value));

/** O Postgres devolve `numeric` como string; normalizamos para number. */
function toOpportunity(row: Record<string, unknown>): Opportunity {
  return {
    ...(row as unknown as Opportunity),
    stage: (row.stage as Opportunity['stage'] | undefined) ?? 'proposta',
    stage_changed_at: (row.stage_changed_at as string | undefined) ?? (row.created_at as string),
    value: Number(row.value),
    monthly_kwh: numberOrNull(row.monthly_kwh),
    system_kwp: numberOrNull(row.system_kwp),
  };
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

/* Link rastreável da proposta --------------------------------------------------- */

export function proposalUrl(token: string): string {
  return `${window.location.origin}/p/${token}`;
}

export function proposalFileUrl(filePath: string): string {
  return requireSupabase().storage.from(PROPOSALS_BUCKET).getPublicUrl(filePath).data.publicUrl;
}

export async function fetchProposalLinks(): Promise<ProposalLink[]> {
  const { data, error } = await requireSupabase().from('proposal_links').select('*').limit(5000);
  if (error) throw error;
  return (data ?? []) as ProposalLink[];
}

/**
 * Envia o PDF e cria o link da oportunidade (ou troca o PDF, mantendo o mesmo
 * link, visitas e resposta).
 */
export async function saveProposalFile(opportunityId: string, file: File): Promise<ProposalLink> {
  const client = requireSupabase();
  const { data: auth } = await client.auth.getUser();
  if (!auth.user) throw new Error('Faça login novamente.');

  // Caminho imprevisível: o bucket é público e o arquivo só deve ser achado pelo link.
  const path = `${auth.user.id}/${crypto.randomUUID()}.pdf`;
  const storage = client.storage.from(PROPOSALS_BUCKET);
  const { error: uploadError } = await storage.upload(path, file, { contentType: 'application/pdf' });
  if (uploadError) throw uploadError;

  const { data: existing } = await client
    .from('proposal_links')
    .select('id, file_path')
    .eq('opportunity_id', opportunityId)
    .maybeSingle();

  const { data, error } = existing
    ? await client
        .from('proposal_links')
        .update({ file_path: path, file_name: file.name })
        .eq('id', existing.id)
        .select('*')
        .single()
    : await client
        .from('proposal_links')
        .insert({ opportunity_id: opportunityId, file_path: path, file_name: file.name })
        .select('*')
        .single();

  if (error) {
    await storage.remove([path]);
    throw error;
  }
  if (existing?.file_path) await storage.remove([existing.file_path]);
  return data as ProposalLink;
}

/** Página pública: dados da proposta. `track = false` não conta visita (o próprio integrador vendo). */
export async function openProposal(token: string, track: boolean): Promise<PublicProposal | null> {
  const { data, error } = await requireSupabase().rpc('open_proposal', { p_token: token, p_track: track });
  if (error) throw error;
  const row = (data as PublicProposal[] | null)?.[0];
  return row ? { ...row, value: Number(row.value) } : null;
}

export async function respondProposal(token: string, response: ProposalResponse, note: string): Promise<void> {
  const { error } = await requireSupabase().rpc('respond_proposal', {
    p_token: token,
    p_response: response,
    p_note: note,
  });
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
