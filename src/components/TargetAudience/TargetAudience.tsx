import { audiences } from '../../data/content';
import { Reveal } from '../common/Reveal';
import { SectionHeader } from '../common/SectionHeader';
import './TargetAudience.css';

export function TargetAudience() {
  return (
    <section className="section audience" aria-labelledby="publico-titulo">
      <div className="container">
        <SectionHeader
          id="publico-titulo"
          eyebrow="Para quem é"
          title="Feito para quem vende energia solar."
          lead="Propostas de alto valor e decisão demorada: é exatamente onde um follow-up bem feito muda o resultado."
        />

        <ul className="audience-grid">
          {audiences.map(({ title, description, icon: Icon }, index) => (
            <li key={title}>
              <Reveal delay={(index % 3) * 90} className="audience-reveal">
                <article className="audience-card">
                  <span className="audience-icon" aria-hidden="true">
                    <Icon size={20} />
                  </span>
                  <div>
                    <h3 className="audience-title">{title}</h3>
                    <p className="audience-text">{description}</p>
                  </div>
                </article>
              </Reveal>
            </li>
          ))}
        </ul>

        <p className="audience-note">

          Trabalha com propostas de alto valor em outro segmento? O FoundCash também funciona para você.
        </p>
      </div>
    </section>
  );
}
