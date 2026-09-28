/**
 * Conteúdo e dados de exemplo da landing page — nicho de lançamento: ENERGIA SOLAR.
 * Todos os valores são ilustrativos e ficam separados dos componentes
 * para facilitar ajustes de texto sem mexer em layout.
 */
import type { LucideIcon } from 'lucide-react';
import {
  AudioLines,
  BarChart3,
  BellRing,
  Building2,
  CircleDollarSign,
  Clock,
  Coins,
  Eye,
  FileText,
  HandCoins,
  Hourglass,
  MessageCircle,
  MessageSquareText,
  Package,
  Radar,
  ScanSearch,
  Snowflake,
  Sun,
  Tractor,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
  Wrench,
  Zap,
} from 'lucide-react';
import type { NumberFormat } from '../utils/format';

export type Tone = 'neutral' | 'green' | 'yellow' | 'red';
export type Priority = 'high' | 'waiting' | 'late';

export const priorityMeta: Record<Priority, { label: string; tone: Tone }> = {
  high: { label: 'Alta prioridade', tone: 'green' },
  waiting: { label: 'Aguardando', tone: 'yellow' },
  late: { label: 'Atrasada', tone: 'red' },
};

/* Navegação ------------------------------------------------------------ */

export interface NavLink {
  label: string;
  href: string;
}

export const navLinks: NavLink[] = [
  { label: 'Produto', href: '#produto' },
  { label: 'Como funciona', href: '#como-funciona' },
  { label: 'Benefícios', href: '#beneficios' },
  { label: 'Preços', href: '#precos' },
];

/* Dashboard (hero) ----------------------------------------------------- */

export interface DashboardStat {
  id: string;
  label: string;
  value: number;
  format: NumberFormat;
  tone: Tone;
  icon: LucideIcon;
  hint: string;
}

export const dashboardStats: DashboardStat[] = [
  { id: 'open', label: 'Em propostas', value: 186400, format: 'currency', tone: 'neutral', icon: Wallet, hint: '9 abertas' },
  { id: 'tracking', label: 'Em acompanhamento', value: 12, format: 'number', tone: 'neutral', icon: Eye, hint: '+3 esta semana' },
  { id: 'waiting', label: 'Aguardando resposta', value: 7, format: 'number', tone: 'yellow', icon: Clock, hint: '2 atrasadas' },
  { id: 'recovered', label: 'Recuperado no mês', value: 42300, format: 'currency', tone: 'green', icon: TrendingUp, hint: '355x a assinatura' },
];

export const opportunityTrend = {
  labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
  values: [142000, 151500, 148200, 163900, 170400, 179800, 186400],
};

export interface Opportunity {
  id: string;
  client: string;
  service: string;
  value: number;
  daysWithoutReply: number;
  priority: Priority;
}

export const attentionOpportunities: Opportunity[] = [
  { id: 'mariana', client: 'Mariana Oliveira', service: 'Sistema 8,1 kWp + inversor híbrido', value: 38500, daysWithoutReply: 5, priority: 'late' },
  { id: 'joao', client: 'João Silva', service: 'Sistema residencial 5,4 kWp', value: 24800, daysWithoutReply: 2, priority: 'high' },
  { id: 'ricardo', client: 'Ricardo Alves', service: 'Sistema comercial 12 kWp', value: 54900, daysWithoutReply: 1, priority: 'waiting' },
];

/* Problema ------------------------------------------------------------- */

export type ProblemVisual = 'sent' | 'waiting' | 'forgotten';

export interface ProblemStep {
  number: string;
  title: string;
  description: string;
  tone: Tone;
  visual: ProblemVisual;
}

export const problemSteps: ProblemStep[] = [
  { number: '01', title: 'Proposta enviada', description: 'Visita técnica, dimensionamento, simulação. Você fez sua parte.', tone: 'neutral', visual: 'sent' },
  { number: '02', title: 'Cliente não responde', description: '“Vou ver com a família.” A proposta fica parada.', tone: 'yellow', visual: 'waiting' },
  { number: '03', title: 'Oportunidade esquecida', description: 'Outro integrador liga antes. A venda desaparece.', tone: 'red', visual: 'forgotten' },
];

export const problemExample = {
  file: 'proposta-6,6kWp-carlos.pdf',
  sentMessage: 'Olá, Carlos! Segue a proposta do seu sistema de 6,6 kWp.',
  reply: 'Vou ver com minha esposa e te aviso 👍',
  code: '#0183',
  value: 32400,
};

