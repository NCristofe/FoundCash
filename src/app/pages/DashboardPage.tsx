import { useMemo, useState } from 'react';
import { ArrowRight, MessageCircle, Plus, X } from 'lucide-react';
import { useAuth } from '../../auth/useAuth';
import { Badge } from '../../components/common/Badge';
import { CountUp } from '../../components/common/CountUp';
import { ACTIONS_COUNT } from '../../config/app';
import { builtInTemplates, fillTemplate, lossReasonLabels, stageById } from '../../config/niche';
import { PLAN_PRICING } from '../../../supabase/functions/_shared/plans.ts';
import type { Opportunity, OpportunityStatus, Stage } from '../../lib/types';
import { Link } from '../../router/Link';
import { currentMonthLabel, describeFollowUp, formatDateKey } from '../../utils/dates';
import { formatCurrency } from '../../utils/format';
import { whatsappLink } from '../../utils/parsing';
import { RadarLoader, RadarScope, SignalMeter } from '../components/RadarUI';
import { recoveredThisMonth, subscriptionRoi } from '../metrics';
import {
  analyze,
  conversion,
  insights as buildInsights,
  MIN_CLOSED_FOR_CONVERSION,
  pipelineByStage,
  radarSummary,
  todayActions,
} from '../radar';
import { useAppData } from '../state/useAppData';

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

function quickMessage(opportunity: Opportunity): string {
  const firstName = opportunity.client_name.startsWith('WhatsApp') ? '' : opportunity.client_name.split(' ')[0];
  return fillTemplate(builtInTemplates[0].body, {
    cliente: firstName,
    valor: formatCurrency(opportunity.value),
  }).replace(/,\s*!/g, '!');
}

function projectMeta(item: Opportunity): string {
  return [item.city, item.system_kwp ? `${item.system_kwp.toLocaleString('pt-BR')} kWp` : null, item.seller]
    .filter(Boolean)
    .join(' · ');
}

const tabs: Array<{ status: OpportunityStatus; label: string }> = [
  { status: 'open', label: 'Abertas' },
  { status: 'won', label: 'Fechadas' },
  { status: 'lost', label: 'Perdidas' },
];

