import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { builtInTemplates, clientTypeLabels, fillTemplate } from '../../config/niche';
import type { Opportunity } from '../../lib/types';
import { formatCurrency, getInitials } from '../../utils/format';
import { whatsappLink } from '../../utils/parsing';
import type { Analysis } from '../radar';

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

interface ActionQueueProps {
  actions: Analysis[];
  onOpen: (id: string) => void;
  /** Marca como ganha. Rejeita em caso de erro. */
  onWon: (item: Analysis) => Promise<void>;
}

/** Fila de hoje: lista simples, uma linha por oportunidade, com as ações à direita. */
export function ActionQueue({ actions, onOpen, onWon }: ActionQueueProps) {
  const [busyId, setBusyId] = useState<string | null>(null);

  if (actions.length === 0) {
    return (
      <div className="queue-empty">
        <b>Fila de hoje zerada</b>
        <span>O radar avisa quando alguma oportunidade esfriar.</span>
      </div>
    );
  }

  const won = (item: Analysis) => {
    setBusyId(item.opportunity.id);
    onWon(item)
      .catch(() => undefined)
      .finally(() => setBusyId(null));
  };

  return (
    <ul className="queue-list">
      {actions.map((item) => {
        const { opportunity } = item;
        const details = meta(opportunity);
        return (
          <li key={opportunity.id} className="queue-row">
            <span className="queue-avatar" aria-hidden="true">
              {getInitials(opportunity.client_name.replace(/^WhatsApp\s*/, '')) || 'W'}
            </span>
            <div className="queue-main">
              <b>{opportunity.client_name}</b>
              <small>{[details, item.signals[0]?.text].filter(Boolean).join(' · ')}</small>
            </div>
            <span
              className={`queue-score ${item.score >= 70 ? 'is-high' : ''}`}
              title="Prioridade de 0 a 100"
            >
              {item.score >= 70 ? 'Alta' : item.score >= 40 ? 'Média' : 'Baixa'}
            </span>
            <span className="queue-value tabular">{formatCurrency(opportunity.value)}</span>
            <div className="queue-actions">
              {opportunity.whatsapp && (
                <a
                  className="btn btn-whatsapp btn-sm"
                  href={whatsappLink(opportunity.whatsapp, quickMessage(opportunity))}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Chamar ${opportunity.client_name} no WhatsApp`}
                >
                  <MessageCircle size={15} aria-hidden="true" /> WhatsApp
                </a>
              )}
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => onOpen(opportunity.id)}>
                Abrir
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={busyId === opportunity.id}
                onClick={() => won(item)}
              >
                Fechou
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
