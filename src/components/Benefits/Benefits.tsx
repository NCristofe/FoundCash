import { benefits } from '../../data/content';
import { Reveal } from '../common/Reveal';
import { SectionHeader } from '../common/SectionHeader';
import './Benefits.css';

export function Benefits() {
  return (
    <section id="beneficios" className="section benefits" aria-labelledby="beneficios-titulo">
      <div className="container">
        <SectionHeader
          id="beneficios-titulo"
          eyebrow="Benefícios"
          title="Menos oportunidades esquecidas. Mais vendas aproveitadas."
        />

        <ul className="benefits-list">
          {benefits.map((benefit, index) => (
            <li key={benefit.label}>
              <Reveal delay={index * 100} className="benefit">
                <span className="benefit-symbol" aria-hidden="true">
                  {benefit.symbol}
                </span>
                <p className="benefit-label">{benefit.label}</p>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
