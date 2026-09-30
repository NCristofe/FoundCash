/**
 * Radar de Dinheiro Perdido: lê as oportunidades cadastradas e aponta o que
 * está sendo negligenciado, o que fazer hoje e onde a operação perde vendas.
 * Tudo é derivado dos dados do usuário — nada é estimado ou inventado.
 */
import { lossReasonLabels, stageById, stages } from '../config/niche';
import type { Opportunity, ProposalLink, ProposalResponse, Stage } from '../lib/types';
import { daysFromToday, daysSince } from '../utils/dates';
import { formatCurrency } from '../utils/format';

export type SignalKind =
  | 'responded'
  | 'expired'
  | 'expiring'
  | 'overdue'
  | 'proposal_silent'
  | 'no_proposal'
  | 'stalled'
  | 'no_contact'
  | 'viewed'
  | 'due_today';

export interface Signal {
  kind: SignalKind;
  /** true = sinal de abandono (conta no "em risco"); false = oportunidade quente. */
  risk: boolean;
  text: string;
}

export interface Analysis {
  opportunity: Opportunity;
  /** Prioridade operacional 0–100. Não é probabilidade de fechamento. */
  score: number;
  signals: Signal[];
  atRisk: boolean;
  daysSinceTouch: number;
  daysInStage: number;
  action: { title: string; detail: string } | null;
}

export interface Insight {
  id: string;
  tone: 'risk' | 'info' | 'hot';
  text: string;
}

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;
const days = (count: number) => plural(count, 'dia', 'dias');

const responseText: Record<ProposalResponse, string> = {
  quero_fechar: 'pediu para fechar',
  duvida: 'mandou uma dúvida',
  caro: 'achou caro',
  pensar: 'disse que vai pensar',
};

const STAGE_WEIGHT: Record<Stage, number> = {
  novo_lead: 6,
  qualificacao: 8,
  contato: 10,
  visita: 14,
  proposta: 18,
  follow_up: 18,
  negociacao: 24,
};
const RESPONSE_WEIGHT: Record<ProposalResponse, number> = { quero_fechar: 18, duvida: 14, caro: 10, pensar: 6 };
const INTEREST_WEIGHT = { alto: 14, medio: 8, baixo: 0 } as const;

/** Próximo passo natural de cada etapa quando o follow-up venceu. */
const OVERDUE_VERB: Record<Stage, string> = {
  novo_lead: 'Fazer o primeiro contato com',
  qualificacao: 'Qualificar',
  contato: 'Agendar visita com',
  visita: 'Enviar proposta para',
  proposta: 'Fazer follow-up com',
  follow_up: 'Retomar',
  negociacao: 'Fechar com',
};

const ACTION_VERB: Record<Exclude<SignalKind, 'overdue'>, string> = {
  responded: 'Responder',
  expired: 'Renovar a proposta de',
  expiring: 'Pedir a decisão de',
  proposal_silent: 'Fazer follow-up com',
  no_proposal: 'Enviar proposta para',
  stalled: 'Destravar',
  no_contact: 'Retornar para',
  viewed: 'Ligar para',
  due_today: 'Falar com',
};

/** Último sinal de vida da oportunidade: contato registrado, mudança de etapa ou cadastro. */
function lastTouch(item: Opportunity): number {
  return Math.max(
    Date.parse(item.created_at),
    Date.parse(item.stage_changed_at),
    item.last_contact_at ? Date.parse(item.last_contact_at) : 0,
  );
}

function firstName(name: string): string {
  return name.startsWith('WhatsApp') ? name : name.split(' ')[0];
}

function formatKwp(kwp: number): string {
  return `${kwp.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} kWp`;
}

