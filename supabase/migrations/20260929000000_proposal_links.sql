-- =============================================================================
-- FoundCash — link rastreável da proposta
-- O integrador envia um link (/p/<token>) em vez do PDF solto. O FoundCash
-- registra quando o cliente abre a proposta e a resposta dele
-- ("Quero fechar", "Tenho uma dúvida", "Achei caro", "Vou pensar").
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Links
-- -----------------------------------------------------------------------------
create table public.proposal_links (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null unique references public.opportunities (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- 12 caracteres aleatórios (72 bits), seguros para URL.
  token text not null unique default translate(encode(gen_random_bytes(9), 'base64'), '+/', '-_'),
  file_path text not null,
  file_name text,
  view_count integer not null default 0,
  first_viewed_at timestamptz,
  last_viewed_at timestamptz,
  response text check (response in ('quero_fechar', 'duvida', 'caro', 'pensar')),
  response_note text check (response_note is null or char_length(response_note) <= 500),
  responded_at timestamptz,
  created_at timestamptz not null default now()
);

create index proposal_links_user_idx on public.proposal_links (user_id);

alter table public.proposal_links enable row level security;

create policy "links: ler os próprios" on public.proposal_links
  for select using (user_id = auth.uid());
create policy "links: criar para as próprias oportunidades" on public.proposal_links
  for insert with check (
    user_id = auth.uid()
    and exists (select 1 from public.opportunities o where o.id = opportunity_id and o.user_id = auth.uid())
  );
create policy "links: excluir os próprios" on public.proposal_links
  for delete using (user_id = auth.uid());

-- O integrador só troca o PDF; visitas e respostas são gravadas pelas funções abaixo.
revoke update on public.proposal_links from authenticated;
grant update (file_path, file_name) on public.proposal_links to authenticated;
create policy "links: trocar o PDF" on public.proposal_links
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Novos tipos de evento no histórico da oportunidade.
alter table public.opportunity_events drop constraint opportunity_events_kind_check;
alter table public.opportunity_events add constraint opportunity_events_kind_check
  check (kind in ('created', 'contacted', 'rescheduled', 'won', 'lost', 'reopened', 'viewed', 'responded'));

-- -----------------------------------------------------------------------------
-- Funções públicas (chamadas pela página do cliente, sem login)
-- -----------------------------------------------------------------------------

-- Abre a proposta. Com p_track, conta uma visita a cada 30 minutos de intervalo.
create or replace function public.open_proposal(p_token text, p_track boolean default true)
returns table (
  business_name text,
  client_name text,
  value numeric,
  file_path text,
  response text,
  responded_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_link public.proposal_links;
begin
  select * into v_link from public.proposal_links l where l.token = p_token;
  if not found then
    return;
  end if;

  if p_track then
    if v_link.last_viewed_at is null or v_link.last_viewed_at < now() - interval '30 minutes' then
      update public.proposal_links l
      set view_count = l.view_count + 1,
          first_viewed_at = coalesce(l.first_viewed_at, now()),
          last_viewed_at = now()
      where l.id = v_link.id;

      insert into public.opportunity_events (opportunity_id, user_id, kind)
      values (v_link.opportunity_id, v_link.user_id, 'viewed');
    else
      update public.proposal_links l set last_viewed_at = now() where l.id = v_link.id;
    end if;
  end if;

  return query
  select p.business_name, o.client_name, o.value, v_link.file_path, v_link.response, v_link.responded_at
  from public.opportunities o
  join public.profiles p on p.id = o.user_id
  where o.id = v_link.opportunity_id;
end;
$$;

-- Registra a resposta do cliente e traz o follow-up para hoje.
create or replace function public.respond_proposal(p_token text, p_response text, p_note text default null)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_link public.proposal_links;
  v_today date := (now() at time zone 'America/Sao_Paulo')::date;
begin
  if p_response not in ('quero_fechar', 'duvida', 'caro', 'pensar') then
    raise exception 'Resposta inválida.' using errcode = '22023';
  end if;

  select * into v_link from public.proposal_links l where l.token = p_token;
  if not found then
    return false;
  end if;

  update public.proposal_links l
  set response = p_response,
      response_note = left(nullif(trim(coalesce(p_note, '')), ''), 500),
      responded_at = now()
  where l.id = v_link.id;

  insert into public.opportunity_events (opportunity_id, user_id, kind)
  values (v_link.opportunity_id, v_link.user_id, 'responded');

  update public.opportunities o
  set follow_up_on = v_today
  where o.id = v_link.opportunity_id and o.status = 'open' and o.follow_up_on > v_today;

  return true;
end;
$$;

revoke all on function public.open_proposal(text, boolean) from public;
revoke all on function public.respond_proposal(text, text, text) from public;
grant execute on function public.open_proposal(text, boolean) to anon, authenticated;
grant execute on function public.respond_proposal(text, text, text) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Armazenamento dos PDFs
-- Bucket público: o arquivo só é alcançável por quem tem o link (o caminho
-- contém um UUID aleatório e o bucket não pode ser listado por terceiros).
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('proposals', 'proposals', true, 10485760, array['application/pdf'])
on conflict (id) do nothing;

create policy "propostas: enviar para a própria pasta" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'proposals' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "propostas: ver os próprios arquivos" on storage.objects
  for select to authenticated
  using (bucket_id = 'proposals' and (storage.foldername(name))[1] = auth.uid()::text);
-- O cliente final não está logado mas precisa baixar o PDF pelo link rastreável.
-- O caminho contém um UUID aleatório, então só chega aqui quem tem o link.
create policy "propostas: download público" on storage.objects
  for select to anon
  using (bucket_id = 'proposals');
create policy "propostas: excluir os próprios arquivos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'proposals' and (storage.foldername(name))[1] = auth.uid()::text);
