import { useState } from 'react';
import { ArrowRight, Loader2, MessageCircle, Plus, TrendingUp } from 'lucide-react';
import { useAuth } from '../../auth/useAuth';
import { Badge } from '../../components/common/Badge';
import { CountUp } from '../../components/common/CountUp';
import { PRIORITY_COUNT } from '../../config/app';
import { builtInTemplates, fillTemplate, lossReasonLabels } from '../../config/niche';
import { PLAN_PRICING } from '../../../supabase/functions/_shared/plans.ts';
import type { Opportunity, OpportunityStatus } from '../../lib/types';
import { Link } from '../../router/Link';
import { currentMonthLabel, daysFromToday, describeFollowUp, formatDateKey } from '../../utils/dates';
import { formatCurrency } from '../../utils/format';
import { whatsappLink } from '../../utils/parsing';
import {
  activeSummary,
  dueCount,
  priorityToday,
  recoveredThisMonth,
  subscriptionRoi,
  type PrioritySort,
} from '../metrics';
import { useAppData } from '../state/useAppData';

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

function followUpTone(key: string) {
  const diff = daysFromToday(key);
  if (diff < 0) return 'red' as const;
  if (diff === 0) return 'yellow' as const;
  return 'neutral' as const;
}

function quickMessage(opportunity: Opportunity): string {
  const firstName = opportunity.client_name.startsWith('WhatsApp') ? '' : opportunity.client_name.split(' ')[0];
  return fillTemplate(builtInTemplates[0].body, {
    cliente: firstName,
    valor: formatCurrency(opportunity.value),
  }).replace(/,\s*!/g, '!');
}

const tabs: Array<{ status: OpportunityStatus; label: string }> = [
  { status: 'open', label: 'Abertas' },
  { status: 'won', label: 'Recuperadas' },
  { status: 'lost', label: 'Perdidas' },
];