function detectSignals(item: Opportunity, link: ProposalLink | undefined, touch: number): Signal[] {
  const stage = stageById[item.stage];
  const signals: Signal[] = [];
  const touchDays = daysSince(new Date(touch).toISOString());
  const stageDays = daysSince(item.stage_changed_at);
  const followDiff = daysFromToday(item.follow_up_on);
  // Sem próximo passo no futuro = ninguém está cuidando.
  const unplanned = followDiff <= 0;

  const respondedFresh = Boolean(link?.response && link.responded_at && Date.parse(link.responded_at) > touch);
  if (respondedFresh && link?.response) {
    signals.push({ kind: 'responded', risk: true, text: `Cliente ${responseText[link.response]} e ainda não teve retorno` });
  }

  if (item.proposal_expires_on) {
    const diff = daysFromToday(item.proposal_expires_on);
    if (diff < 0) signals.push({ kind: 'expired', risk: true, text: `Proposta vencida há ${days(-diff)}` });
    else if (diff <= 3) {
      signals.push({ kind: 'expiring', risk: true, text: diff === 0 ? 'Proposta vence hoje' : `Proposta vence em ${days(diff)}` });
    }
  }

  if (followDiff < 0) signals.push({ kind: 'overdue', risk: true, text: `Follow-up atrasado há ${days(-followDiff)}` });

  const contactedSinceStage = item.last_contact_at && Date.parse(item.last_contact_at) > Date.parse(item.stage_changed_at);
  let silentFlagged = false;
  if (unplanned && item.stage === 'proposta' && !contactedSinceStage && stageDays >= stage.touchDays) {
    signals.push({ kind: 'proposal_silent', risk: true, text: `Proposta enviada há ${days(stageDays)} sem follow-up` });
    silentFlagged = true;
  } else if (unplanned && ['qualificacao', 'contato', 'visita'].includes(item.stage) && stageDays >= 5) {
    signals.push({ kind: 'no_proposal', risk: true, text: `Em ${stage.label.toLowerCase()} há ${days(stageDays)} e ainda sem proposta` });
    silentFlagged = true;
  }

  // Reagendar sem avançar de etapa também é abandono.
  if (!silentFlagged && stageDays >= stage.stallDays) {
    signals.push({ kind: 'stalled', risk: true, text: `Parada em ${stage.label.toLowerCase()} há ${days(stageDays)}` });
  }

  if (unplanned && !silentFlagged && touchDays >= stage.touchDays) {
    signals.push({ kind: 'no_contact', risk: true, text: `Sem contato há ${days(touchDays)}` });
  }

  if (!respondedFresh && link?.last_viewed_at && Date.parse(link.last_viewed_at) > touch) {
    signals.push({ kind: 'viewed', risk: false, text: 'Abriu a proposta depois do seu último contato' });
  }

  if (followDiff === 0) signals.push({ kind: 'due_today', risk: false, text: 'Follow-up combinado para hoje' });

  return signals;
}

