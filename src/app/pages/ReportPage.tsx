import { useEffect, useState } from 'react';
import { Mail } from 'lucide-react';
import { useAuth } from '../../auth/useAuth';
import { useUI } from '../../context/useUI';
import { friendlyError } from '../../lib/supabase';
import type { MonthlyReport } from '../../lib/types';
import { currentMonthLabel, formatMonth } from '../../utils/dates';
import { formatCurrency } from '../../utils/format';
import { recoveredThisMonth, subscriptionRoi } from '../metrics';
import { fetchMonthlyReports } from '../services/api';
import { useAppData } from '../state/useAppData';

const formatRoi = (roi: number) => `${roi.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}x`;

export function ReportPage() {
  const { profile, updateProfile } = useAuth();
  const { opportunities } = useAppData();
  const { showToast } = useUI();
  const [reports, setReports] = useState<MonthlyReport[] | null>(null);

  useEffect(() => {
    fetchMonthlyReports()
      .then(setReports)
      .catch(() => setReports([]));
  }, []);

  if (!profile) return null;

  const recovered = recoveredThisMonth(opportunities);
  const { cost, roi } = subscriptionRoi(recovered.total, profile);
  const month = currentMonthLabel();

  const toggleOptIn = async () => {
    try {
      await updateProfile({ monthly_report_opt_in: !profile.monthly_report_opt_in });
      showToast(profile.monthly_report_opt_in ? 'Relatório mensal desativado.' : 'Relatório mensal ativado.');
    } catch (error) {
      showToast(friendlyError(error), 'error');
    }
  };

  return (
    <div className="report">
      <header className="page-head">
        <div>
          <p className="page-kicker">Relatório</p>
          <h1 className="page-title">Seu retorno em {month}</h1>
        </div>
      </header>

      <section className="report-hero panel" aria-label="Resumo do mês">
        <p className="report-sentence">
          Neste mês, você recuperou <strong className="text-green">{formatCurrency(recovered.total)}</strong> com a
          ajuda do FoundCash. Sua assinatura custa <strong>{formatCurrency(cost)}</strong>.{' '}
          {recovered.total > 0 ? (
            <>
              Seu retorno sobre o investimento foi de <strong className="text-green">{formatRoi(roi)}</strong>.
            </>
          ) : (
            'Quando uma proposta virar venda, marque “Fechou negócio” para ela entrar aqui.'
          )}
        </p>
        <dl className="report-stats">
          <div>
            <dt>Valor recuperado</dt>
            <dd className="text-green tabular">{formatCurrency(recovered.total)}</dd>
          </div>
          <div>
            <dt>Vendas recuperadas</dt>
            <dd className="tabular">{recovered.count}</dd>
          </div>
          <div>
            <dt>Custo mensal</dt>
            <dd className="tabular">{formatCurrency(cost)}</dd>
          </div>
          <div>
            <dt>Retorno</dt>
            <dd className="tabular">{recovered.total > 0 ? formatRoi(roi) : '—'}</dd>
          </div>
        </dl>
      </section>

      <section className="panel report-email" aria-labelledby="email-titulo">
        <Mail size={22} aria-hidden="true" />
        <div>
          <h2 id="email-titulo" className="panel-title">
            Relatório por e-mail no dia 1º
          </h2>
          <p className="text-muted">
            Todo início de mês você recebe o resumo do mês anterior: quanto recuperou, quanto pagou e o seu retorno.
          </p>
        </div>
        <label className="switch">
          <input type="checkbox" checked={profile.monthly_report_opt_in} onChange={toggleOptIn} />
          <span aria-hidden="true" />
          <span className="sr-only">Receber relatório mensal por e-mail</span>
        </label>
      </section>

      <section className="panel" aria-labelledby="historico-titulo">
        <h2 id="historico-titulo" className="panel-title">
          Meses anteriores
        </h2>
        {reports === null ? (
          <p className="text-muted">Carregando…</p>
        ) : reports.length === 0 ? (
          <p className="text-muted">O primeiro relatório será gerado no dia 1º do próximo mês.</p>
        ) : (
          <div className="table-wrap">
            <table className="report-table">
              <thead>
                <tr>
                  <th scope="col">Mês</th>
                  <th scope="col">Recuperado</th>
                  <th scope="col">Vendas</th>
                  <th scope="col">Assinatura</th>
                  <th scope="col">Retorno</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id}>
                    <th scope="row">{formatMonth(report.month)}</th>
                    <td className="text-green tabular">{formatCurrency(report.recovered)}</td>
                    <td className="tabular">{report.recovered_count}</td>
                    <td className="tabular">{formatCurrency(report.subscription_cost)}</td>
                    <td className="tabular">{formatRoi(report.roi)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
