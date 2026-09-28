/**
 * Conteúdo e dados de exemplo da landing page.
 * Todos os valores são ilustrativos e ficam separados dos componentes
 * para facilitar ajustes de texto sem mexer em layout.
 */
import type { LucideIcon } from 'lucide-react';
import {
  AirVent,
  BarChart3,
  BellRing,
  Briefcase,
  CircleDollarSign,
  ClipboardPlus,
  Clock,
  Coins,
  Eye,
  FileText,
  Hammer,
  HandCoins,
  History,
  Hourglass,
  MessageCircle,
  MessageSquareText,
  PaintRoller,
  Radar,
  ScanSearch,
  Sun,
  Target,
  TrendingUp,
  Wallet,
  Wrench,
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
  { id: 'open', label: 'Oportunidades', value: 18450, format: 'currency', tone: 'neutral', icon: Wallet, hint: '23 abertas' },
  { id: 'tracking', label: 'Em acompanhamento', value: 12, format: 'number', tone: 'neutral', icon: Eye, hint: '+3 esta semana' },
  { id: 'waiting', label: 'Aguardando resposta', value: 7, format: 'number', tone: 'yellow', icon: Clock, hint: '2 atrasadas' },
  { id: 'recovered', label: 'Recuperadas', value: 4280, format: 'currency', tone: 'green', icon: TrendingUp, hint: 'este mês' },
];

export const opportunityTrend = {
  labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
  values: [11200, 12400, 11900, 14300, 15100, 16800, 18450],
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
  { id: 'joao', client: 'João Silva', service: 'Instalação de ar-condicionado', value: 1800, daysWithoutReply: 2, priority: 'high' },
  { id: 'mariana', client: 'Mariana Oliveira', service: 'Móveis planejados', value: 4500, daysWithoutReply: 5, priority: 'late' },
  { id: 'ricardo', client: 'Ricardo Alves', service: 'Reforma de banheiro', value: 2350, daysWithoutReply: 1, priority: 'waiting' },
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
  { number: '01', title: 'Orçamento enviado', description: 'Você fez sua parte.', tone: 'neutral', visual: 'sent' },
  { number: '02', title: 'Cliente não responde', description: 'O orçamento fica parado.', tone: 'yellow', visual: 'waiting' },
  { number: '03', title: 'Oportunidade esquecida', description: 'A venda pode desaparecer.', tone: 'red', visual: 'forgotten' },
];

/* Solução -------------------------------------------------------------- */

export interface FlowStep {
  label: string;
  description: string;
  icon: LucideIcon;
  tone: Tone;
}

export const solutionFlow: FlowStep[] = [
  { label: 'Orçamento', description: 'Você envia a proposta.', icon: FileText, tone: 'neutral' },
  { label: 'Sem resposta', description: 'O cliente fica em silêncio.', icon: Hourglass, tone: 'yellow' },
  { label: 'FoundCash identifica', description: 'A oportunidade parada aparece.', icon: Radar, tone: 'neutral' },
  { label: 'Você recebe o alerta', description: 'Na hora certa de agir.', icon: BellRing, tone: 'neutral' },
  { label: 'Faz o follow-up', description: 'Pelo canal que você já usa.', icon: MessageCircle, tone: 'neutral' },
  { label: 'Venda recuperada', description: 'Oportunidade que voltou.', icon: CircleDollarSign, tone: 'green' },
];

/* Dinheiro em risco ---------------------------------------------------- */

export const moneyAtRisk = {
  total: 18450,
  weeklyChange: 12.4,
  breakdown: [
    { id: 'high', label: 'Alta prioridade', value: 5200, tone: 'green' as Tone },
    { id: 'waiting', label: 'Aguardando resposta', value: 8100, tone: 'yellow' as Tone },
    { id: 'attention', label: 'Precisam de atenção', value: 5150, tone: 'red' as Tone },
  ],
  weekly: [
    { label: 'S1', value: 9800 },
    { label: 'S2', value: 11200 },
    { label: 'S3', value: 10600 },
    { label: 'S4', value: 12900 },
    { label: 'S5', value: 13700 },
    { label: 'S6', value: 15100 },
    { label: 'S7', value: 16400 },
    { label: 'S8', value: 18450 },
  ],
};

/* Funcionalidades ------------------------------------------------------ */

export interface Feature {
  title: string;
  description: string;
  icon: LucideIcon;
}

