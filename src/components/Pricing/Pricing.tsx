import { useState } from 'react';
import { Check } from 'lucide-react';
import {
  billingCycleLabels,
  maxAnnualDiscount,
  priceFor,
  pricingNote,
  pricingPlans,
  trialCtaLabel,
  type BillingCycle,
  type PricingPlan,
} from '../../data/pricing';
import { formatNumber } from '../../utils/format';
import { Reveal } from '../common/Reveal';
import { SectionHeader } from '../common/SectionHeader';
import { StartButton } from '../common/StartButton';
import './Pricing.css';

const cycles: BillingCycle[] = ['monthly', 'annual'];

function PlanCard({ plan, cycle }: { plan: PricingPlan; cycle: BillingCycle }) {
  const titleId = `plano-${plan.id}`;
  const price = priceFor(plan, cycle);

  return (
    <article className={`plan ${plan.highlighted ? 'plan--highlighted' : ''}`} aria-labelledby={titleId}>
      <header className="plan-head">
        <h3 id={titleId} className="plan-name">
          {plan.name}
        </h3>
        {plan.badge && <span className="plan-badge">{plan.badge}</span>}
      </header>

      <p className="plan-price">
        <span className="plan-currency">R$</span>
        <span className="plan-amount tabular">{formatNumber(price)}</span>
        <span className="plan-period">/mês</span>
      </p>
      <p className="plan-billing">
        {cycle === 'annual'
          ? `Cobrado anualmente (R$ ${formatNumber(price * 12)}/ano)`
          : `ou R$ ${formatNumber(plan.annualMonthlyPrice)}/mês no plano anual`}
      </p>
      <p className="plan-description">{plan.description}</p>

      <ul className="plan-features">
        {plan.features.map((feature) => (
          <li key={feature}>
            <Check size={17} aria-hidden="true" />
            {feature}
          </li>
        ))}
      </ul>

      <StartButton
        label={trialCtaLabel}
        planId={plan.id}
        cycle={cycle}
        variant={plan.highlighted ? 'primary' : 'secondary'}
        block
        size="lg"
      />
    </article>
  );
}

export function Pricing() {
  const [cycle, setCycle] = useState<BillingCycle>('monthly');

  return (
    <section id="precos" className="section pricing" aria-labelledby="precos-titulo">
      <div className="container">
        <SectionHeader
          id="precos-titulo"
          eyebrow="Preços"
          title="Uma proposta recuperada paga meses de FoundCash."
          lead="Comece com 14 dias grátis. Escolha o plano depois de ver o dinheiro que estava parado."
        />

        <div className="pricing-toggle" role="radiogroup" aria-label="Ciclo de cobrança">
          {cycles.map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={cycle === option}
              className={cycle === option ? 'is-active' : ''}
              onClick={() => setCycle(option)}
            >
              {billingCycleLabels[option]}
              {option === 'annual' && <span className="pricing-save">até −{maxAnnualDiscount}%</span>}
            </button>
          ))}
        </div>

        <div className="pricing-grid">
          {pricingPlans.map((plan, index) => (
            <Reveal key={plan.id} delay={index * 120}>
              <PlanCard plan={plan} cycle={cycle} />
            </Reveal>
          ))}
        </div>

        <p className="pricing-note">{pricingNote}</p>
      </div>
    </section>
  );
}
