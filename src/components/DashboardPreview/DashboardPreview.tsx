import { useState } from 'react';
import {
  Bell,
  CalendarDays,
  Check,
  LayoutDashboard,
  MessageCircle,
  Settings,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';
import { attentionOpportunities, dashboardStats, opportunityTrend } from '../../data/content';
import { useUI } from '../../context/useUI';
import { useInView } from '../../hooks/useInView';
import { formatCurrency, getInitials } from '../../utils/format';
import { AreaChart } from '../common/AreaChart';
import { PriorityBadge } from '../common/Badge';
import { CountUp } from '../common/CountUp';
import { LogoMark } from '../common/Logo';
import './DashboardPreview.css';

const sidebarItems = [
  { label: 'Visão geral', icon: LayoutDashboard, active: true },
  { label: 'Oportunidades', icon: Target },
  { label: 'Clientes', icon: Users },
  { label: 'Alertas', icon: Bell },
  { label: 'Configurações', icon: Settings },
];

export function DashboardPreview() {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.1 });
  const [contacted, setContacted] = useState<ReadonlySet<string>>(() => new Set());
  const { showToast } = useUI();

  const handleContact = (id: string, client: string) => {
    setContacted((current) => new Set(current).add(id));
    showToast(`Follow-up com ${client} registrado para hoje.`);
  };

  const pending = attentionOpportunities.length - contacted.size;
  const alertExample = attentionOpportunities[0];
  const recoveredStat = dashboardStats.find((stat) => stat.id === 'recovered');

  return (
    <div className="dash-wrapper" ref={ref}>
      <div className="dash-glow" aria-hidden="true" />

      <section className="dash" aria-label="Prévia do painel do FoundCash">
        <div className="dash-topbar" aria-hidden="true">
          <span className="dash-dots">
            <i />
            <i />
            <i />
          </span>
          <span className="dash-url">app.foundcash.com.br/visao-geral</span>
        </div>

        <div className="dash-body">
          <aside className="dash-sidebar" aria-hidden="true">
            <LogoMark size={26} />
            <ul>
              {sidebarItems.map(({ label, icon: Icon, active }) => (
                <li key={label} className={active ? 'is-active' : ''} title={label}>
                  <Icon size={17} />
                </li>
              ))}
            </ul>
          </aside>

          <div className="dash-main">
            <header className="dash-header">
              <div>
                <p className="dash-kicker">Visão geral</p>
                <p className="dash-greeting">
                  Boa tarde, João{' '}
                  <span role="img" aria-label="aceno">
                    👋
                  </span>
                </p>
              </div>
              <span className="dash-period" aria-hidden="true">
                <CalendarDays size={14} /> Esta semana
              </span>
            </header>

            <ul className="dash-stats">
              {dashboardStats.map(({ id, label, value, format, tone, icon: Icon, hint }) => (
                <li key={id} className={`dash-stat dash-stat--${tone}`}>
                  <span className="dash-stat-icon" aria-hidden="true">
                    <Icon size={14} />
                  </span>
                  <span className="dash-stat-label">{label}</span>
                  <CountUp className="dash-stat-value" value={value} format={format} start={inView} />
                  <span className="dash-stat-hint">{hint}</span>
                </li>
              ))}
            </ul>

            <div className="dash-chart">
              <div className="dash-panel-head">
                <p className="dash-panel-title">Oportunidades abertas</p>
                <span className="dash-trend">
                  <TrendingUp size={13} aria-hidden="true" /> +12,4%
                </span>
              </div>
              <AreaChart
                values={opportunityTrend.values}
                labels={opportunityTrend.labels}
                drawn={inView}
                height={78}
                ariaLabel="Valor em oportunidades abertas subiu de R$ 11.200 para R$ 18.450 ao longo da semana."
              />
            </div>

            <div className="dash-attention">
              <div className="dash-panel-head">
                <p className="dash-panel-title">Oportunidades que precisam de atenção</p>
                <span className="dash-count">
                  {pending}
                  <span className="sr-only"> pendentes</span>
                </span>
              </div>

              <ul className="dash-list">
                {attentionOpportunities.map((opportunity) => {
                  const isContacted = contacted.has(opportunity.id);
                  return (
                    <li key={opportunity.id} className={`dash-item ${isContacted ? 'is-done' : ''}`}>
                      <span className="dash-avatar" aria-hidden="true">
                        {getInitials(opportunity.client)}
                      </span>
                      <div className="dash-item-info">
                        <p className="dash-item-name">{opportunity.client}</p>
                        <p className="dash-item-service">{opportunity.service}</p>
                      </div>
                      <p className="dash-item-value tabular">{formatCurrency(opportunity.value)}</p>
                      <div className="dash-item-status">
                        <PriorityBadge priority={opportunity.priority} />
                        <span className="dash-item-days">
                          {opportunity.daysWithoutReply} {opportunity.daysWithoutReply === 1 ? 'dia' : 'dias'} sem
                          resposta
                        </span>
                      </div>
                      <button
                        type="button"
                        className="dash-item-action"
                        onClick={() => handleContact(opportunity.id, opportunity.client)}
                        disabled={isContacted}
                        aria-label={
                          isContacted
                            ? `Contato com ${opportunity.client} registrado`
                            : `Entrar em contato com ${opportunity.client}`
                        }
                      >
                        {isContacted ? (
                          <>
                            <Check size={14} aria-hidden="true" /> Registrado
                          </>
                        ) : (
                          <>
                            <MessageCircle size={14} aria-hidden="true" /> Entrar em contato
                          </>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <div className="dash-float dash-float--alert" aria-hidden="true">
        <span className="dash-float-icon">
          <Bell size={15} />
        </span>
        <span>
          <strong>{alertExample.client}</strong>
          <small>
            {alertExample.daysWithoutReply} dias sem resposta · {formatCurrency(alertExample.value)}
          </small>
        </span>
      </div>

      <div className="dash-float dash-float--recovered" aria-hidden="true">
        <span className="dash-float-icon">
          <TrendingUp size={15} />
        </span>
        <span>
          <small>Recuperado este mês</small>
          <strong>+ {formatCurrency(recoveredStat?.value ?? 0)}</strong>
        </span>
      </div>
    </div>
  );
}
