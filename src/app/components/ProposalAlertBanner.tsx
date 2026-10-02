import { useEffect } from 'react';
import { MessageCircle, X } from 'lucide-react';
import type { ProposalResponse } from '../../lib/types';
import { whatsappLink } from '../../utils/parsing';
import type { ProposalAlert } from '../hooks/useProposalAlerts';
import './ProposalAlertBanner.css';

const RESPONSE_LABELS: Record<ProposalResponse, string> = {
  quero_fechar: '🤝 Quer fechar!',
  duvida: '💬 Tem uma dúvida',
  caro: '💰 Achou caro',
  pensar: '🤔 Vai pensar',
};

const VIEW_MESSAGES = [
  'Ligue agora — a proposta está fresca!',
  'Momento ideal para entrar em contato.',
  'Chame enquanto está vendo!',
];

function randomViewMessage() {
  return VIEW_MESSAGES[Math.floor(Math.random() * VIEW_MESSAGES.length)];
}

interface AlertCardProps {
  alert: ProposalAlert;
  onDismiss: (id: string) => void;
}

function AlertCard({ alert, onDismiss }: AlertCardProps) {
  const isViewed = alert.type === 'viewed';
  const firstName = alert.clientName.split(' ')[0];

  // Auto-dismiss após 8s.
  useEffect(() => {
    const timer = window.setTimeout(() => onDismiss(alert.id), 8000);
    return () => window.clearTimeout(timer);
  }, [alert.id, onDismiss]);

  const viewMessage = isViewed ? randomViewMessage() : '';
  const waMessage = isViewed
    ? `Oi ${firstName}, vi que você está vendo nossa proposta! Posso ajudar com alguma dúvida? 😊`
    : `Oi ${firstName}, recebi sua resposta sobre a proposta. Podemos conversar? 😊`;

  return (
    <div className={`proposal-alert proposal-alert--${isViewed ? 'viewed' : 'responded'}`} role="alert">
      <div className="proposal-alert-top">
        <span className="proposal-alert-icon" aria-hidden="true">
          {isViewed ? '🔥' : (alert.response ? RESPONSE_LABELS[alert.response][0] : '💬')}
        </span>
        <div className="proposal-alert-body">
          <p className="proposal-alert-label">
            {isViewed ? 'Proposta aberta agora' : 'Resposta recebida'}
          </p>
          <p className="proposal-alert-name">{alert.clientName}</p>
          <p className="proposal-alert-sub">
            {isViewed ? viewMessage : (alert.response ? RESPONSE_LABELS[alert.response] : '')}
          </p>
        </div>
        <button
          type="button"
          className="proposal-alert-close"
          aria-label="Fechar alerta"
          onClick={() => onDismiss(alert.id)}
        >
          <X size={14} aria-hidden="true" />
        </button>
      </div>

      {alert.whatsapp && (
        <div className="proposal-alert-actions">
          <a
            className="btn btn-primary btn-sm"
            href={whatsappLink(alert.whatsapp, waMessage)}
            target="_blank"
            rel="noreferrer"
          >
            <MessageCircle size={14} aria-hidden="true" /> Abrir WhatsApp
          </a>
        </div>
      )}

      <div className="proposal-alert-progress" aria-hidden="true">
        <span />
      </div>
    </div>
  );
}

interface ProposalAlertBannerProps {
  alerts: ProposalAlert[];
  onDismiss: (id: string) => void;
}

export function ProposalAlertBanner({ alerts, onDismiss }: ProposalAlertBannerProps) {
  if (alerts.length === 0) return null;

  return (
    <div className="proposal-alerts" aria-live="polite" aria-label="Alertas de proposta">
      {alerts.map((alert) => (
        <AlertCard key={alert.id} alert={alert} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
