import { solutionFlow } from '../../data/content';
import { Reveal } from '../common/Reveal';
import { SectionHeader } from '../common/SectionHeader';
import './SolutionSection.css';

export function SolutionSection() {
  return (
    <section id="solucao" className="section solution" aria-labelledby="solucao-titulo">
      <div className="container">
        <SectionHeader
          id="solucao-titulo"
          eyebrow="A solução"
          title="O FoundCash transforma oportunidades esquecidas em ações."
          lead="Você já fez o orçamento. Agora não deixe a oportunidade desaparecer."
        />

        <ol className="flow">
          {solutionFlow.map(({ label, description, icon: Icon, tone }, index) => (
            <li key={label} className={`flow-step flow-step--${tone}`}>
              <Reveal delay={index * 110} className="flow-step-inner">
                <span className="flow-icon" aria-hidden="true">
                  <Icon size={22} />
                </span>
                <div>
                  <span className="flow-index" aria-hidden="true">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <h3 className="flow-label">{label}</h3>
                  <p className="flow-description">{description}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
