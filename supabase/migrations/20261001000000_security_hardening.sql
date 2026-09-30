-- =============================================================================
-- FoundCash — endurecimento de segurança
-- 1) `plan` e `billing_cycle` passam a ser o plano EM USO e só o servidor os altera
--    (webhook de cobrança ou SQL). Antes, qualquer usuário podia se promover a Pro.
--    A escolha do usuário fica em `desired_plan` / `desired_cycle` (intenção).
-- 2) Remove a leitura anônima do bucket de propostas (permitia listar arquivos).
-- =============================================================================

alter table public.profiles
  add column desired_plan text not null default 'essencial' check (desired_plan in ('essencial', 'pro')),
  add column desired_cycle text not null default 'monthly' check (desired_cycle in ('monthly', 'annual'));

-- Quem já existe mantém a escolha atual como intenção. O plano em uso NÃO é alterado aqui:
-- revise `select id, plan from profiles` e rebaixe manualmente quem não pagou.
update public.profiles set desired_plan = plan, desired_cycle = billing_cycle;

-- O plano escolhido no cadastro é só intenção; o acesso começa no Essencial.
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

  insert into public.profiles (id, full_name, business_name, plan, billing_cycle, desired_plan, desired_cycle)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'business_name', ''),
    'essencial',
    'monthly',
    v_plan,
    v_cycle
  );
  return new;
end;
$$;

revoke update on public.profiles from authenticated;
grant update (full_name, business_name, desired_plan, desired_cycle, onboarding_completed_at, monthly_report_opt_in)
  on public.profiles to authenticated;

-- O bucket é público: o PDF abre pelo link sem esta policy. Com ela, qualquer pessoa
-- conseguia LISTAR os arquivos de todos os clientes pela API de Storage.
drop policy if exists "propostas: download público" on storage.objects;
