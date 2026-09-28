-- =============================================================================
-- FoundCash — esquema inicial
-- Métrica principal do sistema: VALOR RECUPERADO
--   = soma de `opportunities.value` com status 'won' fechadas no período.
-- =============================================================================

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- Perfis
-- -----------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  business_name text,
  niche text not null default 'energia_solar',
  plan text not null default 'essencial' check (plan in ('essencial', 'pro')),
  billing_cycle text not null default 'monthly' check (billing_cycle in ('monthly', 'annual')),
  trial_ends_at timestamptz not null default (now() + interval '14 days'),
  onboarding_completed_at timestamptz,
  monthly_report_opt_in boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.profiles.trial_ends_at is
  'Fim do teste grátis. Não é editável pelo usuário (ver grants abaixo).';

-- Cria o perfil automaticamente no cadastro, usando os metadados do signUp.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan text := coalesce(new.raw_user_meta_data ->> 'plan', 'essencial');
  v_cycle text := coalesce(new.raw_user_meta_data ->> 'billing_cycle', 'monthly');
begin
  if v_plan not in ('essencial', 'pro') then v_plan := 'essencial'; end if;
  if v_cycle not in ('monthly', 'annual') then v_cycle := 'monthly'; end if;

  insert into public.profiles (id, full_name, business_name, plan, billing_cycle)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'business_name', ''),
    v_plan,
    v_cycle
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- Oportunidades (propostas/orçamentos)
-- -----------------------------------------------------------------------------
create table public.opportunities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  client_name text not null check (char_length(trim(client_name)) between 1 and 120),
  whatsapp text check (whatsapp is null or whatsapp ~ '^[0-9]{10,15}$'),
  value numeric(12, 2) not null check (value >= 0),
  follow_up_on date not null,
  status text not null default 'open' check (status in ('open', 'won', 'lost')),
  loss_reason text check (
    loss_reason is null
    or loss_reason in ('preco', 'concorrente', 'financiamento', 'adiou', 'sem_resposta', 'outro')
  ),
  last_contact_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index opportunities_user_status_idx on public.opportunities (user_id, status, follow_up_on);
create index opportunities_user_closed_idx on public.opportunities (user_id, closed_at) where status = 'won';

-- Histórico de movimentações (preenchido por trigger — o cliente não escreve aqui).
create table public.opportunity_events (
  id bigint generated always as identity primary key,
  opportunity_id uuid not null references public.opportunities (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('created', 'contacted', 'rescheduled', 'won', 'lost', 'reopened')),
  created_at timestamptz not null default now()
);

create index opportunity_events_opportunity_idx on public.opportunity_events (opportunity_id, created_at desc);

-- Limite de oportunidades abertas no plano Essencial (Pro = ilimitado).
create or replace function public.essencial_open_limit()
returns integer
language sql
immutable
as $$ select 50 $$;

create or replace function public.opportunities_before_write()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_plan text;
  v_open integer;
begin
  if tg_op = 'INSERT' then
    select plan into v_plan from public.profiles where id = new.user_id;
    if v_plan = 'essencial' then
      select count(*) into v_open
      from public.opportunities
      where user_id = new.user_id and status = 'open';
      if v_open >= public.essencial_open_limit() then
        raise exception 'LIMITE_PLANO: o plano Essencial permite até % oportunidades abertas.',
          public.essencial_open_limit()
          using errcode = 'P0001';
      end if;
    end if;
    if new.status <> 'open' then
      new.closed_at := coalesce(new.closed_at, now());
    end if;
    return new;
  end if;

  -- UPDATE
  new.updated_at := now();
  new.user_id := old.user_id; -- dono não muda

  if new.status <> old.status then
    if new.status = 'open' then
      new.closed_at := null;
      new.loss_reason := null;
    else
      new.closed_at := now();
    end if;
  end if;

  if new.status <> 'lost' then
    new.loss_reason := null;
  end if;

  return new;
end;
$$;

create trigger opportunities_before_write
  before insert or update on public.opportunities
  for each row execute function public.opportunities_before_write();

create or replace function public.opportunities_log_events()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.opportunity_events (opportunity_id, user_id, kind)
    values (new.id, new.user_id, 'created');
    return new;
  end if;

  if new.status <> old.status then
    insert into public.opportunity_events (opportunity_id, user_id, kind)
    values (new.id, new.user_id, case new.status when 'won' then 'won' when 'lost' then 'lost' else 'reopened' end);
  end if;

  if new.last_contact_at is distinct from old.last_contact_at and new.last_contact_at is not null then
    insert into public.opportunity_events (opportunity_id, user_id, kind)
    values (new.id, new.user_id, 'contacted');
  elsif new.follow_up_on <> old.follow_up_on and new.status = 'open' then
    insert into public.opportunity_events (opportunity_id, user_id, kind)
    values (new.id, new.user_id, 'rescheduled');
  end if;

  return new;
end;
$$;

create trigger opportunities_log_events
  after insert or update on public.opportunities
  for each row execute function public.opportunities_log_events();

-- -----------------------------------------------------------------------------
-- Scripts de abordagem personalizados (recurso do plano Pro)
-- -----------------------------------------------------------------------------
create table public.message_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 80),
  body text not null check (char_length(trim(body)) between 1 and 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.is_pro(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$ select exists (select 1 from public.profiles where id = p_user and plan = 'pro') $$;

-- -----------------------------------------------------------------------------
-- Relatórios mensais de ROI (gerados pela Edge Function `monthly-report`)
-- -----------------------------------------------------------------------------
create table public.monthly_reports (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  month date not null, -- primeiro dia do mês de referência
  recovered numeric(12, 2) not null,
  recovered_count integer not null,
  subscription_cost numeric(12, 2) not null,
  roi numeric(10, 2) not null,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, month)
);

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.opportunities enable row level security;
alter table public.opportunity_events enable row level security;
alter table public.message_templates enable row level security;
alter table public.monthly_reports enable row level security;

create policy "perfil: ler o próprio" on public.profiles
  for select using (id = auth.uid());
create policy "perfil: atualizar o próprio" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- O usuário só altera colunas "seguras" (não pode estender o próprio teste).
revoke update on public.profiles from authenticated;
grant update (full_name, business_name, plan, billing_cycle, onboarding_completed_at, monthly_report_opt_in)
  on public.profiles to authenticated;

create policy "oportunidades: ler as próprias" on public.opportunities
  for select using (user_id = auth.uid());
create policy "oportunidades: criar as próprias" on public.opportunities
  for insert with check (user_id = auth.uid());
create policy "oportunidades: atualizar as próprias" on public.opportunities
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "oportunidades: excluir as próprias" on public.opportunities
  for delete using (user_id = auth.uid());

create policy "eventos: ler os próprios" on public.opportunity_events
  for select using (user_id = auth.uid());

create policy "scripts: ler os próprios" on public.message_templates
  for select using (user_id = auth.uid());
create policy "scripts: criar (Pro)" on public.message_templates
  for insert with check (user_id = auth.uid() and public.is_pro(auth.uid()));
create policy "scripts: atualizar (Pro)" on public.message_templates
  for update using (user_id = auth.uid()) with check (user_id = auth.uid() and public.is_pro(auth.uid()));
create policy "scripts: excluir os próprios" on public.message_templates
  for delete using (user_id = auth.uid());

create policy "relatórios: ler os próprios" on public.monthly_reports
  for select using (user_id = auth.uid());