/* Solução -------------------------------------------------------------- */

export interface FlowStep {
  label: string;
  description: string;
  icon: LucideIcon;
  tone: Tone;
}

export const solutionFlow: FlowStep[] = [
  { label: 'Proposta', description: 'Você envia o orçamento do sistema.', icon: FileText, tone: 'neutral' },
  { label: 'Sem resposta', description: 'O cliente fica em silêncio.', icon: Hourglass, tone: 'yellow' },
  { label: 'FoundCash identifica', description: 'A proposta parada aparece no seu painel.', icon: Radar, tone: 'neutral' },
  { label: 'Você recebe o alerta', description: 'Na hora certa de agir.', icon: BellRing, tone: 'neutral' },
  { label: 'Faz o follow-up', description: 'No WhatsApp, com um script pronto.', icon: MessageCircle, tone: 'neutral' },
  { label: 'Venda recuperada', description: 'Sistema vendido, dinheiro no caixa.', icon: CircleDollarSign, tone: 'green' },
];

/* Dinheiro em risco ---------------------------------------------------- */

export const moneyAtRisk = {
  total: 186400,
  weeklyChange: 12.4,
  breakdown: [
    { id: 'high', label: 'Alta prioridade', value: 52000, tone: 'green' as Tone },
    { id: 'waiting', label: 'Aguardando resposta', value: 81000, tone: 'yellow' as Tone },
    { id: 'attention', label: 'Precisam de atenção', value: 53400, tone: 'red' as Tone },
  ],
  weekly: [
    { label: 'S1', value: 98000 },
    { label: 'S2', value: 112000 },
    { label: 'S3', value: 106000 },
    { label: 'S4', value: 129000 },
    { label: 'S5', value: 137000 },
    { label: 'S6', value: 151000 },
    { label: 'S7', value: 164000 },
    { label: 'S8', value: 186400 },
  ],
};

/* Funcionalidades ------------------------------------------------------ */

export interface Feature {
  title: string;
  description: string;
  icon: LucideIcon;
}

export const features: Feature[] = [
  { title: 'Entrada rápida', description: 'Cliente, valor e data do follow-up. Cadastre uma proposta em menos de 15 segundos.', icon: Zap },
  { title: 'Prioridade do dia', description: 'As 3 propostas que mais precisam de você hoje, por valor ou atraso.', icon: BellRing },
  { title: 'Dinheiro recuperado', description: 'Veja quanto já voltou para o caixa no mês — e quanto ainda está parado.', icon: Coins },
  { title: 'Scripts de abordagem', description: 'Mensagens prontas para energia solar, abertas direto no WhatsApp do cliente.', icon: MessageSquareText },
  { title: 'Relatório mensal de ROI', description: 'Todo dia 1º: quanto você recuperou, quanto pagou e o seu retorno.', icon: BarChart3 },
  { title: 'Relatório de perdas', description: 'Preço, concorrente, financiamento: saiba por que as propostas não fecham.', icon: TrendingDown },
];

export const roadmap: Feature[] = [
  { title: 'Cadastro por áudio', description: 'Mande um áudio rápido e a proposta é criada automaticamente.', icon: AudioLines },
  { title: 'Alertas de propostas esfriando', description: '“Você tem R$ 85.000 prestes a esfriar esta semana.”', icon: Snowflake },
];

/* Como funciona -------------------------------------------------------- */