function scoreOf(item: Opportunity, link: ProposalLink | undefined, signals: Signal[], maxValue: number, touchDays: number) {
  const has = (kind: SignalKind) => signals.some((signal) => signal.kind === kind);
  const followDiff = daysFromToday(item.follow_up_on);

  const value = maxValue > 0 ? 30 * Math.sqrt(item.value / maxValue) : 0;
  const stage = STAGE_WEIGHT[item.stage];
  const interest = item.interest ? INTEREST_WEIGHT[item.interest] : 6;
  const engagement = link?.response
    ? RESPONSE_WEIGHT[link.response] * (has('responded') ? 1 : 0.5)
    : has('viewed')
      ? 8
      : 0;
  const urgency = followDiff < 0 ? Math.min(14, 6 - followDiff) : followDiff === 0 ? 8 : 0;
  const deadline = has('expiring') || has('expired') ? 6 : 0;

  let score = value + stage + interest + engagement + urgency + deadline;
  // Sem contato há mais de 45 dias: provavelmente esfriou.
  if (touchDays > 45) score *= 0.6;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function actionFor(item: Opportunity, signals: Signal[]): Analysis['action'] {
  const primary = signals[0];
  if (!primary) return null;
  const name = firstName(item.client_name);
  const verb = primary.kind === 'overdue' ? OVERDUE_VERB[item.stage] : ACTION_VERB[primary.kind];
  const title =
    primary.kind === 'stalled' ? `${verb} ${stageById[item.stage].short.toLowerCase()} com ${name}` : `${verb} ${name}`;
  const size = item.system_kwp ? ` · ${formatKwp(item.system_kwp)}` : '';
  return { title, detail: `${formatCurrency(item.value)}${size} · ${primary.text}` };
}

export function analyze(opportunities: Opportunity[], links: ProposalLink[]): Analysis[] {
  const open = opportunities.filter((item) => item.status === 'open');
  const linkByOpportunity = new Map(links.map((link) => [link.opportunity_id, link]));
  const maxValue = Math.max(0, ...open.map((item) => item.value));

  return open
    .map((item) => {
      const link = linkByOpportunity.get(item.id);
      const touch = lastTouch(item);
      const daysSinceTouch = daysSince(new Date(touch).toISOString());
      const signals = detectSignals(item, link, touch);
      return {
        opportunity: item,
        score: scoreOf(item, link, signals, maxValue, daysSinceTouch),
        signals,
        atRisk: signals.some((signal) => signal.risk),
        daysSinceTouch,
        daysInStage: daysSince(item.stage_changed_at),
        action: actionFor(item, signals),
      };
    })
    .sort((a, b) => b.score - a.score || b.opportunity.value - a.opportunity.value);
}

const sumValue = (items: Analysis[]) => items.reduce((total, item) => total + item.opportunity.value, 0);

export function radarSummary(analyses: Analysis[]) {
  const risk = analyses.filter((item) => item.atRisk);
  return {
    openTotal: sumValue(analyses),
    openCount: analyses.length,
    riskTotal: sumValue(risk),
    riskCount: risk.length,
    hotCount: analyses.filter((item) => item.signals.some((signal) => signal.kind === 'responded' || signal.kind === 'viewed'))
      .length,
  };
}

/** Ações do dia: tudo que tem sinal, na ordem de prioridade. */
export function todayActions(analyses: Analysis[], limit: number): Analysis[] {
  return analyses.filter((item) => item.action).slice(0, limit);
}

export function pipelineByStage(analyses: Analysis[]) {
  return stages.map((stage) => {
    const items = analyses.filter((item) => item.opportunity.stage === stage.id);
    return {
      stage,
      count: items.length,
      value: sumValue(items),
      riskCount: items.filter((item) => item.atRisk).length,
    };
  });
}

/** Conversão só aparece com amostra mínima; abaixo disso o número engana. */
export const MIN_CLOSED_FOR_CONVERSION = 5;

export function conversion(opportunities: Opportunity[]) {
  const won = opportunities.filter((item) => item.status === 'won').length;
  const closed = won + opportunities.filter((item) => item.status === 'lost').length;
  return { closed, rate: closed >= MIN_CLOSED_FOR_CONVERSION ? Math.round((won / closed) * 100) : null };
}

const pct = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0);