export const features: Feature[] = [
  { title: 'Monitoramento de oportunidades', description: 'Tenha todos os seus orçamentos em um único lugar.', icon: Target },
  { title: 'Alertas de follow-up', description: 'Saiba quais clientes precisam de atenção.', icon: BellRing },
  { title: 'Valor em risco', description: 'Visualize quanto dinheiro está parado em oportunidades abertas.', icon: Coins },
  { title: 'Histórico', description: 'Veja todos os contatos e movimentações de cada cliente.', icon: History },
  { title: 'Templates', description: 'Crie mensagens de follow-up prontas para diferentes situações.', icon: MessageSquareText },
  { title: 'Indicadores', description: 'Descubra quantas oportunidades você recuperou e quanto elas representaram.', icon: BarChart3 },
];

/* Como funciona -------------------------------------------------------- */

export interface HowStep {
  number: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

export const howItWorksSteps: HowStep[] = [
  { number: '01', title: 'Cadastre', description: 'Adicione seus clientes e oportunidades.', icon: ClipboardPlus },
  { number: '02', title: 'Acompanhe', description: 'O FoundCash mostra o que precisa da sua atenção.', icon: ScanSearch },
  { number: '03', title: 'Recupere', description: 'Entre em contato novamente e transforme oportunidades em vendas.', icon: HandCoins },
];

/* Exemplo real --------------------------------------------------------- */

export const exampleOpportunity = {
  code: '#0183',
  client: 'Carlos Mendes',
  service: 'Instalação de 3 aparelhos',
  value: 3200,
  sentDaysAgo: 6,
  status: 'Sem resposta',
  timeline: [
    { label: 'Orçamento enviado pelo WhatsApp', when: 'Há 6 dias' },
    { label: 'Cliente respondeu: “Vou pensar e te aviso”', when: 'Há 6 dias' },
    { label: 'Nenhum novo contato desde então', when: 'Hoje' },
  ],
  suggestedMessage:
    'Olá, Carlos! Tudo bem? Passando para saber se você conseguiu avaliar o orçamento da instalação dos 3 aparelhos. Se quiser, posso ajustar alguma coisa ou tirar suas dúvidas.',
};

/* Recuperação (ilustrativo) -------------------------------------------- */

export const recoveryExample = {
  before: { count: 23, value: 32800 },
  after: { count: 8, value: 7450 },
};

/* Público -------------------------------------------------------------- */

export interface Audience {
  title: string;
  description: string;
  icon: LucideIcon;
}

export const audiences: Audience[] = [
  { title: 'Oficinas', description: 'Não deixe orçamentos de reparos esquecidos.', icon: Wrench },
  { title: 'Marcenarias', description: 'Acompanhe projetos e móveis planejados.', icon: Hammer },
  { title: 'Ar-condicionado', description: 'Não perca instalações e manutenções.', icon: AirVent },
  { title: 'Energia solar', description: 'Acompanhe propostas de alto valor.', icon: Sun },
  { title: 'Reformas', description: 'Mantenha cada orçamento em acompanhamento.', icon: PaintRoller },
  { title: 'Prestadores de serviços', description: 'Organize oportunidades sem precisar de um CRM complexo.', icon: Briefcase },
];

/* Benefícios ----------------------------------------------------------- */

export interface Benefit {
  symbol: string;
  label: string;
}

export const benefits: Benefit[] = [
  { symbol: '↓', label: 'menos esquecimentos' },
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
      'Não exatamente. O FoundCash é focado em uma tarefa específica: ajudar você a acompanhar e recuperar oportunidades comerciais que ficaram paradas.',
  },
  {
    question: 'Preciso integrar meu WhatsApp?',
    answer:
      'Não inicialmente. Você pode utilizar o FoundCash para identificar as oportunidades e realizar o contato pelos canais que já utiliza.',
  },
  {
    question: 'O FoundCash envia mensagens automaticamente?',
    answer:
      'A primeira versão não depende de mensagens automáticas. Recursos de automação e integração poderão ser adicionados posteriormente.',
  },
  {
    question: 'Preciso cadastrar todos os meus clientes?',
    answer: 'Não. Você pode começar apenas pelas oportunidades que deseja acompanhar.',
  },
  {
    question: 'Posso cancelar quando quiser?',
    answer: 'Sim.',
  },
  {
    question: 'O FoundCash garante que vou recuperar vendas?',
    answer:
      'Não. O sistema ajuda você a identificar e acompanhar oportunidades, mas o resultado depende de cada negócio, cliente e processo comercial.',
  },
];

/* Footer --------------------------------------------------------------- */

export const footerLinks: NavLink[] = [
  { label: 'Produto', href: '#produto' },
  { label: 'Como funciona', href: '#como-funciona' },
  { label: 'Preços', href: '#precos' },
  { label: 'FAQ', href: '#faq' },
];
