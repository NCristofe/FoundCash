-- =============================================================================
-- FoundCash — pipeline solar + dados do Radar
-- `status` continua sendo o resultado (open / won / lost).
-- `stage` é a etapa comercial enquanto a oportunidade está aberta; ao ganhar ou
-- perder, a etapa é preservada para mostrar ONDE a venda foi decidida.
-- =============================================================================

alter table public.opportunities
  add column stage text not null default 'proposta' check (
    stage in ('novo_lead', 'qualificacao', 'contato', 'visita', 'proposta', 'follow_up', 'negociacao')
  ),
  add column stage_changed_at timestamptz not null default now(),
  add column city text check (city is null or char_length(city) <= 80),
  add column client_type text check (client_type is null or client_type in ('residencial', 'comercial', 'rural', 'industrial')),
  add column monthly_kwh numeric(10, 1) check (monthly_kwh is null or monthly_kwh >= 0),
  add column system_kwp numeric(8, 2) check (system_kwp is null or system_kwp >= 0),
  add column seller text check (seller is null or char_length(seller) <= 60),
  add column lead_source text check (
    lead_source is null
    or lead_source in ('indicacao', 'instagram', 'google', 'whatsapp', 'site', 'porta_a_porta', 'parceiro', 'outro')
  ),
  add column interest text check (interest is null or interest in ('alto', 'medio', 'baixo')),
  add column proposal_expires_on date,
  add column notes text check (notes is null or char_length(notes) <= 2000);

-- Oportunidades existentes eram propostas enviadas; a etapa "começa" no cadastro.
update public.opportunities set stage_changed_at = created_at;

create index opportunities_user_stage_idx on public.opportunities (user_id, stage) where status = 'open';

-- Novos motivos de perda.
alter table public.opportunities drop constraint opportunities_loss_reason_check;
alter table public.opportunities add constraint opportunities_loss_reason_check check (
  loss_reason is null
  or loss_reason in (
    'preco', 'concorrente', 'financiamento', 'desistiu', 'sem_resposta', 'tecnico', 'prazo', 'adiou', 'outro'
  )
);

-- Novo tipo de evento: mudança de etapa.
alter table public.opportunity_events drop constraint opportunity_events_kind_check;
alter table public.opportunity_events add constraint opportunity_events_kind_check
  check (kind in ('created', 'contacted', 'rescheduled', 'won', 'lost', 'reopened', 'viewed', 'responded', 'stage_changed'));

-- Marca quando a etapa mudou (base do "parada há X dias").
create or replace function public.opportunities_stage_touch()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.stage is distinct from old.stage then
    new.stage_changed_at := now();
  end if;
  return new;
end;
$$;

create trigger opportunities_stage_touch
  before update on public.opportunities
  for each row execute function public.opportunities_stage_touch();

create or replace function public.opportunities_log_stage()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.stage is distinct from old.stage then
    insert into public.opportunity_events (opportunity_id, user_id, kind)
    values (new.id, new.user_id, 'stage_changed');
  end if;
  return new;
end;
$$;

create trigger opportunities_log_stage
  after update on public.opportunities
  for each row execute function public.opportunities_log_stage();
