import type { BillingCycle, PlanId } from '../../supabase/functions/_shared/plans.ts';

export type { BillingCycle, PlanId };

export type OpportunityStatus = 'open' | 'won' | 'lost';
export type LossReason = 'preco' | 'concorrente' | 'financiamento' | 'adiou' | 'sem_resposta' | 'outro';
export type EventKind =
  | 'created'
  | 'contacted'
  | 'rescheduled'
  | 'won'
  | 'lost'
  | 'reopened'
  | 'viewed'
  | 'responded';

/** Resposta do cliente na página da proposta. */
export type ProposalResponse = 'quero_fechar' | 'duvida' | 'caro' | 'pensar';

export interface Profile {
  id: string;
  full_name: string;
  business_name: string | null;
  niche: string;
  plan: PlanId;
  billing_cycle: BillingCycle;
  trial_ends_at: string;
  onboarding_completed_at: string | null;
  monthly_report_opt_in: boolean;
  created_at: string;
}

export type ProfileUpdate = Partial<
  Pick<
    Profile,
    'full_name' | 'business_name' | 'plan' | 'billing_cycle' | 'onboarding_completed_at' | 'monthly_report_opt_in'
  >
>;

export interface Opportunity {
  id: string;
  user_id: string;
  client_name: string;
  whatsapp: string | null;
  /** Em reais. O Postgres devolve numeric como string; normalizamos para number no serviço. */
  value: number;
  /** Data (YYYY-MM-DD) do próximo follow-up. */
  follow_up_on: string;
  status: OpportunityStatus;
  loss_reason: LossReason | null;
  last_contact_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NewOpportunity {
  client_name: string;
  whatsapp: string | null;
  value: number;
  follow_up_on: string;
}

export interface OpportunityEvent {
  id: number;
  opportunity_id: string;
  kind: EventKind;
  created_at: string;
}

/** Link rastreável da proposta (/p/<token>). Um por oportunidade. */
export interface ProposalLink {
  id: string;
  opportunity_id: string;
  token: string;
  file_path: string;
  file_name: string | null;
  view_count: number;
  first_viewed_at: string | null;
  last_viewed_at: string | null;
  response: ProposalResponse | null;
  response_note: string | null;
  responded_at: string | null;
  created_at: string;
}

/** O que a página pública da proposta recebe. */
export interface PublicProposal {
  business_name: string | null;
  client_name: string;
  value: number;
  file_path: string;
  response: ProposalResponse | null;
  responded_at: string | null;
}

export interface MessageTemplate {
  id: string;
  title: string;
  body: string;
  /** true para scripts padrão do nicho (não editáveis, não vêm do banco). */
  builtIn?: boolean;
}

export interface MonthlyReport {
  id: number;
  month: string;
  recovered: number;
  recovered_count: number;
  subscription_cost: number;
  roi: number;
  sent_at: string | null;
}
