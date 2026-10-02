import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { AlertTriangle, Eye, FileUp, Plus, TrendingUp, Wallet, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '../../auth/useAuth';
import { Badge } from '../../components/common/Badge';
import { CountUp } from '../../components/common/CountUp';
import { ACTIONS_COUNT } from '../../config/app';
import { lossReasonLabels, stageById } from '../../config/niche';
import { useUI } from '../../context/useUI';
import { friendlyError } from '../../lib/supabase';
import type { Opportunity, OpportunityStatus, Stage } from '../../lib/types';
import { Link } from '../../router/Link';
import { currentMonthLabel, describeFollowUp, formatDateKey } from '../../utils/dates';
import { formatCurrency } from '../../utils/format';
import { ActionDeck } from '../components/ActionDeck';
import { burst, RadarLoader, ScoreRing } from '../components/RadarUI';
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
const STAGE_SHADES = ['#1b3a31', '#155a44', '#0b6b4c', '#0c8660', '#0fa372', '#22bd89', '#34d8a0'];

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
    <article className={`kpi-card spot enter${tone ? ` kpi-card--${tone}` : ''}`}>
      <span className="kpi-icon" aria-hidden="true"><Icon size={15} /></span>
      <span className="kpi-label">{label}</span>
      <span className="kpi-value">{display}</span>
      <span className="kpi-hint">{hint}</span>
    </article>
  );
}

/** Luz que segue o cursor nos cartões `.spot` e leve inclinação nos `.tilt`. */
function useSpotlight() {
  const last = useRef<HTMLElement | null>(null);
  const reset = (card: HTMLElement | null) => {
    if (!card) return;
    card.style.removeProperty('--mx');
    card.style.removeProperty('transform');
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse') return;
    const card = (event.target as HTMLElement).closest<HTMLElement>('.spot');
    if (card !== last.current) {
      reset(last.current);
      last.current = card;
    }
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    card.style.setProperty('--mx', `${x}px`);
    card.style.setProperty('--my', `${y}px`);
    if (card.classList.contains('tilt') && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const rotateX = (y / rect.height - 0.5) * -6;
      const rotateY = (x / rect.width - 0.5) * 6;
      card.style.transform = `perspective(700px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-2px)`;
    }
  };
  const onPointerLeave = () => {
    reset(last.current);
    last.current = null;
  };
  return { onPointerMove, onPointerLeave };
}

export function DashboardPage() {
  const { profile } = useAuth();
  const { opportunities, proposalLinks, loading, error, reload, openQuickEntry, openOpportunity, updateOpportunity } =
    useAppData();
  const { showToast } = useUI();
  const [tab, setTab] = useState<OpportunityStatus>('open');
  const [stageFilter, setStageFilter] = useState<Stage | null>(null);
  const [ready, setReady] = useState(false);
  const burstRef = useRef<HTMLCanvasElement>(null);
  const spotlight = useSpotlight();

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
  const riskShare = summary.openTotal > 0 ? summary.riskTotal / summary.openTotal : 0;
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
      burst(burstRef.current);
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
    <div className="dashboard" {...spotlight}>
      <header className="dash-greet enter">
        <h1 className="page-title">
          {greeting()}
          {firstName ? `, ${firstName}` : ''}
        </h1>
        <span className="live">Radar atualizado agora</span>
      </header>

      {hasHistory && (
        <div className="kpi-row">
          {kpis.map((kpi) => <KpiCard key={kpi.label} {...kpi} />)}
        </div>
      )}

      <div className="dash-grid">
        <section className={`hero-card enter ${summary.riskCount > 0 ? '' : 'is-calm'}`} aria-labelledby="hero-titulo">
          <canvas className="hero-burst" ref={burstRef} aria-hidden="true" />
          {!hasHistory ? (
            <>
              <div>
                <p className="hero-label" id="hero-titulo">
                  Seu radar está pronto
                </p>
                <p className="hero-title">Cadastre suas oportunidades e veja onde está o dinheiro parado.</p>
              </div>
              <ol className="hero-steps">
                <li>Cadastre as propostas e leads em andamento</li>
                <li>O FoundCash encontra o que ficou sem acompanhamento</li>
                <li>Você age na ordem certa e acompanha o que fechou</li>
              </ol>
              <div className="hero-actions">
                <button type="button" className="hero-btn" onClick={openQuickEntry}>
                  <Plus size={18} aria-hidden="true" /> Cadastrar oportunidade
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="hero-top">
                <div>
                  <p className="hero-label" id="hero-titulo">
                    {summary.riskCount > 0 ? 'Dinheiro sem acompanhamento' : 'Dinheiro em jogo'}
                  </p>
                  <CountUp
                    className="hero-value"
                    value={summary.riskCount > 0 ? summary.riskTotal : summary.openTotal}
                    format="currency"
                    start
                  />
                  <p className="hero-sub">
                    {summary.riskCount > 0
                      ? `${summary.riskCount} de ${summary.openCount} ${summary.openCount === 1 ? 'oportunidade precisa' : 'oportunidades precisam'} de você`
                      : summary.openCount > 0
                        ? `Todas as ${summary.openCount} oportunidades abertas têm próximo passo marcado`
                        : 'Nenhuma oportunidade aberta agora'}
                  </p>
                </div>
                <span className={`hero-chip ${summary.riskCount > 0 ? 'is-warn' : ''}`}>
                  {summary.riskCount > 0 ? `${summary.riskCount} em risco` : 'Tudo em dia'}
                </span>
              </div>
              {summary.openCount > 0 && (
                <div className="hero-meter">
                  <div className="hero-meter-track">
                    <span className="hero-meter-fill" style={{ width: ready ? `${riskShare * 100}%` : 0 }} />
                  </div>
                  <div className="hero-meter-legend tabular">
                    <span>{formatCurrency(summary.riskTotal)} em risco</span>
                    <span>{formatCurrency(summary.openTotal)} em jogo</span>
                  </div>
                </div>
              )}
              <div className="hero-actions">
                {actions.length > 0 && (
                  <a className="hero-btn" href="#hoje">
                    Ver o que fazer hoje
                  </a>
                )}
                <button type="button" className="hero-btn-glass" onClick={openQuickEntry}>
                  <FileUp size={16} aria-hidden="true" /> Nova oportunidade ou PDF
                </button>
              </div>
            </>
          )}
        </section>

        {hasHistory && (
          <section className="spot queue enter" id="hoje" aria-labelledby="hoje-titulo" style={{ '--d': '80ms' } as CSSProperties}>
            <div className="queue-head">
              <h2 id="hoje-titulo" className="panel-title">
                Fila de hoje
              </h2>
              <span>{actions.length ? `${actions.length} na fila` : 'Tudo feito'}</span>
            </div>
            <ActionDeck actions={actions} onOpen={openOpportunity} onWon={markWon} />
            {actions.length === 0 && nextPlanned && (
              <p className="queue-next">
                Próximo passo: <strong>{nextPlanned.opportunity.client_name}</strong>,{' '}
                {describeFollowUp(nextPlanned.opportunity.follow_up_on).toLowerCase()}.
              </p>
            )}
          </section>
        )}


        {summary.openCount > 0 && (
          <section className="spot flow-card enter" aria-labelledby="fluxo-titulo" style={{ '--d': '320ms' } as CSSProperties}>
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
          <section className="spot reads-card enter" aria-labelledby="leituras-titulo" style={{ '--d': '380ms' } as CSSProperties}>
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
