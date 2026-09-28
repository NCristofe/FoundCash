-- Agenda o relatório mensal de ROI para o dia 1º de cada mês às 08:00 (Brasília = 11:00 UTC).
-- Rode UMA vez no SQL Editor do Supabase, depois de publicar a função `monthly-report`.
-- Substitua <PROJECT_REF> e <CRON_SECRET> (o mesmo valor configurado em `supabase secrets set`).

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'foundcash-monthly-report',
  '0 11 1 * *',
  $$
  select net.http_post(
    url := 'https://<PROJECT_REF>.supabase.co/functions/v1/monthly-report',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer <CRON_SECRET>'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
  $$
);

-- Para remover:  select cron.unschedule('foundcash-monthly-report');
