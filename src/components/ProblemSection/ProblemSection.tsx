import { CheckCheck, Clock, FileText } from 'lucide-react';
import { problemSteps, type ProblemVisual } from '../../data/content';
import { formatCurrency } from '../../utils/format';
import { Reveal } from '../common/Reveal';
import { SectionHeader } from '../common/SectionHeader';
import './ProblemSection.css';

/** Pequenas cenas de conversa que ilustram cada etapa do problema. */
function ProblemScene({ visual }: { visual: ProblemVisual }) {
  if (visual === 'sent') {
    return (
      <div className="scene">
        <div className="bubble bubble--out">
          <span className="bubble-file">
            <FileText size={14} /> orcamento-carlos.pdf
          </span>
          Olá, Carlos! Segue o orçamento da instalação.
          <span className="bubble-meta">
            09:14 <CheckCheck size={13} className="text-green" />
          </span>
        </div>
      </div>
    );
  }

  if (visual === 'waiting') {
    return (
      <div className="scene">
        <div className="bubble bubble--in">
          Vou pensar e te aviso 👍
          <span className="bubble-meta">09:32</span>
        </div>
        <p className="scene-note scene-note--yellow">
          <Clock size={13} /> Sem novas mensagens há 4 dias
        </p>
      </div>
    );
  }

  return (
    <div className="scene">
      <div className="scene-card">
        <span>Orçamento #0183</span>
        <strong className="tabular">{formatCurrency(3200)}</strong>
      </div>
      <p className="scene-note scene-note--red">
        <span className="scene-dot" /> Sem retorno há 12 dias
      </p>
    </div>
  );
}

export function ProblemSection() {
  return (
    <section className="section problem" aria-labelledby="problema-titulo">
      <div className="container">
        <SectionHeader
          id="problema-titulo"
          eyebrow="O problema"
          title="Quantos orçamentos estão esquecidos hoje?"
          lead={
            <>
              Você envia o orçamento, o cliente diz “vou pensar” e a conversa acaba. Dias depois, aquele possível
              cliente simplesmente desapareceu.
            </>
          }
        />

        <ol className="problem-flow">
          {problemSteps.map((step, index) => (
            <li key={step.number} className={`problem-step problem-step--${step.tone}`}>
              <Reveal delay={index * 140}>
                <span className="problem-node" aria-hidden="true">
                  {step.number}
                </span>
                <article className="problem-card surface">
                  <div aria-hidden="true">
                    <ProblemScene visual={step.visual} />
                  </div>
                  <h3 className="problem-title">
                    <span className="sr-only">{step.number}. </span>
                    {step.title}
                  </h3>
                  <p className="problem-text">{step.description}</p>
                </article>
              </Reveal>
            </li>
          ))}
        </ol>

        <Reveal delay={300}>
          <p className="problem-quote">Não deixe o orçamento virar silêncio.</p>
        </Reveal>
      </div>
    </section>
  );
}
