/**
 * Configuração do nicho de lançamento: integradores de ENERGIA SOLAR.
 * Textos do app, scripts padrão e motivos de perda ficam aqui para facilitar
 * a troca de nicho no futuro.
 */
import type { ClientType, Interest, LeadSource, LossReason, MessageTemplate, Stage } from '../lib/types';

export const niche = {
  id: 'energia_solar',
  name: 'Energia solar',
  proposalWord: 'proposta',
  proposalWordPlural: 'propostas',
  clientPlaceholder: 'Ex.: Carlos Mendes ou wa.me/5511987654321',
  valuePlaceholder: 'Ex.: 28.500',
  onboardingPrompt:
    'Comece pelas oportunidades em aberto: propostas que você enviou, leads em visita ou negociação e clientes que ficaram sem resposta.',
};

export const lossReasonLabels: Record<LossReason, string> = {
  preco: 'Preço',
  concorrente: 'Fechou com concorrente',
  financiamento: 'Financiamento',
  desistiu: 'Cliente desistiu',
  sem_resposta: 'Sem retorno do cliente',
  tecnico: 'Problema técnico (telhado, rede, inversão de fluxo)',
  prazo: 'Prazo de instalação',
  adiou: 'Adiou a decisão',
  outro: 'Outro motivo',
};

/**
 * Etapas comerciais de uma integradora. `touchDays` = dias sem contato até a
 * oportunidade entrar no radar; `stallDays` = dias na mesma etapa até ser
 * considerada parada. São limites operacionais, ajustáveis após validar com usuários.
 */
export const stages: Array<{ id: Stage; label: string; short: string; touchDays: number; stallDays: number }> = [
  { id: 'novo_lead', label: 'Novo lead', short: 'Lead', touchDays: 1, stallDays: 3 },
  { id: 'qualificacao', label: 'Qualificação', short: 'Qualificação', touchDays: 3, stallDays: 7 },
  { id: 'contato', label: 'Contato realizado', short: 'Contato', touchDays: 4, stallDays: 7 },
  { id: 'visita', label: 'Visita / diagnóstico', short: 'Visita', touchDays: 4, stallDays: 7 },
  { id: 'proposta', label: 'Proposta enviada', short: 'Proposta', touchDays: 3, stallDays: 10 },
  { id: 'follow_up', label: 'Follow-up', short: 'Follow-up', touchDays: 5, stallDays: 14 },
  { id: 'negociacao', label: 'Negociação', short: 'Negociação', touchDays: 3, stallDays: 10 },
];

export const stageById = Object.fromEntries(stages.map((stage) => [stage.id, stage])) as Record<
  Stage,
  (typeof stages)[number]
>;

export const clientTypeLabels: Record<ClientType, string> = {
  residencial: 'Residencial',
  comercial: 'Comercial',
  rural: 'Rural',
  industrial: 'Industrial',
};

export const leadSourceLabels: Record<LeadSource, string> = {
  indicacao: 'Indicação',
  instagram: 'Instagram',
  google: 'Google',
  whatsapp: 'WhatsApp',
  site: 'Site',
  porta_a_porta: 'Porta a porta',
  parceiro: 'Parceiro',
  outro: 'Outro',
};

export const interestLabels: Record<Interest, string> = {
  alto: 'Alto',
  medio: 'Médio',
  baixo: 'Baixo',
};

/**
 * Scripts padrão de follow-up (disponíveis em todos os planos).
 * Variáveis: {cliente} e {valor}.
 */
export const builtInTemplates: MessageTemplate[] = [
  {
    id: 'retomada',
    title: 'Retomada da proposta',
    body: 'Olá, {cliente}! Tudo bem? Passando para saber se você conseguiu avaliar a proposta do sistema de energia solar. Posso tirar alguma dúvida ou ajustar algo?',
    builtIn: true,
  },
  {
    id: 'economia',
    title: 'Lembrete da economia',
    body: 'Oi, {cliente}! Cada mês sem o sistema é uma conta de luz cheia. Com a proposta de {valor}, a economia começa logo após a instalação. Quer que eu simule de novo com a sua última conta?',
    builtIn: true,
  },
  {
    id: 'financiamento',
    title: 'Opção de financiamento',
    body: 'Olá, {cliente}! Se o investimento de {valor} pesou, consigo simular um financiamento em que a parcela fica próxima do valor da sua conta de luz atual. Posso te mandar?',
    builtIn: true,
  },
  {
    id: 'ultimo-contato',
    title: 'Último contato',
    body: 'Oi, {cliente}! Vou encerrar sua proposta por aqui para não te incomodar. Se ainda fizer sentido gerar sua própria energia, é só me chamar que retomo de onde paramos.',
    builtIn: true,
  },
];

export function fillTemplate(body: string, variables: { cliente: string; valor: string }): string {
  return body.replace(/\{cliente\}/g, variables.cliente).replace(/\{valor\}/g, variables.valor);
}
