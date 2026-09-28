/**
 * Configuração do nicho de lançamento: integradores de ENERGIA SOLAR.
 * Textos do app, scripts padrão e motivos de perda ficam aqui para facilitar
 * a troca de nicho no futuro.
 */
import type { LossReason, MessageTemplate } from '../lib/types';

export const niche = {
  id: 'energia_solar',
  name: 'Energia solar',
  proposalWord: 'proposta',
  proposalWordPlural: 'propostas',
  clientPlaceholder: 'Ex.: Carlos Mendes ou wa.me/5511987654321',
  valuePlaceholder: 'Ex.: 28.500',
  onboardingPrompt:
    'Pense nas propostas de sistemas fotovoltaicos que você enviou nos últimos 60 dias e que ficaram sem resposta.',
};

export const lossReasonLabels: Record<LossReason, string> = {
  preco: 'Achou caro',
  concorrente: 'Fechou com concorrente',
  financiamento: 'Financiamento não aprovado',
  adiou: 'Adiou a decisão',
  sem_resposta: 'Nunca respondeu',
  outro: 'Outro motivo',
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
