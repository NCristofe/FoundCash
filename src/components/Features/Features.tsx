import { features, roadmap } from '../../data/content';
import { Reveal } from '../common/Reveal';
import { SectionHeader } from '../common/SectionHeader';
import './Features.css';

export function Features() {
  return (
    <section id="produto" className="section features" aria-labelledby="produto-titulo">
      <div className="container">
        <SectionHeader
          id="produto-titulo"
          eyebrow="Produto"
          title="Tudo que você precisa para não esquecer uma venda."
          lead="Simples de usar, direto ao ponto. Sem precisar aprender um sistema complicado."
        />

        <ul className="features-grid">
          {features.map(({ title, description, icon: Icon }, index) => (
            <li key={title}>
              <Reveal delay={(index % 3) * 100} className="feature-reveal">
                <article className="feature-card surface">
                  <span className="feature-icon" aria-hidden="true">
                    <Icon size={22} />
                  </span>
                  <h3 className="feature-title">{title}</h3>
                  <p className="feature-text">{description}</p>
                </article>
              </Reveal>
            </li>
          ))}
        </ul>

        <div className="roadmap">
          <h3 className="roadmap-title">
            <span className="roadmap-badge">Em breve</span> No nosso radar
          </h3>
          <ul className="roadmap-list">
            {roadmap.map(({ title, description, icon: Icon }) => (
              <li key={title} className="roadmap-item">
                <Icon size={20} aria-hidden="true" />
                <div>
                  <p className="roadmap-item-title">{title}</p>
                  <p className="roadmap-item-text">{description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