export interface HowStep {
  number: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

export const howItWorksSteps: HowStep[] = [
  { number: '01', title: 'Cadastre', description: 'Cliente, valor e data. Suas 5 primeiras propostas em poucos minutos.', icon: Zap },
  { number: '02', title: 'Acompanhe', description: 'O FoundCash mostra quem precisa de um novo contato hoje.', icon: ScanSearch },
  { number: '03', title: 'Recupere', description: 'Chame no WhatsApp com um script pronto e marque a venda fechada.', icon: HandCoins },
];

/* Exemplo real --------------------------------------------------------- */

export const exampleOpportunity = {
  code: '#0183',
  client: 'Carlos Mendes',
  service: 'Sistema fotovoltaico 6,6 kWp',
  value: 32400,
  sentDaysAgo: 6,
  status: 'Sem resposta',
  timeline: [
    { label: 'Proposta enviada pelo WhatsApp', when: 'Há 6 dias' },
    { label: 'Cliente respondeu: “Vou ver com minha esposa e te aviso”', when: 'Há 6 dias' },
    { label: 'Nenhum novo contato desde então', when: 'Hoje' },
  ],
  suggestedMessage:
    'Olá, Carlos! Tudo bem? Passando para saber se vocês conseguiram avaliar a proposta do sistema de 6,6 kWp. Se ajudar, posso simular um financiamento com parcela próxima da conta de luz atual.',
};

/* Recuperação (ilustrativo) -------------------------------------------- */

export const recoveryExample = {
  before: { count: 23, value: 612000 },
  after: { count: 4, value: 118600 },
};

/* Público -------------------------------------------------------------- */

export interface Audience {
  title: string;
  description: string;
  icon: LucideIcon;
}

export const audiences: Audience[] = [
  { title: 'Integradores', description: 'Acompanhe cada proposta do dimensionamento até a instalação.', icon: Sun },
  { title: 'Instaladores autônomos', description: 'Organize seus orçamentos sem planilha e sem CRM complexo.', icon: Wrench },
  { title: 'Revendas de kits', description: 'Não deixe cotações de kits esquecidas no WhatsApp.', icon: Package },
  { title: 'Projetos comerciais', description: 'Propostas de alto valor e ciclo longo, sempre em acompanhamento.', icon: Building2 },
  { title: 'Projetos rurais', description: 'Produtores decidem com calma — o FoundCash lembra por você.', icon: Tractor },
  { title: 'Equipes comerciais', description: 'Cada vendedor sabe quem precisa de contato hoje.', icon: Users },
];

/* Benefícios ----------------------------------------------------------- */

export interface Benefit {
  symbol: string;
  label: string;
}

export const benefits: Benefit[] = [
  { symbol: '↓', label: 'menos propostas esquecidas' },
  { symbol: '↑', label: 'mais acompanhamento' },
  { symbol: 'R$', label: 'visibilidade do dinheiro parado' },
  { symbol: '✓', label: 'processo comercial organizado' },
];

/* FAQ ------------------------------------------------------------------ */

export interface FaqItem {
  question: string;
  answer: string;
}

export const faqItems: FaqItem[] = [
  {
    question: 'O FoundCash é um CRM?',
    answer:
      'Não exatamente. O FoundCash é focado em uma tarefa específica: ajudar você a acompanhar e recuperar propostas que ficaram paradas. Sem funil complicado, sem campos demais.',
  },
  {
    question: 'Por que o foco em energia solar?',
    answer:
      'Propostas de energia solar têm valor alto e decisão demorada — o cliente compara, pesquisa financiamento, conversa com a família. É exatamente aí que o follow-up faz diferença. Uma única proposta recuperada costuma pagar muitos meses de assinatura.',
  },
  {
    question: 'Como funciona o teste grátis?',
    answer:
      'Você usa o FoundCash por 14 dias, sem cartão de crédito. Ao final, escolhe entre o plano Essencial e o Pro, no ciclo mensal ou anual.',
  },
  {
    question: 'Preciso integrar meu WhatsApp?',
    answer:
      'Não. Você cadastra o número ou o link do WhatsApp do cliente e, na hora do follow-up, o FoundCash abre a conversa com a mensagem pronta no seu próprio WhatsApp.',
  },
  {
    question: 'O FoundCash envia mensagens automaticamente?',
    answer:
      'Não. Você decide quando e como falar com cada cliente. O FoundCash avisa quem precisa de contato e deixa a mensagem pronta.',
  },
  {
    question: 'Preciso cadastrar todos os meus clientes?',
    answer: 'Não. Comece pelas propostas que estão paradas — o onboarding ajuda você a cadastrar as 5 primeiras.',
  },
  {
    question: 'Posso cancelar quando quiser?',
    answer: 'Sim.',
  },
  {
    question: 'O FoundCash garante que vou recuperar vendas?',
    answer:
      'Não. O sistema ajuda você a identificar e acompanhar propostas, mas o resultado depende de cada negócio, cliente e processo comercial.',
  },
];

/* Footer --------------------------------------------------------------- */

export const footerLinks: NavLink[] = [
  { label: 'Produto', href: '#produto' },
  { label: 'Como funciona', href: '#como-funciona' },
  { label: 'Preços', href: '#precos' },
  { label: 'FAQ', href: '#faq' },
];
