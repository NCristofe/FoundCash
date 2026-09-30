// Edge Function: relatório mensal de ROI do FoundCash.
//
// Executada no dia 1º de cada mês (ver supabase/cron.sql). Para cada usuário
// com o relatório ativado, calcula o VALOR RECUPERADO no mês anterior, compara
// com o custo da assinatura e envia o e-mail via Resend.
//
// Variáveis (supabase secrets set ...):
//   CRON_SECRET          segredo compartilhado com o agendador
//   RESEND_API_KEY       chave da API do Resend
//   REPORT_FROM_EMAIL    remetente verificado, ex.: "FoundCash <relatorio@seudominio.com.br>"
//   APP_URL              URL pública do app, ex.: https://app.foundcash.com.br
// (SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY já existem no ambiente.)
//
// Teste manual:  POST { "month": "2026-08", "dryRun": true }

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { monthlyCost, roiMultiple, type BillingCycle, type PlanId } from '../_shared/plans.ts';

const BRT_OFFSET_HOURS = 3; // America/Sao_Paulo (UTC-3, sem horário de verão)

interface ProfileRow {
  id: string;
  full_name: string;
  desired_plan: PlanId;
  desired_cycle: BillingCycle;
  trial_ends_at: string;
}

interface MonthRange {
  label: string; // "agosto de 2026"
  firstDay: string; // "2026-08-01"
  startIso: string;
  endIso: string;
}

function resolveMonth(requested?: string): MonthRange {
  let year: number;
  let monthIndex: number; // 0-11

  if (requested && /^\d{4}-\d{2}$/.test(requested)) {
    year = Number(requested.slice(0, 4));
    monthIndex = Number(requested.slice(5, 7)) - 1;
  } else {
    // Mês anterior no horário de Brasília.
    const nowBrt = new Date(Date.now() - BRT_OFFSET_HOURS * 3_600_000);
    year = nowBrt.getUTCFullYear();
    monthIndex = nowBrt.getUTCMonth() - 1;
    if (monthIndex < 0) {
      monthIndex = 11;
      year -= 1;
    }
  }

  const start = new Date(Date.UTC(year, monthIndex, 1, BRT_OFFSET_HOURS));
  const end = new Date(Date.UTC(year, monthIndex + 1, 1, BRT_OFFSET_HOURS));
  const label = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(Date.UTC(year, monthIndex, 15)),
  );

  return {
    label,
    firstDay: `${year}-${String(monthIndex + 1).padStart(2, '0')}-01`,
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  };
}

const brl = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);
const multiple = (value: number) =>
  `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(value)}x`;

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}

function buildEmail(params: {
  firstName: string;
  month: MonthRange;
  recovered: number;
  recoveredCount: number;
  cost: number;
  roi: number;
  openTotal: number;
  inTrial: boolean;
  appUrl: string;
}) {
  const { firstName, month, recovered, recoveredCount, cost, roi, openTotal, inTrial, appUrl } = params;
  const greeting = firstName ? `Olá, ${escapeHtml(firstName)}!` : 'Olá!';
  const costLine = inTrial
    ? `Você está no período de teste — a sua assinatura custaria ${brl(cost)}.`
    : `Sua assinatura custou ${brl(cost)}.`;

  const headline =
    recovered > 0
      ? `Em ${month.label}, você recuperou ${brl(recovered)} com a ajuda do FoundCash.`
      : `Em ${month.label}, nenhuma venda recuperada foi registrada no FoundCash.`;

  const body =
    recovered > 0
      ? `<p style="margin:0 0 12px">${recoveredCount} ${recoveredCount === 1 ? 'proposta voltou' : 'propostas voltaram'} a virar venda.</p>
         <p style="margin:0 0 12px">${costLine}</p>
         <p style="margin:0 0 24px;font-size:20px"><strong>Seu retorno sobre o investimento foi de ${multiple(roi)}.</strong></p>`
      : `<p style="margin:0 0 24px">Você ainda tem <strong>${brl(openTotal)}</strong> em propostas abertas. Comece pelas 3 maiores do seu painel hoje.</p>`;

  const subject =
    recovered > 0
      ? `Você recuperou ${brl(recovered)} em ${month.label} (${multiple(roi)} de retorno)`
      : `Seu relatório FoundCash de ${month.label}`;

  const html = `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#07111F;font-family:Inter,Arial,sans-serif;color:#F8FAFC">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px">
    <p style="margin:0 0 24px;font-weight:700;font-size:18px">Found<span style="color:#22C55E">Cash</span></p>
    <p style="margin:0 0 16px;color:#94A3B8">${greeting}</p>
    <h1 style="margin:0 0 20px;font-size:26px;line-height:1.25">${headline}</h1>
    <div style="color:#CBD5E1;font-size:16px;line-height:1.6">${body}</div>
    <a href="${appUrl}/app" style="display:inline-block;background:#22C55E;color:#052E16;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:12px">Abrir meu painel</a>
    <p style="margin:32px 0 0;color:#64748B;font-size:12px">Você recebe este e-mail no dia 1º de cada mês. Para desativar, acesse Configurações no app.</p>
  </div></body></html>`;

  return { subject, html };
}

