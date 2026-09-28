import type { CSSProperties } from 'react';
import { howItWorksSteps } from '../../data/content';
import { useInView } from '../../hooks/useInView';
import { SectionHeader } from '../common/SectionHeader';
import { StartButton } from '../common/StartButton';
import './HowItWorks.css';

const STEP_DELAY = 550;

export function HowItWorks() {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.35 });

  return (
    <section id="como-funciona" className="section how" aria-labelledby="como-funciona-titulo">
      <div className="container">
        <SectionHeader
          id="como-funciona-titulo"
          eyebrow="Como funciona"
          title="Comece em poucos minutos."
          lead="Saiba quem precisa de você hoje — em três passos."
        />

        <div ref={ref} className={`how-wrap ${inView ? 'is-active' : ''}`}>
          <div className="how-track" aria-hidden="true">
            <span className="how-track-fill" />
          </div>
          <ol className="how-steps">
            {howItWorksSteps.map(({ number, title, description, icon: Icon }, index) => (
              <li
                key={number}
                className="how-step"
                style={{ '--step-delay': `${index * STEP_DELAY}ms` } as CSSProperties}
              >
                <span className="how-node" aria-hidden="true">
                  <Icon size={22} />
                </span>
                <p className="how-number" aria-hidden="true">
                  {number}
                </p>
                <h3 className="how-title">
                  <span className="sr-only">Passo {number}: </span>
                  {title}
                </h3>
                <p className="how-text">{description}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="how-cta">
          <StartButton size="lg" />
        </div>
      </div>
    </section>
  );
}
