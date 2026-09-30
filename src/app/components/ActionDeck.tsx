import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { builtInTemplates, clientTypeLabels, fillTemplate } from '../../config/niche';
import type { Opportunity } from '../../lib/types';
import { formatCurrency, getInitials } from '../../utils/format';
import { whatsappLink } from '../../utils/parsing';
import type { Analysis } from '../radar';
import { ScoreRing } from './RadarUI';

const VISIBLE = 3;
const LEAVE_MS = 450;

function quickMessage(opportunity: Opportunity): string {
  const firstName = opportunity.client_name.startsWith('WhatsApp') ? '' : opportunity.client_name.split(' ')[0];
  return fillTemplate(builtInTemplates[0].body, {
    cliente: firstName,
    valor: formatCurrency(opportunity.value),
  }).replace(/,\s*!/g, '!');
}

function meta(item: Opportunity): string {
  return [
    item.client_type ? clientTypeLabels[item.client_type] : null,
    item.system_kwp ? `${item.system_kwp.toLocaleString('pt-BR')} kWp` : null,
    item.city,
  ]
    .filter(Boolean)
    .join(' · ');
}

interface ActionDeckProps {
  actions: Analysis[];
  onOpen: (id: string) => void;
  /** Marca como ganha. Rejeita em caso de erro (o cartão volta para a fila). */
  onWon: (item: Analysis) => Promise<void>;
}

/** Fila de hoje: cartões empilhados, um por vez. */
export function ActionDeck({ actions, onOpen, onWon }: ActionDeckProps) {
  const [offset, setOffset] = useState(0);
  const [leaving, setLeaving] = useState<{ id: string; kind: 'skip' | 'won' } | null>(null);

  const count = actions.length;
  const start = count ? offset % count : 0;
  const order = [...actions.slice(start), ...actions.slice(0, start)];
  const top = order[0];

  const skip = () => {
    if (count < 2 || leaving) return;
    setLeaving({ id: top.opportunity.id, kind: 'skip' });
    window.setTimeout(() => {
      setOffset((current) => current + 1);
      setLeaving(null);
    }, LEAVE_MS);
  };

  const won = () => {
    if (!top || leaving) return;
    const item = top;
    setLeaving({ id: item.opportunity.id, kind: 'won' });
    window.setTimeout(() => {
      onWon(item)
        .catch(() => undefined)
        .finally(() => setLeaving(null));
    }, LEAVE_MS);
  };

  return (
    <div className="deck-wrap">
      <div className="deck">
        {count === 0 && (
          <div className="deck-empty">
            <b>Fila de hoje zerada</b>
            <span>O radar avisa quando alguma oportunidade esfriar.</span>
          </div>
        )}
        {actions.map((item) => {
          const position = order.findIndex((entry) => entry.opportunity.id === item.opportunity.id);
          const isTop = position === 0;
          const leavingClass = leaving?.id === item.opportunity.id ? `is-${leaving.kind}` : '';
          const opportunity = item.opportunity;
          const details = meta(opportunity);
          return (
            <article
              key={opportunity.id}
              className={`deck-card ${leavingClass}`}
              data-pos={position < VISIBLE ? position : 'hidden'}
              aria-hidden={!isTop}
            >
              <div className="deck-person">
                <span className="deck-initials">{getInitials(opportunity.client_name.replace(/^WhatsApp\s*/, '')) || 'W'}</span>
                <div>
                  <b>{opportunity.client_name}</b>
                  {details && <small>{details}</small>}
                </div>
                <ScoreRing score={item.score} />
              </div>
              <span className={`deck-reason ${item.atRisk ? '' : 'is-hot'}`}>{item.signals[0]?.text}</span>
              <div className="deck-foot">
                <span className="deck-value tabular">{formatCurrency(opportunity.value)}</span>
                <div className="deck-buttons">
                  {opportunity.whatsapp && (
                    <a
                      className="btn btn-whatsapp btn-sm"
                      href={whatsappLink(opportunity.whatsapp, quickMessage(opportunity))}
                      target="_blank"
                      rel="noreferrer"
                      tabIndex={isTop ? 0 : -1}
                      aria-label={`Chamar ${opportunity.client_name} no WhatsApp`}
                    >
                      <MessageCircle size={16} aria-hidden="true" /> WhatsApp
                    </a>
                  )}
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    tabIndex={isTop ? 0 : -1}
                    onClick={() => onOpen(opportunity.id)}
                  >
                    Abrir
                  </button>
                  <button type="button" className="btn btn-jade btn-sm" tabIndex={isTop ? 0 : -1} onClick={won}>
                    Fechou
                  </button>
                </div>
              </div>
              <div className="deck-won" aria-hidden="true">
                Venda fechada
              </div>
            </article>
          );
        })}
      </div>

      <div className="deck-nav">
        <div className="deck-dots" aria-hidden="true">
          {order.map((item, index) => (
            <i key={item.opportunity.id} className={index === 0 ? 'is-on' : ''} />
          ))}
        </div>
        <button type="button" className="deck-skip" onClick={skip} disabled={count < 2}>
          Pular
        </button>
      </div>
    </div>
  );
}