Deno.serve(async (request) => {
  const secret = Deno.env.get('CRON_SECRET');
  if (!secret || request.headers.get('Authorization') !== `Bearer ${secret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const payload = (await request.json().catch(() => ({}))) as { month?: string; dryRun?: boolean };
  const month = resolveMonth(payload.month);
  const dryRun = payload.dryRun === true;

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  });
  const resendKey = Deno.env.get('RESEND_API_KEY');
  const fromEmail = Deno.env.get('REPORT_FROM_EMAIL');
  const appUrl = (Deno.env.get('APP_URL') ?? '').replace(/\/$/, '');

  // E-mails dos usuários (auth.users não é acessível via PostgREST).
  const emails = new Map<string, string>();
  for (let page = 1; ; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) return Response.json({ error: error.message }, { status: 500 });
    data.users.forEach((user) => user.email && emails.set(user.id, user.email));
    if (data.users.length < 1000) break;
  }

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, full_name, desired_plan, desired_cycle, trial_ends_at')
    .eq('monthly_report_opt_in', true);
  if (profilesError) return Response.json({ error: profilesError.message }, { status: 500 });

  const results: Array<{ user: string; recovered: number; roi: number; status: string }> = [];

  for (const profile of (profiles ?? []) as ProfileRow[]) {
    const email = emails.get(profile.id);
    if (!email) continue;

    const { data: existing } = await supabase
      .from('monthly_reports')
      .select('sent_at')
      .eq('user_id', profile.id)
      .eq('month', month.firstDay)
      .maybeSingle();
    if (existing?.sent_at && !dryRun) {
      results.push({ user: profile.id, recovered: 0, roi: 0, status: 'já enviado' });
      continue;
    }

    const [{ data: won }, { data: open }] = await Promise.all([
      supabase
        .from('opportunities')
        .select('value')
        .eq('user_id', profile.id)
        .eq('status', 'won')
        .gte('closed_at', month.startIso)
        .lt('closed_at', month.endIso),
      supabase.from('opportunities').select('value').eq('user_id', profile.id).eq('status', 'open'),
    ]);

    const recovered = (won ?? []).reduce((sum, row) => sum + Number(row.value), 0);
    const openTotal = (open ?? []).reduce((sum, row) => sum + Number(row.value), 0);
    const cost = monthlyCost(profile.desired_plan, profile.desired_cycle);
    const roi = roiMultiple(recovered, cost);
    const inTrial = new Date(profile.trial_ends_at) >= new Date(month.endIso);

    const email_ = buildEmail({
      firstName: profile.full_name.trim().split(' ')[0] ?? '',
      month,
      recovered,
      recoveredCount: won?.length ?? 0,
      cost,
      roi,
      openTotal,
      inTrial,
      appUrl,
    });

    if (dryRun) {
      results.push({ user: profile.id, recovered, roi, status: `simulado: ${email_.subject}` });
      continue;
    }

    await supabase.from('monthly_reports').upsert(
      {
        user_id: profile.id,
        month: month.firstDay,
        recovered,
        recovered_count: won?.length ?? 0,
        subscription_cost: cost,
        roi,
      },
      { onConflict: 'user_id,month' },
    );

    if (!resendKey || !fromEmail) {
      results.push({ user: profile.id, recovered, roi, status: 'sem RESEND_API_KEY/REPORT_FROM_EMAIL' });
      continue;
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: fromEmail, to: email, subject: email_.subject, html: email_.html }),
    });

    if (response.ok) {
      await supabase
        .from('monthly_reports')
        .update({ sent_at: new Date().toISOString() })
        .eq('user_id', profile.id)
        .eq('month', month.firstDay);
      results.push({ user: profile.id, recovered, roi, status: 'enviado' });
    } else {
      results.push({ user: profile.id, recovered, roi, status: `erro ${response.status}: ${await response.text()}` });
    }
  }

  return Response.json({ month: month.firstDay, dryRun, count: results.length, results });
});
