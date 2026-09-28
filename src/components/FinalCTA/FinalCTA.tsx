import { Reveal } from '../common/Reveal';
import { StartButton } from '../common/StartButton';
import './FinalCTA.css';

export function FinalCTA() {
  return (
    <section className="section final-cta" aria-labelledby="cta-final-titulo">
      <div className="container">
        <Reveal className="final-cta-panel">
          <div className="final-cta-glow" aria-hidden="true" />
          <p className="eyebrow">Encontre oportunidades que você esqueceu</p>
          <h2 id="cta-final-titulo" className="final-cta-title">
            Quanto dinheiro está parado nos seus orçamentos?
          </h2>
          <p className="final-cta-text">
            Descubra suas oportunidades, acompanhe seus clientes e pare de deixar vendas esquecidas.
          </p>
          <StartButton label="Encontrar minhas oportunidades" size="lg" />
          <p className="final-cta-trust">Sem cartão de crédito • Comece em poucos minutos</p>
        </Reveal>
      </div>
    </section>
  );
}
