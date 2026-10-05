import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { AlertTriangle, Eye, Plus, TrendingUp, Wallet, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '../../auth/useAuth';
import { Badge } from '../../components/common/Badge';
import { ACTIONS_COUNT } from '../../config/app';
import { lossReasonLabels, stageById } from '../../config/niche';
import { useUI } from '../../context/useUI';
import { friendlyError } from '../../lib/supabase';
import type { Opportunity, OpportunityStatus, Stage } from '../../lib/types';
import { Link } from '../../router/Link';
import { currentMonthLabel, describeFollowUp, formatDateKey } from '../../utils/dates';
import { formatCurrency } from '../../utils/format';
import { ActionQueue } from '../components/ActionQueue';
import { RadarLoader, ScoreRing } from '../components/RadarUI';
import { recoveredThisMonth, subscriptionRoi } from '../metrics';
import {
  analyze,
  insights as buildInsights,
  pipelineByStage,
  radarSummary,
  todayActions,
  type Analysis,
} from '../radar';
import { useAppData } from '../state/useAppData';

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

function projectMeta(item: Opportunity): string {
  return [item.city, item.system_kwp ? `${item.system_kwp.toLocaleString('pt-BR')} kWp` : null, item.seller]
    .filter(Boolean)
    .join(' · ');
}

/** Tons de jade do mais frio (lead) ao mais quente (negociação). */
const STAGE_SHADES = ['#25234f', '#312e81', '#4338ca', '#4f46e5', '#6366f1', '#22bd89', '#818cf8'];

const tabs: Array<{ status: OpportunityStatus; label: string }> = [
  { status: 'open', label: 'Abertas' },
  { status: 'won', label: 'Fechadas' },
  { status: 'lost', label: 'Perdidas' },
];

interface KpiDef {
  icon: LucideIcon;
  label: string;
  value: number;
  format: 'currency' | 'percent' | 'number';
  hint: string;
  tone?: 'yellow' | 'green';
}

function KpiCard({ icon: Icon, label, value, format, hint, tone }: KpiDef) {
  const display =
    format === 'currency'
      ? formatCurrency(value)
      : format === 'percent'
        ? `${value}%`
        : value.toLocaleString('pt-BR');
  return (
    <article className={`kpi-card${tone ? ` kpi-card--${tone}` : ''}`}>
      <span className="kpi-icon" aria-hidden="true"><Icon size={15} /></span>
      <span className="kpi-label">{label}</span>
      <span className="kpi-value">{display}</span>
      <span className="kpi-hint">{hint}</span>
    </article>
  );
}

export function DashboardPage() {
  const { profile } = useAuth();
  const { opportunities, proposalLinks, loading, error, reload, openQuickEntry, openOpportunity, updateOpportunity } =
    useAppData();
  const { showToast } = useUI();
  const [tab, setTab] = useState<OpportunityStatus>('open');
  const [stageFilter, setStageFilter] = useState<Stage | null>(null);
  const [ready, setReady] = useState(false);

  const analyses = useMemo(() => analyze(opportunities, proposalLinks), [opportunities, proposalLinks]);

  // Um quadro depois de montar, as barras e anéis animam do zero até o valor.
  useEffect(() => {
    if (loading) return;
    const timer = window.setTimeout(() => setReady(true), 250);
    return () => window.clearTimeout(timer);
  }, [loading]);

  if (!profile) return null;

  if (loading) return <RadarLoader label="Varrendo suas oportunidades…" />;

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

  const summary = radarSummary(analyses);
  const actions = todayActions(analyses, ACTIONS_COUNT);
  const readings = buildInsights(opportunities, analyses);
  const flow = pipelineByStage(analyses);
  const recovered = recoveredThisMonth(opportunities);
  const { roi } = subscriptionRoi(recovered.total, profile);
  const firstName = profile.full_name.split(' ')[0];
  const scoreById = new Map(analyses.map((item) => [item.opportunity.id, item.score]));
  const hasHistory = opportunities.length > 0;
  const nextPlanned = analyses
    .filter((item) => !item.action)
    .sort((a, b) => a.opportunity.follow_up_on.localeCompare(b.opportunity.follow_up_on))[0];

  const listed =
    tab === 'open'
      ? analyses.map((item) => item.opportunity).filter((item) => !stageFilter || item.stage === stageFilter)
      : opportunities
          .filter((item) => item.status === tab)
          .sort((a, b) => (b.closed_at ?? '').localeCompare(a.closed_at ?? ''));

  const filterByStage = (stage: Stage) => {
    setTab('open');
    setStageFilter((current) => (current === stage ? null : stage));
    document.getElementById('todas-titulo')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const markWon = async ({ opportunity }: Analysis) => {
    try {
      await updateOpportunity(opportunity.id, { status: 'won' });
      showToast(`Venda fechada: ${formatCurrency(opportunity.value)} somados a ${currentMonthLabel()}.`);
    } catch (saveError) {
      showToast(friendlyError(saveError), 'error');
      throw saveError;
    }
  };

  const kpis: KpiDef[] = [
    {
      icon: Wallet,
      label: 'Em propostas',
      value: summary.openTotal,
      format: 'currency',
      hint: `${summary.openCount} ${summary.openCount === 1 ? 'aberta' : 'abertas'}`,
    },
    {
      icon: Eye,
      label: 'Em acompanhamento',
      value: summary.openCount - summary.riskCount,
      format: 'number',
      hint: summary.riskCount === 0 ? 'tudo no prazo' : `${summary.openCount - summary.riskCount} no prazo`,
    },
    {
      icon: AlertTriangle,
      label: 'Precisam de atenção',
      value: summary.riskCount,
      format: 'number',
      hint: summary.riskCount > 0 ? `${formatCurrency(summary.riskTotal)} em risco` : 'Nenhuma',
      tone: summary.riskCount > 0 ? 'yellow' : undefined,
    },
    {
      icon: TrendingUp,
      label: 'Fechado no mês',
      value: recovered.total,
      format: 'currency',
      hint: recovered.total > 0 ? `${roi.toLocaleString('pt-BR')}x a assinatura` : 'Marque "Fechou" para ver',
      tone: recovered.total > 0 ? 'green' : undefined,
    },
  ];

  return (
    <div className="dashboard">
      <header className="dash-greet">
        <div>
          <h1 className="page-title">
            {greeting()}
            {firstName ? `, ${firstName}` : ''}
          </h1>
          <p className="dash-sub">
            {!hasHistory
              ? 'Cadastre suas oportunidades para o FoundCash mostrar onde está o dinheiro parado.'
              : summary.riskCount > 0
                ? `${summary.riskCount} de ${summary.openCount} ${summary.openCount === 1 ? 'oportunidade precisa' : 'oportunidades precisam'} de acompanhamento (${formatCurrency(summary.riskTotal)}).`
                : 'Todas as oportunidades abertas têm próximo passo marcado.'}
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openQuickEntry}>
          <Plus size={16} aria-hidden="true" /> Nova oportunidade ou PDF
        </button>
      </header>

      {hasHistory && (
        <div className="kpi-row">
          {kpis.map((kpi) => <KpiCard key={kpi.label} {...kpi} />)}
        </div>
      )}

      {!hasHistory && (
        <section className="panel empty-steps" aria-labelledby="comece-titulo">
          <h2 id="comece-titulo" className="panel-title">Como começar</h2>
          <ol className="hero-steps">
            <li>Cadastre as propostas e leads em andamento</li>
            <li>O FoundCash encontra o que ficou sem acompanhamento</li>
            <li>Você age na ordem certa e acompanha o que fechou</li>
          </ol>
        </section>
      )}

      <div className="dash-grid">
        {hasHistory && (
          <section className="panel queue" id="hoje" aria-labelledby="hoje-titulo">
            <div className="queue-head">
              <h2 id="hoje-titulo" className="panel-title">
                Fila de hoje
              </h2>
              <span>{actions.length ? `${actions.length} na fila` : 'Tudo feito'}</span>
            </div>
            <ActionQueue actions={actions} onOpen={openOpportunity} onWon={markWon} />
            {actions.length === 0 && nextPlanned && (
              <p className="queue-next">
                Próximo passo: <strong>{nextPlanned.opportunity.client_name}</strong>,{' '}
                {describeFollowUp(nextPlanned.opportunity.follow_up_on).toLowerCase()}.
              </p>
            )}
          </section>
        )}


        {summary.openCount > 0 && (
          <section className="panel flow-card" aria-labelledby="fluxo-titulo">
            <div>
              <h2 id="fluxo-titulo" className="panel-title">
                Onde está o dinheiro
              </h2>
              <p className="panel-subtitle">Toque numa etapa para ver as oportunidades dela.</p>
            </div>
            <div className="flow-bar">
              {flow.map((row, index) =>
                row.count === 0 ? null : (
                  <button
                    key={row.stage.id}
                    type="button"
                    className={`${row.riskCount > 0 ? 'has-risk' : ''} ${stageFilter === row.stage.id ? 'is-selected' : ''}`}
                    style={{ '--c': STAGE_SHADES[index], flexGrow: ready ? row.value || 1 : 0 } as CSSProperties}
                    aria-pressed={stageFilter === row.stage.id}
                    aria-label={`${row.stage.label}: ${formatCurrency(row.value)}, ${row.count} ${row.count === 1 ? 'oportunidade' : 'oportunidades'}`}
                    onClick={() => filterByStage(row.stage.id)}
                  />
                ),
              )}
            </div>
            <ul className="flow-legend">
              {flow.map((row, index) =>
                row.count === 0 ? null : (
                  <li key={row.stage.id} style={{ '--c': STAGE_SHADES[index] } as CSSProperties}>
                    {row.stage.label}
                    <b className="tabular">{formatCurrency(row.value)}</b>
                    <span>
                      {row.count} {row.count === 1 ? 'oportunidade' : 'oportunidades'}
                      {row.riskCount > 0 && <em> · {row.riskCount} em risco</em>}
                    </span>
                  </li>
                ),
              )}
            </ul>
          </section>
        )}

        {hasHistory && (
          <section className="panel reads-card" aria-labelledby="leituras-titulo">
            <h2 id="leituras-titulo" className="panel-title">
              O que o FoundCash percebeu
            </h2>
            {readings.length === 0 ? (
              <p className="panel-subtitle">
                As leituras aparecem conforme você registra etapas, contatos, vendedores e motivos de perda.
              </p>
            ) : (
              <ul className="reads">
                {readings.map((reading, index) => (
                  <li key={reading.id} className={`read read--${reading.tone} ${index === 0 ? 'is-lead' : ''}`}>
                    {index === 0 && <span className="read-tag">Mais importante</span>}
                    {reading.text}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>

      <section className="panel list-card" aria-labelledby="todas-titulo">
        <div className="panel-head">
          <h2 id="todas-titulo" className="panel-title">
            Oportunidades
          </h2>
          <div className="segmented" role="tablist" aria-label="Filtrar por resultado">
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

        {tab === 'open' && stageFilter && (
          <button type="button" className="chip chip-filter" aria-checked="true" onClick={() => setStageFilter(null)}>
            Etapa: {stageById[stageFilter].label} <X size={14} aria-label="Remover filtro" />
          </button>
        )}

        <div id="lista-oportunidades" role="tabpanel">
          {listed.length === 0 ? (
            <div className="panel-empty">
              <p>{opportunities.length === 0 ? 'Nenhuma oportunidade cadastrada ainda.' : 'Nada por aqui ainda.'}</p>
              {opportunities.length === 0 && (
                <button type="button" className="btn btn-primary" onClick={openQuickEntry}>
                  <Plus size={18} aria-hidden="true" /> Cadastrar oportunidade
                </button>
              )}
            </div>
          ) : (
            <ul className="op-list">
              {listed.map((item) => {
                const meta = projectMeta(item);
                return (
                  <li key={item.id}>
                    <button type="button" className="op-row" onClick={() => openOpportunity(item.id)}>
                      <span className="op-row-main">
                        <span className="op-row-name">{item.client_name}</span>
                        {meta && <span className="op-row-meta">{meta}</span>}
                      </span>
                      <span className="op-row-status">
                        {item.status === 'open' && (
                          <>
                            <span className="stage-tag">{stageById[item.stage].short}</span>
                            <ScoreRing score={scoreById.get(item.id) ?? 0} size="sm" />
                          </>
                        )}
                        {item.status === 'won' && item.closed_at && (
                          <span className="text-muted">Fechada em {formatDateKey(item.closed_at.slice(0, 10))}</span>
                        )}
                        {item.status === 'lost' && (
                          <Badge tone="red" withDot={false}>
                            {lossReasonLabels[item.loss_reason ?? 'outro']}
                          </Badge>
                        )}
                      </span>
                      <span className={`op-row-value tabular ${item.status === 'won' ? 'text-green' : ''}`}>
                        {formatCurrency(item.value)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      <p className="app-footnote">
        Dica: pressione <kbd>N</kbd> em qualquer tela para cadastrar uma oportunidade. Prioridade 0–100 é um indicador
        operacional calculado pelos seus dados, não uma previsão. Veja por que as vendas não fecham em{' '}
        <Link to="/app/perdas">Perdas</Link>.
      </p>
    </div>
  );
}
