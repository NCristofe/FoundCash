import { pricingNote } from '../../data/pricing';
import { Reveal } from '../common/Reveal';
import { StartButton } from '../common/StartButton';
import './FinalCTA.css';

export function FinalCTA() {
  return (
    <section className="section final-cta" aria-labelledby="cta-final-titulo">
      <div className="container">
        <Reveal className="final-cta-panel">
          <div className="final-cta-glow" aria-hidden="true" />
          <p className="eyebrow">Encontre propostas que você esqueceu</p>
          <h2 id="cta-final-titulo" className="final-cta-title">
            Quanto dinheiro está parado nas suas propostas?
          </h2>
          <p className="final-cta-text">
            Cadastre suas 5 primeiras propostas paradas e descubra em poucos minutos.
          </p>
          <StartButton label="Encontrar minhas oportunidades" size="lg" />
          <p className="final-cta-trust">{pricingNote}</p>
        </Reveal>
      </div>
    </section>
  );
}
