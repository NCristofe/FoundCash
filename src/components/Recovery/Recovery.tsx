import { ArrowDown, ArrowRight, Info } from 'lucide-react';
import { recoveryExample } from '../../data/content';
import { useInView } from '../../hooks/useInView';
import { CountUp } from '../common/CountUp';
import { LogoMark } from '../common/Logo';
import { SectionHeader } from '../common/SectionHeader';
import './Recovery.css';

export function Recovery() {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.35 });
  const { before, after } = recoveryExample;

  return (
    <section className="section recovery" aria-labelledby="recuperacao-titulo">
      <div className="container">
        <SectionHeader
          id="recuperacao-titulo"
          eyebrow="Recuperação"
          title="O que muda quando você acompanha."
          lead="Oportunidades paradas podem voltar a ser conversas — e conversas podem virar vendas."
        />

        <div ref={ref} className={`recovery-panel ${inView ? 'is-active' : ''}`}>
          <p className="recovery-flag">
            <Info size={14} aria-hidden="true" /> Exemplo ilustrativo
          </p>

          <div className="recovery-row">
            <article className="recovery-card recovery-card--before">
              <h3 className="recovery-tag">Antes</h3>
              <p className="recovery-count">
                <CountUp value={before.count} start={inView} /> oportunidades
              </p>
              <p className="recovery-value">
                <CountUp value={before.value} format="currency" start={inView} />
              </p>
              <p className="recovery-note">sem acompanhamento</p>
            </article>

            <div className="recovery-bridge" aria-hidden="true">
              <span className="recovery-arrow recovery-arrow--h">
                <ArrowRight size={18} />
              </span>
              <span className="recovery-arrow recovery-arrow--v">
                <ArrowDown size={18} />
              </span>
              <span className="recovery-brand">
                <LogoMark size={40} />
                FoundCash
              </span>
              <span className="recovery-arrow recovery-arrow--h">
                <ArrowRight size={18} />
              </span>
              <span className="recovery-arrow recovery-arrow--v">
                <ArrowDown size={18} />
              </span>
            </div>

            <article className="recovery-card recovery-card--after">
              <h3 className="recovery-tag">Depois</h3>
              <p className="recovery-count">
                <CountUp value={after.count} start={inView} /> oportunidades recuperadas
              </p>
              <p className="recovery-value">
                <CountUp value={after.value} format="currency" start={inView} />
              </p>
              <p className="recovery-note">em vendas</p>
            </article>
          </div>

          <p className="recovery-caption">
            Exemplo ilustrativo de utilização da plataforma. Os resultados variam de acordo com cada negócio e não
            são garantidos.
          </p>
        </div>
      </div>
    </section>
  );
}