export function DashboardPage() {
  const { profile } = useAuth();
  const { opportunities, proposalLinks, loading, error, reload, openQuickEntry, openOpportunity } = useAppData();
  const [tab, setTab] = useState<OpportunityStatus>('open');
  const [stageFilter, setStageFilter] = useState<Stage | null>(null);

  const analyses = useMemo(() => analyze(opportunities, proposalLinks), [opportunities, proposalLinks]);

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
  const { cost, roi } = subscriptionRoi(recovered.total, profile);
  const conv = conversion(opportunities);
  const openLimit = PLAN_PRICING[profile.plan].openLimit;
  const firstName = profile.full_name.split(' ')[0];
  const riskShare = summary.openTotal > 0 ? Math.round((summary.riskTotal / summary.openTotal) * 100) : 0;
  const scoreById = new Map(analyses.map((item) => [item.opportunity.id, item.score]));
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

  return (
    <div className="dashboard">
      <header className="page-head">
        <div>
          <p className="page-kicker">
            <span className="live-dot" aria-hidden="true" /> Radar comercial{profile.business_name ? ` · ${profile.business_name}` : ''}</p>
          <h1 className="page-title">
            {greeting()}
            {firstName ? `, ${firstName}` : ''}
          </h1>
        </div>
      </header>

      <section className={`radar-hero ${summary.riskCount > 0 ? 'is-alert' : ''}`} aria-labelledby="radar-titulo">
        <div className="radar-hero-copy">
          {summary.openCount === 0 ? (
            <>
              <p className="radar-hero-label" id="radar-titulo">
                Radar vazio
              </p>
              <p className="radar-hero-title">Cadastre suas oportunidades e o FoundCash mostra onde está o dinheiro parado.</p>
              <ol className="radar-steps">
                <li>Cadastre as propostas e leads em andamento.</li>
                <li>O radar encontra o que ficou sem acompanhamento.</li>
                <li>Você age na ordem certa e acompanha o que recuperou.</li>
              </ol>
              <button type="button" className="btn btn-primary" onClick={openQuickEntry}>
                <Plus size={18} aria-hidden="true" /> Cadastrar oportunidade
              </button>
            </>
          ) : summary.riskCount > 0 ? (
            <>
              <p className="radar-hero-label" id="radar-titulo">
                Dinheiro sem acompanhamento
              </p>
              <CountUp className="radar-hero-value is-risk" value={summary.riskTotal} format="currency" start />
              <p className="radar-hero-text">
                {summary.riskCount === 1
                  ? '1 oportunidade mostra'
                  : `${summary.riskCount} de ${summary.openCount} oportunidades mostram`}{' '}
                sinais de abandono: follow-up vencido, proposta sem retorno ou etapa que não avança.
              </p>
              <a className="btn btn-primary" href="#hoje">
                Ver o que fazer hoje <ArrowRight className="icon-arrow" size={18} aria-hidden="true" />
              </a>
            </>
          ) : (
            <>
              <p className="radar-hero-label is-ok" id="radar-titulo">
                Nenhuma oportunidade esquecida
              </p>
              <CountUp className="radar-hero-value" value={summary.openTotal} format="currency" start />
              <p className="radar-hero-text">
                Todas as {summary.openCount} oportunidades abertas têm um próximo passo marcado. O radar avisa quando alguma
                esfriar.
              </p>
            </>
          )}
        </div>
        {summary.openCount > 0 && (
          <figure className="radar-hero-scope">
            <RadarScope analyses={analyses} />
            <figcaption>
              <span className="legend legend--risk">Sem acompanhamento</span>
              <span className="legend legend--hot">Cliente engajado</span>
              <span className="legend legend--ok">Em dia</span>
              <span className="radar-caption-note">Distância do centro = dias sem contato</span>
            </figcaption>
          </figure>
        )}
      </section>

      {summary.openCount > 0 && (
        <dl className="meters" aria-label="Números da operação">
          <div className="meter">
            <dt>Dinheiro em jogo</dt>
            <dd className="meter-value tabular">{formatCurrency(summary.openTotal)}</dd>
            <dd className="meter-foot">
              {summary.openCount} {summary.openCount === 1 ? 'oportunidade aberta' : 'oportunidades abertas'}
              {openLimit !== null && summary.openCount >= openLimit * 0.9 && (
                <span className="text-warning"> · limite do plano: {openLimit}</span>
              )}
            </dd>
          </div>
          <div className={`meter ${summary.riskTotal > 0 ? 'meter--risk' : ''}`}>
            <dt>Em risco</dt>
            <dd className="meter-value tabular">{formatCurrency(summary.riskTotal)}</dd>
            <dd className="meter-foot">{summary.riskTotal > 0 ? `${riskShare}% do dinheiro em jogo` : 'Nada em risco agora'}</dd>
          </div>
          <div className="meter meter--won">
            <dt>Fechado em {currentMonthLabel()}</dt>
            <dd className="meter-value tabular">{formatCurrency(recovered.total)}</dd>
            <dd className="meter-foot">
              {recovered.total > 0
                ? `${recovered.count} ${recovered.count === 1 ? 'venda' : 'vendas'} · ${roi.toLocaleString('pt-BR')}x a assinatura (${formatCurrency(cost)})`
                : 'Marque “Fechou negócio” quando uma venda sair.'}
            </dd>
          </div>
          <div className="meter">
            <dt>Conversão</dt>
            <dd className="meter-value tabular">{conv.rate === null ? '—' : `${conv.rate}%`}</dd>
            <dd className="meter-foot">
              {conv.rate === null
                ? `Aparece com ${MIN_CLOSED_FOR_CONVERSION} negócios encerrados (${conv.closed} até agora)`
                : `das ${conv.closed} oportunidades encerradas`}
            </dd>
          </div>
        </dl>
      )}

      {summary.openCount > 0 && (
        <div className="dash-grid">
          <section className="panel panel--actions" id="hoje" aria-labelledby="hoje-titulo">
            <div className="panel-head">
              <div>
                <h2 id="hoje-titulo" className="panel-title">
                  O que fazer hoje
                </h2>
                <p className="panel-subtitle">Em ordem de prioridade, pelo que está cadastrado.</p>
              </div>
            </div>

            {actions.length === 0 ? (
              <div className="panel-empty">
                <p>Nada pendente hoje.</p>
                {nextPlanned && (
                  <p>
                    Próximo passo: <strong>{nextPlanned.opportunity.client_name}</strong> —{' '}
                    {describeFollowUp(nextPlanned.opportunity.follow_up_on).toLowerCase()}.
                  </p>
                )}
              </div>
            ) : (
              <ol className="action-list">
                {actions.map(({ opportunity: item, score, action, atRisk }) => (
                  <li key={item.id} className={`action ${atRisk ? 'is-risk' : 'is-hot'}`}>
                    <SignalMeter score={score} />
                    <div className="action-copy">
                      <p className="action-title">{action?.title}</p>
                      <p className="action-detail">{action?.detail}</p>
                    </div>
                    <div className="action-buttons">
                      {item.whatsapp && (
                        <a
                          className="btn btn-primary btn-sm"
                          href={whatsappLink(item.whatsapp, quickMessage(item))}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`Chamar ${item.client_name} no WhatsApp`}
                        >
                          <MessageCircle size={16} aria-hidden="true" />
                          <span className="app-hide-mobile">WhatsApp</span>
                        </a>
                      )}
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => openOpportunity(item.id)}
                        aria-label={`Abrir oportunidade de ${item.client_name}`}
                      >
                        Abrir
                      </button>
                    </div>
                  </li>
                ))}
              </ol>
            )}
            <p className="score-note">
              Prioridade 0–100: indicador operacional calculado pelo valor, etapa, interesse, respostas do cliente e atrasos.
              Não é previsão de fechamento.
            </p>
          </section>

          <section className="panel panel--insights" aria-labelledby="leituras-titulo">
            <h2 id="leituras-titulo" className="panel-title">
              Leituras do radar
            </h2>
            {readings.length === 0 ? (
              <p className="panel-empty">
                As leituras aparecem conforme você registra etapas, contatos, vendedores e motivos de perda.
              </p>
            ) : (
              <ul className="insight-list">
                {readings.map((reading) => (
                  <li key={reading.id} className={`insight insight--${reading.tone}`}>
                    {reading.text}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      {summary.openCount > 0 && (
        <section className="panel" aria-labelledby="pipeline-titulo">
          <div className="panel-head">
            <div>
              <h2 id="pipeline-titulo" className="panel-title">
                Fluxo comercial
              </h2>
              <p className="panel-subtitle">Toque numa etapa para ver as oportunidades dela.</p>
            </div>
          </div>
          <div className="flow-scroll">
            <ol className="flow">
              {flow.map((row) => (
                <li key={row.stage.id}>
                  <button
                    type="button"
                    className={`flow-node ${row.count === 0 ? 'is-empty' : ''} ${stageFilter === row.stage.id ? 'is-selected' : ''}`}
                    aria-pressed={stageFilter === row.stage.id}
                    onClick={() => filterByStage(row.stage.id)}
                    disabled={row.count === 0}
                  >
                    <span className="flow-label">{row.stage.label}</span>
                    <span className="flow-value tabular">{formatCurrency(row.value)}</span>
                    <span className="flow-count">
                      {row.count} {row.count === 1 ? 'oportunidade' : 'oportunidades'}
                    </span>
                    {row.riskCount > 0 && <span className="flow-risk">{row.riskCount} em risco</span>}
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      <section className="panel" aria-labelledby="todas-titulo">
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
                            <SignalMeter score={scoreById.get(item.id) ?? 0} showValue={false} />
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
        Dica: pressione <kbd>N</kbd> em qualquer tela para cadastrar uma oportunidade. Veja por que as vendas não fecham em{' '}
        <Link to="/app/perdas">Perdas</Link>.
      </p>
    </div>
  );
}
