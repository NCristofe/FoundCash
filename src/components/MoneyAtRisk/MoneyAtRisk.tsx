import type { CSSProperties } from 'react';
import { moneyAtRisk } from '../../data/content';
import { useInView } from '../../hooks/useInView';
import { formatCurrency, formatPercent } from '../../utils/format';
import { CountUp } from '../common/CountUp';
import { SectionHeader } from '../common/SectionHeader';
import './MoneyAtRisk.css';

export function MoneyAtRisk() {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.3 });
  const { total, weeklyChange, breakdown, weekly } = moneyAtRisk;
  const maxWeekly = Math.max(...weekly.map((week) => week.value));
  const first = weekly[0];
  const last = weekly[weekly.length - 1];

  return (
    <section className="section money" aria-labelledby="dinheiro-titulo">
      <div className="container">
        <SectionHeader
          id="dinheiro-titulo"
          eyebrow="Dinheiro em risco"
          title="Veja quanto dinheiro está parado."
          lead="Cada orçamento aberto é uma oportunidade. O FoundCash soma tudo e mostra onde agir primeiro."
        />

        <div ref={ref} className={`money-panel surface ${inView ? 'is-active' : ''}`}>
          <div className="money-summary">
            <p className="money-label">Dinheiro em oportunidades</p>
            <CountUp className="money-total" value={total} format="currency" start={inView} duration={1500} />
            <p className="money-change">
              <strong>↑ {formatPercent(weeklyChange)}</strong> esta semana
            </p>

            <ul className="money-breakdown">
              {breakdown.map((item) => (
                <li key={item.id} className={`money-item money-item--${item.tone}`}>
                  <span className="money-item-value tabular">{formatCurrency(item.value)}</span>
                  <span className="money-item-label">{item.label}</span>
                  <span className="money-item-bar" aria-hidden="true">
                    <span style={{ '--fill': `${(item.value / total) * 100}%` } as CSSProperties} />
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <figure
            className="money-chart"
            role="img"
            aria-label={`Evolução das oportunidades nas últimas ${weekly.length} semanas: de ${formatCurrency(
              first.value,
            )} para ${formatCurrency(last.value)}.`}
          >
            <figcaption className="money-chart-head" aria-hidden="true">
              <span>Evolução das oportunidades</span>
              <span className="money-chart-period">Últimas {weekly.length} semanas</span>
            </figcaption>
            <div className="money-bars" aria-hidden="true">
              {weekly.map((week, index) => {
                const isLast = index === weekly.length - 1;
                return (
                  <div key={week.label} className={`money-bar ${isLast ? 'is-current' : ''}`}>
                    {isLast && <span className="money-bar-tip tabular">{formatCurrency(week.value)}</span>}
                    <span
                      className="money-bar-fill"
                      style={
                        {
                          '--height': `${(week.value / maxWeekly) * 100}%`,
                          '--bar-delay': `${index * 70}ms`,
                        } as CSSProperties
                      }
                    />
                    <span className="money-bar-label">{week.label}</span>
                  </div>
                );
              })}
            </div>
          </figure>
        </div>
      </div>
    </section>
  );
}
