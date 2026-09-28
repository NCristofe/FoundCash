import { useState } from 'react';
import { ArrowRight, Check, Copy, Lightbulb, TriangleAlert } from 'lucide-react';
import { exampleOpportunity } from '../../data/content';
import { useUI } from '../../context/useUI';
import { formatCurrency, getInitials } from '../../utils/format';
import { Badge } from '../common/Badge';
import { Reveal } from '../common/Reveal';
import { SectionHeader } from '../common/SectionHeader';
import './ExampleOpportunity.css';

const DETAILS_ID = 'oportunidade-detalhes';

export function ExampleOpportunity() {
  const [expanded, setExpanded] = useState(false);
  const [followedUp, setFollowedUp] = useState(false);
  const { showToast } = useUI();
  const { code, client, service, value, sentDaysAgo, status, timeline, suggestedMessage } = exampleOpportunity;

  const details = [
    { term: 'Cliente', value: client },
    { term: 'Serviço', value: service },
    { term: 'Orçamento', value: formatCurrency(value), strong: true },
    { term: 'Enviado há', value: `${sentDaysAgo} dias` },
  ];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(suggestedMessage);
      showToast('Mensagem copiada. É só colar no WhatsApp.');
    } catch {
      showToast('Não foi possível copiar automaticamente. Selecione o texto e copie.');
    }
  };

  const handleFollowUp = () => {
    setFollowedUp(true);
    showToast(`Follow-up com ${client} registrado.`);
  };

  return (
    <section className="section example" aria-labelledby="exemplo-titulo">
      <div className="container">
        <SectionHeader
          id="exemplo-titulo"
          eyebrow="Na prática"
          title="Uma proposta esquecida pode valer dezenas de milhares."
          lead="Veja como o FoundCash mostra uma proposta parada — e o que fazer com ela."
        />

        <Reveal className="example-grid">
          <article className="example-card surface" aria-label={`Oportunidade ${code}`}>
            <header className="example-card-head">
              <span className="example-avatar" aria-hidden="true">
                {getInitials(client)}
              </span>
              <div>
                <p className="example-code">Oportunidade {code}</p>
                <p className="example-client">{client}</p>
              </div>
              <Badge tone={followedUp ? 'green' : 'red'}>{followedUp ? 'Em acompanhamento' : status}</Badge>
            </header>

            <dl className="example-details">
              {details.map((item) => (
                <div key={item.term} className="example-detail">
                  <dt>{item.term}</dt>
                  <dd className={item.strong ? 'is-strong tabular' : ''}>{item.value}</dd>
                </div>
              ))}
              <div className="example-detail">
                <dt>Status</dt>
                <dd className={followedUp ? 'text-green' : 'is-danger'}>{followedUp ? 'Contato realizado' : status}</dd>
              </div>
            </dl>

            <div className="example-progress" aria-hidden="true">
              {Array.from({ length: 7 }, (_, day) => (
                <span key={day} className={day === 0 ? 'is-sent' : day <= sentDaysAgo ? 'is-idle' : ''} />
              ))}
            </div>
            <p className="example-progress-label">
              <span>Enviado</span>
              <span>{sentDaysAgo} dias sem resposta</span>
            </p>
          </article>

          <aside className="example-alert" aria-label="Alerta do FoundCash">
            <div className="example-alert-head">
              <span className="example-alert-icon" aria-hidden="true">
                <TriangleAlert size={20} />
              </span>
              <h3>Oportunidade parada</h3>
            </div>
            <p className="example-alert-text">O cliente ainda não respondeu.</p>

            <div className="example-suggestion">
              <Lightbulb size={18} aria-hidden="true" />
              <p>
                <strong>Sugestão:</strong> Faça um novo contato hoje.
              </p>
            </div>

            <button
              type="button"
              className="btn btn-primary btn-block"
              aria-expanded={expanded}
              aria-controls={DETAILS_ID}
              onClick={() => setExpanded((open) => !open)}
            >
              {expanded ? 'Ocultar detalhes' : 'Ver oportunidade'}
              <ArrowRight className={`icon-arrow ${expanded ? 'is-rotated' : ''}`} size={18} aria-hidden="true" />
            </button>
          </aside>
        </Reveal>

        <div id={DETAILS_ID} className={`example-more ${expanded ? 'is-open' : ''}`} hidden={!expanded}>
          <div className="example-more-inner surface">
            <div>
              <h3 className="example-more-title">Histórico</h3>
              <ol className="example-timeline">
                {timeline.map((event) => (
                  <li key={event.label}>
                    <span className="example-timeline-when">{event.when}</span>
                    <span>{event.label}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div>
              <h3 className="example-more-title">Mensagem sugerida</h3>
              <blockquote className="example-message">{suggestedMessage}</blockquote>
              <div className="example-actions">
                <button type="button" className="btn btn-secondary btn-sm" onClick={handleCopy}>
                  <Copy size={16} aria-hidden="true" /> Copiar mensagem
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleFollowUp}
                  disabled={followedUp}
                >
                  <Check size={16} aria-hidden="true" />
                  {followedUp ? 'Contato registrado' : 'Marcar como contatado'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