/** Leituras acionáveis. Cada uma só aparece quando há dados suficientes para ser verdade. */
export function insights(opportunities: Opportunity[], analyses: Analysis[]): Insight[] {
  const result: Insight[] = [];
  const openTotal = sumValue(analyses);

  const waiting = analyses.filter((item) => item.signals.some((signal) => signal.kind === 'responded'));
  if (waiting.length > 0) {
    result.push({
      id: 'waiting',
      tone: 'hot',
      text: `${plural(waiting.length, 'cliente respondeu', 'clientes responderam')} a proposta e ainda ${waiting.length === 1 ? 'aguarda' : 'aguardam'} retorno — ${formatCurrency(sumValue(waiting))} em jogo.`,
    });
  }

  const idle = analyses.filter((item) => item.daysSinceTouch > 5);
  if (idle.length >= 2) {
    result.push({
      id: 'idle',
      tone: 'risk',
      text: `${idle.length} oportunidades estão sem movimentação há mais de 5 dias, somando ${formatCurrency(sumValue(idle))}.`,
    });
  }

  const sellers = new Map<string, { value: number; count: number }>();
  analyses.forEach((item) => {
    const seller = item.opportunity.seller?.trim();
    if (!seller) return;
    const current = sellers.get(seller) ?? { value: 0, count: 0 };
    if (item.atRisk) sellers.set(seller, { value: current.value + item.opportunity.value, count: current.count + 1 });
    else sellers.set(seller, current);
  });
  if (sellers.size >= 2) {
    const [name, data] = [...sellers.entries()].sort((a, b) => b[1].value - a[1].value)[0];
    if (data.value > 0) {
      result.push({
        id: 'seller',
        tone: 'risk',
        text: `${name} tem ${formatCurrency(data.value)} em ${plural(data.count, 'oportunidade', 'oportunidades')} sem acompanhamento.`,
      });
    }
  }

  if (analyses.length >= 4 && openTotal > 0) {
    const top = pipelineByStage(analyses).sort((a, b) => b.value - a.value)[0];
    const share = pct(top.value, openTotal);
    if (share >= 40) {
      const hint =
        top.stage.id === 'negociacao'
          ? 'Está perto de fechar: priorize.'
          : top.stage.id === 'proposta' || top.stage.id === 'follow_up'
            ? 'É onde o follow-up decide a venda.'
            : 'Ainda está longe da proposta.';
      result.push({
        id: 'stage',
        tone: 'info',
        text: `${share}% do dinheiro em jogo está na etapa ${top.stage.label.toLowerCase()}. ${hint}`,
      });
    }
  }

  if (analyses.length >= 6 && openTotal > 0) {
    const top3 = [...analyses].sort((a, b) => b.opportunity.value - a.opportunity.value).slice(0, 3);
    const share = pct(sumValue(top3), openTotal);
    if (share >= 40) {
      result.push({ id: 'concentration', tone: 'info', text: `3 oportunidades representam ${share}% do valor do seu pipeline.` });
    }
  }

  const lost = opportunities.filter((item) => item.status === 'lost');
  if (lost.length >= 3) {
    const lostTotal = lost.reduce((total, item) => total + item.value, 0);
    const byReason = new Map<string, number>();
    lost.forEach((item) => {
      const reason = item.loss_reason ?? 'outro';
      byReason.set(reason, (byReason.get(reason) ?? 0) + item.value);
    });
    const [reason, value] = [...byReason.entries()].sort((a, b) => b[1] - a[1])[0];
    if (reason !== 'outro') {
      result.push({
        id: 'loss-reason',
        tone: 'info',
        text: `${lossReasonLabels[reason as keyof typeof lossReasonLabels]} explica ${pct(value, lostTotal)}% do valor perdido (${formatCurrency(value)}).`,
      });
    }

    const byStage = new Map<Stage, number>();
    lost.forEach((item) => byStage.set(item.stage, (byStage.get(item.stage) ?? 0) + 1));
    const [stage, count] = [...byStage.entries()].sort((a, b) => b[1] - a[1])[0];
    const share = pct(count, lost.length);
    if (share >= 40) {
      result.push({
        id: 'loss-stage',
        tone: 'info',
        text: `${share}% das perdas acontecem na etapa ${stageById[stage].label.toLowerCase()}.`,
      });
    }
  }

  return result;
}

/** Perdas por etapa em que a venda foi decidida (página de perdas). */
export function lossesByStage(opportunities: Opportunity[]) {
  const lost = opportunities.filter((item) => item.status === 'lost');
  return stages
    .map((stage) => {
      const items = lost.filter((item) => item.stage === stage.id);
      return { stage, count: items.length, value: items.reduce((total, item) => total + item.value, 0) };
    })
    .filter((row) => row.count > 0);
}
