import { useAuth } from '../../auth/useAuth';
import { lossReasonLabels } from '../../config/niche';
import { formatDateKey } from '../../utils/dates';
import { formatCurrency } from '../../utils/format';
import { ProLock } from '../components/ProLock';
import { lossReport } from '../metrics';
import { useAppData } from '../state/useAppData';

/** Relatório avançado de perdas (plano Pro): quanto se perde e por quê. */
export function LossesPage() {
  const { profile } = useAuth();
  const { opportunities, openOpportunity } = useAppData();

  const header = (
    <header className="page-head">
      <div>
        <p className="page-kicker">Relatório de perdas</p>
        <h1 className="page-title">Por que as propostas não fecham</h1>
      </div>
    </header>
  );

  if (profile?.plan !== 'pro') {
    return (
      <div className="losses">
        {header}
        <ProLock feature="O relatório de perdas" />
      </div>
    );
  }

  const report = lossReport(opportunities);
  const maxValue = Math.max(1, ...report.reasons.map((item) => item.value));

  return (
    <div className="losses">
      {header}

      <dl className="report-stats panel">
        <div>
          <dt>Valor perdido</dt>
          <dd className="tabular">{formatCurrency(report.total)}</dd>
        </div>
        <div>
          <dt>Propostas perdidas</dt>
          <dd className="tabular">{report.count}</dd>
        </div>
        <div>
          <dt>Taxa de perda (das fechadas)</dt>
          <dd className="tabular">{report.lossRate}%</dd>
        </div>
      </dl>

      <section className="panel" aria-labelledby="motivos-titulo">
        <h2 id="motivos-titulo" className="panel-title">
          Valor perdido por motivo
        </h2>
        {report.reasons.length === 0 ? (
          <p className="text-muted">Nenhuma proposta perdida registrada. Ótimo sinal.</p>
        ) : (
          <ul className="loss-bars">
            {report.reasons.map((item) => (
              <li key={item.reason}>
                <div className="loss-bars-label">
                  <span>{lossReasonLabels[item.reason]}</span>
                  <span className="tabular">
                    {formatCurrency(item.value)} · {item.count}
                  </span>
                </div>
                <div className="loss-bars-track" aria-hidden="true">
                  <span style={{ width: `${(item.value / maxValue) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {report.recent.length > 0 && (
        <section className="panel" aria-labelledby="recentes-titulo">
          <h2 id="recentes-titulo" className="panel-title">
            Perdas recentes
          </h2>
          <ul className="op-list">
            {report.recent.map((item) => (
              <li key={item.id}>
                <button type="button" className="op-row" onClick={() => openOpportunity(item.id)}>
                  <span className="op-row-name">{item.client_name}</span>
                  <span className="op-row-status text-muted">
                    {lossReasonLabels[item.loss_reason ?? 'outro']}
                    {item.closed_at ? ` · ${formatDateKey(item.closed_at.slice(0, 10))}` : ''}
                  </span>
                  <span className="op-row-value tabular">{formatCurrency(item.value)}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
