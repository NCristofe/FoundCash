import { Check } from 'lucide-react';
import { pricingNote, pricingPlans, type PricingPlan } from '../../data/pricing';
import { formatNumber } from '../../utils/format';
import { Reveal } from '../common/Reveal';
import { SectionHeader } from '../common/SectionHeader';
import { StartButton } from '../common/StartButton';
import './Pricing.css';

function PlanCard({ plan }: { plan: PricingPlan }) {
  const titleId = `plano-${plan.id}`;

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
        <span className="plan-amount tabular">{formatNumber(plan.monthlyPrice)}</span>
        {plan.monthlyPrice > 0 && <span className="plan-period">/mês</span>}
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
        label={plan.ctaLabel}
        planId={plan.id}
        variant={plan.highlighted ? 'primary' : 'secondary'}
        block
        size="lg"
      />
    </article>
  );
}

export function Pricing() {
  return (
    <section id="precos" className="section pricing" aria-labelledby="precos-titulo">
      <div className="container">
        <SectionHeader
          id="precos-titulo"
          eyebrow="Preços"
          title="Comece sem complicação."
          lead="Planos simples para você começar hoje e crescer no seu ritmo."
        />

        <div className="pricing-grid">
          {pricingPlans.map((plan, index) => (
            <Reveal key={plan.id} delay={index * 120}>
              <PlanCard plan={plan} />
            </Reveal>
          ))}
        </div>

        <p className="pricing-note">{pricingNote}</p>
      </div>
    </section>
  );
}
