import { useId, useState, type CSSProperties } from 'react';
import { Mail } from 'lucide-react';
import { monthlyCost, roiMultiple } from '../../../supabase/functions/_shared/plans.ts';
import { formatCurrency, formatNumber } from '../../utils/format';
import { SectionHeader } from '../common/SectionHeader';
import { StartButton } from '../common/StartButton';
import './RoiCalculator.css';

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (value: number) => void;
}

function Slider({ label, value, min, max, step, display, onChange }: SliderProps) {
  const id = useId();
  return (
    <div className="roi-slider">
      <div className="roi-slider-head">
        <label htmlFor={id}>{label}</label>
        <output htmlFor={id} className="tabular">
          {display}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={display}
        onChange={(event) => onChange(Number(event.target.value))}
        style={{ '--fill': `${((value - min) / (max - min)) * 100}%` } as CSSProperties}
      />
    </div>
  );
}

/** Simulador: quanto uma rotina de follow-up pode recuperar vs. o custo do plano. */
export function RoiCalculator() {
  const [proposals, setProposals] = useState(20);
  const [ticket, setTicket] = useState(28000);
  const [rate, setRate] = useState(5);

  const cost = monthlyCost('essencial', 'monthly');
  const recoveredSales = (proposals * rate) / 100;
  const recovered = recoveredSales * ticket;
  const roi = roiMultiple(recovered, cost);
  const roiText = `${roi.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}x`;

  return (
    <section className="section roi" aria-labelledby="roi-titulo">
      <div className="container">
        <SectionHeader
          id="roi-titulo"
          eyebrow="Retorno"
          title="Faça a conta do seu negócio."
          lead="Em energia solar, uma única proposta recuperada costuma pagar anos de assinatura."
        />

        <div className="roi-grid">
          <div className="roi-inputs surface">
            <Slider
              label="Propostas enviadas por mês"
              value={proposals}
              min={5}
              max={100}
              step={1}
              display={formatNumber(proposals)}
              onChange={setProposals}
            />
            <Slider
              label="Ticket médio da proposta"
              value={ticket}
              min={8000}
              max={150000}
              step={1000}
              display={formatCurrency(ticket)}
              onChange={setTicket}
            />
            <Slider
              label="Propostas paradas que voltam com follow-up"
              value={rate}
              min={1}
              max={20}
              step={1}
              display={`${rate}%`}
              onChange={setRate}
            />
            <p className="roi-disclaimer">
              Simulação ilustrativa. O resultado real depende do seu processo comercial e não é garantido.
            </p>
          </div>

          <div className="roi-report" aria-live="polite">
            <p className="roi-report-label">
              <Mail size={16} aria-hidden="true" /> Prévia do seu relatório do dia 1º
            </p>
            <p className="roi-report-text">
              Neste mês, você recuperou <strong className="text-green">{formatCurrency(recovered)}</strong> com a ajuda
              do FoundCash. Sua assinatura custou <strong>{formatCurrency(cost)}</strong>. Seu retorno sobre o
              investimento foi de <strong className="text-green">{roiText}</strong>.
            </p>
            <dl className="roi-report-stats">
              <div>
                <dt>Vendas recuperadas/mês</dt>
                <dd className="tabular">{recoveredSales.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}</dd>
              </div>
              <div>
                <dt>Plano Essencial</dt>
                <dd className="tabular">{formatCurrency(cost)}/mês</dd>
              </div>
            </dl>
            <StartButton size="lg" block />
          </div>
        </div>
      </div>
    </section>
  );
}
