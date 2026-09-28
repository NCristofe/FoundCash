import type { CSSProperties } from 'react';
import { Check } from 'lucide-react';
import { DashboardPreview } from '../DashboardPreview/DashboardPreview';
import { StartButton } from '../common/StartButton';
import './Hero.css';

const delay = (ms: number) => ({ '--load-delay': `${ms}ms` }) as CSSProperties;

export function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-backdrop" aria-hidden="true" />

      <div className="container hero-grid">
        <div className="hero-copy">
          <p className="hero-chip load-in" style={delay(0)}>
            <span className="hero-chip-dot" aria-hidden="true" />
            Para integradores de energia solar
          </p>

          <h1 id="hero-title" className="hero-title load-in" style={delay(80)}>
            Existe <span className="hero-highlight">dinheiro parado</span> nas suas propostas.
            <span className="hero-title-sub">O FoundCash encontra para você.</span>
          </h1>

          <p className="hero-lead load-in" style={delay(180)}>
            Saiba quais clientes precisam de um novo contato, acompanhe cada proposta e transforme orçamentos
            esquecidos em sistemas vendidos.
          </p>

          <div className="hero-actions load-in" style={delay(260)}>
            <StartButton size="lg" />
            <a className="btn btn-secondary btn-lg" href="#como-funciona">
              Ver como funciona
            </a>
          </div>

          <ul className="hero-trust load-in" style={delay(340)}>
            <li>
              <Check size={16} aria-hidden="true" /> 14 dias grátis
            </li>
            <li>
              <Check size={16} aria-hidden="true" /> Sem cartão de crédito
            </li>
            <li>
              <Check size={16} aria-hidden="true" /> Cadastro de proposta em 15 segundos
            </li>
          </ul>
        </div>

        <div className="hero-visual load-in" style={delay(300)}>
          <DashboardPreview />
        </div>
      </div>
    </section>
  );
}