export function DashboardPage() {
  const { profile } = useAuth();
  const { opportunities, loading, error, reload, openQuickEntry, openOpportunity } = useAppData();
  const [sort, setSort] = useState<PrioritySort>('value');
  const [tab, setTab] = useState<OpportunityStatus>('open');

  if (!profile) return null;

  if (loading) {
    return (
      <div className="app-empty">
        <Loader2 className="spin" size={24} aria-label="Carregando oportunidades" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-empty" role="alert">
        <p>{error}</p>
        <button type="button" className="btn btn-secondary" onClick={() => void reload()}>
          Tentar novamente
        </button>
      </div>
    );
  }

  const active = activeSummary(opportunities);
  const recovered = recoveredThisMonth(opportunities);
  const { cost, roi } = subscriptionRoi(recovered.total, profile);
  const priority = priorityToday(opportunities, sort, PRIORITY_COUNT);
  const pendingToday = dueCount(opportunities);
  const openLimit = PLAN_PRICING[profile.plan].openLimit;
  const firstName = profile.full_name.split(' ')[0];
  const listed = opportunities.filter((item) => item.status === tab);

  return (
    <div className="dashboard">
      <header className="page-head">
        <div>
          <p className="page-kicker">Visão geral</p>
          <h1 className="page-title">
            {greeting()}
            {firstName ? `, ${firstName}` : ''}
          </h1>
        </div>
      </header>

      {/* Valor em destaque: ativo x recuperado */}
      <section className="money-cards" aria-label="Resumo financeiro">
        <article className="money-card">
          <p className="money-card-label">Dinheiro em oportunidades ativas</p>
          <CountUp className="money-card-value" value={active.total} format="currency" start />
          <p className="money-card-foot">
            {active.count} {active.count === 1 ? 'proposta aberta' : 'propostas abertas'}
            {openLimit !== null && (
              <span className={active.count >= openLimit * 0.9 ? 'text-warning' : ''}>
                {' '}
                · limite do plano: {openLimit}
              </span>
            )}
          </p>
        </article>

        <article className="money-card money-card--recovered">
          <p className="money-card-label">
            <TrendingUp size={16} aria-hidden="true" /> Recuperado em {currentMonthLabel()}
          </p>
          <CountUp className="money-card-value" value={recovered.total} format="currency" start />
          <p className="money-card-foot">
            {recovered.total > 0 ? (
              <>
                <strong className="roi-chip">{roi.toLocaleString('pt-BR')}x</strong> o valor da sua assinatura (
                {formatCurrency(cost)}/mês)
              </>
            ) : (
              'Marque “Fechou negócio” quando uma proposta virar venda.'
            )}
          </p>
        </article>
      </section>

      {/* Prioridade de hoje */}
      <section className="panel" aria-labelledby="prioridade-titulo">
        <div className="panel-head">
          <div>
            <h2 id="prioridade-titulo" className="panel-title">
              Prioridade de hoje
            </h2>
            <p className="panel-subtitle">
              {pendingToday === 0
                ? 'Nenhum follow-up pendente.'
                : `${pendingToday} ${pendingToday === 1 ? 'cliente precisa' : 'clientes precisam'} de você hoje.`}
            </p>
          </div>
          <div className="segmented" role="radiogroup" aria-label="Ordenar prioridade">
            <button type="button" role="radio" aria-checked={sort === 'value'} onClick={() => setSort('value')}>
              Maior valor
            </button>
            <button type="button" role="radio" aria-checked={sort === 'date'} onClick={() => setSort('date')}>
              Mais atrasadas
            </button>
          </div>
        </div>

        {opportunities.length === 0 ? (
          <div className="panel-empty">
            <p>Nenhuma proposta cadastrada ainda. Leva menos de 15 segundos.</p>
            <button type="button" className="btn btn-primary" onClick={openQuickEntry}>
              <Plus size={18} aria-hidden="true" /> Cadastrar primeira proposta
            </button>
          </div>
        ) : priority.length === 0 ? (
          <div className="panel-empty">
            <p>Tudo em dia. Os próximos follow-ups aparecem aqui na data marcada.</p>
          </div>
        ) : (
          <ol className="priority-list">
            {priority.map((item, index) => (
              <li key={item.id} className="priority-card">
                <span className="priority-rank" aria-hidden="true">
                  {index + 1}
                </span>
                <div className="priority-info">
                  <p className="priority-name">{item.client_name}</p>
                  <Badge tone={followUpTone(item.follow_up_on)}>{describeFollowUp(item.follow_up_on)}</Badge>
                </div>
                <p className="priority-value tabular">{formatCurrency(item.value)}</p>
                <div className="priority-actions">
                  {item.whatsapp && (
                    <a
                      className="btn btn-primary btn-sm"
                      href={whatsappLink(item.whatsapp, quickMessage(item))}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Chamar ${item.client_name} no WhatsApp`}
                    >
                      <MessageCircle size={16} aria-hidden="true" /> WhatsApp
                    </a>
                  )}
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => openOpportunity(item.id)}
                    aria-label={`Abrir oportunidade de ${item.client_name}`}
                  >
                    Abrir <ArrowRight className="icon-arrow" size={16} aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* Todas as oportunidades */}
      <section className="panel" aria-labelledby="todas-titulo">
        <div className="panel-head">
          <h2 id="todas-titulo" className="panel-title">
            Todas as oportunidades
          </h2>
          <div className="segmented" role="tablist" aria-label="Filtrar por status">
            {tabs.map((option) => (
              <button
                key={option.status}
                type="button"
                role="tab"
                aria-selected={tab === option.status}
                aria-controls="lista-oportunidades"
                onClick={() => setTab(option.status)}
              >
                {option.label} ({opportunities.filter((item) => item.status === option.status).length})
              </button>
            ))}
          </div>
        </div>

        <div id="lista-oportunidades" role="tabpanel">
          {listed.length === 0 ? (
            <p className="panel-empty">Nada por aqui ainda.</p>
          ) : (
            <ul className="op-list">
              {listed.map((item) => (
                <li key={item.id}>
                  <button type="button" className="op-row" onClick={() => openOpportunity(item.id)}>
                    <span className="op-row-name">{item.client_name}</span>
                    <span className="op-row-status">
                      {item.status === 'open' && (
                        <Badge tone={followUpTone(item.follow_up_on)}>{describeFollowUp(item.follow_up_on)}</Badge>
                      )}
                      {item.status === 'won' && item.closed_at && (
                        <span className="text-muted">Fechada em {formatDateKey(item.closed_at.slice(0, 10))}</span>
                      )}
                      {item.status === 'lost' && (
                        <span className="text-muted">{lossReasonLabels[item.loss_reason ?? 'outro']}</span>
                      )}
                    </span>
                    <span className={`op-row-value tabular ${item.status === 'won' ? 'text-green' : ''}`}>
                      {formatCurrency(item.value)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <p className="app-footnote">
        Dica: pressione <kbd>N</kbd> em qualquer tela para cadastrar uma proposta. Veja seu retorno no{' '}
        <Link to="/app/relatorio">relatório do mês</Link>.
      </p>
    </div>
  );
}
