import { useEffect, useState } from 'react';
import { Copy, MessageCircle, PartyPopper, RotateCcw, Trash2, XCircle } from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { FOLLOW_UP_SHORTCUTS } from '../../config/app';
import { builtInTemplates, fillTemplate, lossReasonLabels } from '../../config/niche';
import { useUI } from '../../context/useUI';
import { friendlyError } from '../../lib/supabase';
import type { EventKind, LossReason, Opportunity, OpportunityEvent } from '../../lib/types';
import { addDaysKey, describeFollowUp, daysFromToday, formatDateTime } from '../../utils/dates';
import { formatCurrency } from '../../utils/format';
import { formatPhone, whatsappLink } from '../../utils/parsing';
import { fetchEvents, type OpportunityChanges } from '../services/api';
import { useAppData } from '../state/useAppData';
import { Dialog } from './Dialog';

const eventLabels: Record<EventKind, string> = {
  created: 'Oportunidade cadastrada',
  contacted: 'Contato registrado',
  rescheduled: 'Follow-up reagendado',
  won: 'Venda fechada',
  lost: 'Marcada como perdida',
  reopened: 'Reaberta',
};

interface OpportunityDialogProps {
  opportunity: Opportunity | null;
  onClose: () => void;
}

export function OpportunityDialog({ opportunity, onClose }: OpportunityDialogProps) {
  return (
    <Dialog
      open={opportunity !== null}
      onClose={onClose}
      title={opportunity?.client_name ?? 'Oportunidade'}
      initialFocus=".opportunity-primary"
      size="lg"
    >
      {opportunity && <OpportunityDetails key={opportunity.id} opportunity={opportunity} />}
    </Dialog>
  );
}

function OpportunityDetails({ opportunity }: { opportunity: Opportunity }) {
  const { updateOpportunity, removeOpportunity, customTemplates } = useAppData();
  const { showToast } = useUI();

  const templates = [...builtInTemplates, ...customTemplates];
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? '');
  const [nextDays, setNextDays] = useState<number>(FOLLOW_UP_SHORTCUTS[1].days);
  const [lossReason, setLossReason] = useState<LossReason | ''>('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [events, setEvents] = useState<OpportunityEvent[] | null>(null);

  const { id, status, updated_at: updatedAt } = opportunity;

  // Recarrega o histórico sempre que a oportunidade muda.
  useEffect(() => {
    let cancelled = false;
    fetchEvents(id)
      .then((items) => !cancelled && setEvents(items))
      .catch(() => !cancelled && setEvents([]));
    return () => {
      cancelled = true;
    };
  }, [id, updatedAt]);

  const template = templates.find((item) => item.id === templateId) ?? templates[0];
  const firstName = opportunity.client_name.startsWith('WhatsApp') ? '' : opportunity.client_name.split(' ')[0];
  // Sem nome conhecido, "Olá, {cliente}!" vira "Olá!".
  const message = template
    ? fillTemplate(template.body, { cliente: firstName, valor: formatCurrency(opportunity.value) }).replace(/,\s*!/g, '!')
    : '';

  const run = async (changes: OpportunityChanges, success: string) => {
    setBusy(true);
    try {
      await updateOpportunity(id, changes);
      showToast(success);
    } catch (error) {
      showToast(friendlyError(error), 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleContacted = () =>
    run(
      { last_contact_at: new Date().toISOString(), follow_up_on: addDaysKey(nextDays) },
      `Contato registrado. Próximo follow-up: ${describeFollowUp(addDaysKey(nextDays)).toLowerCase()}.`,
    );

  const handleWon = () =>
    run({ status: 'won' }, `Venda recuperada: ${formatCurrency(opportunity.value)} somados ao seu mês!`);

  const handleLost = () => {
    if (!lossReason) {
      document.getElementById('loss-reason')?.focus();
      return;
    }
    void run({ status: 'lost', loss_reason: lossReason }, 'Oportunidade marcada como perdida.');
  };

  const handleReopen = () => run({ status: 'open', follow_up_on: addDaysKey(1) }, 'Oportunidade reaberta.');

  const handleDelete = async () => {
    setBusy(true);
    try {
      await removeOpportunity(id);
      showToast('Oportunidade excluída.');
    } catch (error) {
      showToast(friendlyError(error), 'error');
      setBusy(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      showToast('Mensagem copiada.');
    } catch {
      showToast('Não foi possível copiar. Selecione o texto e copie.', 'error');
    }
  };

  const overdue = status === 'open' && daysFromToday(opportunity.follow_up_on) < 0;

  return (
    <div className="opportunity">
      <div className="opportunity-summary">
        <p className="opportunity-value tabular">{formatCurrency(opportunity.value)}</p>
        <div className="opportunity-meta">
          {status === 'open' && (
            <Badge tone={overdue ? 'red' : daysFromToday(opportunity.follow_up_on) === 0 ? 'yellow' : 'neutral'}>
              Follow-up: {describeFollowUp(opportunity.follow_up_on)}
            </Badge>
          )}
          {status === 'won' && <Badge tone="green">Recuperada</Badge>}
          {status === 'lost' && (
            <Badge tone="red">Perdida · {lossReasonLabels[opportunity.loss_reason ?? 'outro']}</Badge>
          )}
          {opportunity.whatsapp && <span className="text-muted">{formatPhone(opportunity.whatsapp)}</span>}
        </div>
      </div>

      {status === 'open' && (
        <>
          <section className="opportunity-block" aria-labelledby="op-contato">
            <h3 id="op-contato">1. Fale com o cliente</h3>
            <div className="field">
              <label htmlFor="op-template">Script</label>
              <select id="op-template" value={template?.id ?? ''} onChange={(event) => setTemplateId(event.target.value)}>
                {templates.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </select>
            </div>
            <blockquote className="opportunity-message">{message}</blockquote>
            <div className="opportunity-actions">
              {opportunity.whatsapp ? (
                <a
                  className="btn btn-primary opportunity-primary"
                  href={whatsappLink(opportunity.whatsapp, message)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircle size={18} aria-hidden="true" /> Abrir no WhatsApp
                </a>
              ) : null}
              <button
                type="button"
                className={`btn btn-secondary ${opportunity.whatsapp ? '' : 'opportunity-primary'}`}
                onClick={handleCopy}
              >
                <Copy size={16} aria-hidden="true" /> Copiar mensagem
              </button>
            </div>
          </section>

          <section className="opportunity-block" aria-labelledby="op-registro">
            <h3 id="op-registro">2. Registre o contato</h3>
            <p className="field-hint">Próximo follow-up em:</p>
            <div className="chips" role="radiogroup" aria-label="Próximo follow-up">
              {FOLLOW_UP_SHORTCUTS.map((shortcut) => (
                <button
                  key={shortcut.days}
                  type="button"
                  role="radio"
                  className="chip"
                  aria-checked={nextDays === shortcut.days}
                  onClick={() => setNextDays(shortcut.days)}
                >
                  {shortcut.label}
                </button>
              ))}
            </div>
            <button type="button" className="btn btn-secondary" disabled={busy} onClick={handleContacted}>
              Registrar contato
            </button>
          </section>

          <section className="opportunity-block" aria-labelledby="op-resultado">
            <h3 id="op-resultado">3. Teve resultado?</h3>
            <div className="opportunity-outcome">
              <button type="button" className="btn btn-primary" disabled={busy} onClick={handleWon}>
                <PartyPopper size={18} aria-hidden="true" /> Fechou negócio
              </button>
              <div className="opportunity-loss">
                <div className="field">
                  <label htmlFor="loss-reason">Motivo da perda</label>
                  <select
                    id="loss-reason"
                    value={lossReason}
                    onChange={(event) => setLossReason(event.target.value as LossReason | '')}
                  >
                    <option value="">Selecione</option>
                    {(Object.keys(lossReasonLabels) as LossReason[]).map((reason) => (
                      <option key={reason} value={reason}>
                        {lossReasonLabels[reason]}
                      </option>
                    ))}
                  </select>
                </div>
                <button type="button" className="btn btn-danger" disabled={busy} onClick={handleLost}>
                  <XCircle size={18} aria-hidden="true" /> Perdeu
                </button>
              </div>
            </div>
          </section>
        </>
      )}

      {status !== 'open' && (
        <div className="opportunity-actions">
          <button type="button" className="btn btn-secondary opportunity-primary" disabled={busy} onClick={handleReopen}>
            <RotateCcw size={16} aria-hidden="true" /> Reabrir oportunidade
          </button>
        </div>
      )}

      <section className="opportunity-block" aria-labelledby="op-historico">
        <h3 id="op-historico">Histórico</h3>
        {events === null ? (
          <p className="text-muted">Carregando…</p>
        ) : events.length === 0 ? (
          <p className="text-muted">Sem movimentações.</p>
        ) : (
          <ol className="opportunity-timeline">
            {events.map((event) => (
              <li key={event.id}>
                <span>{eventLabels[event.kind]}</span>
                <time dateTime={event.created_at}>{formatDateTime(event.created_at)}</time>
              </li>
            ))}
          </ol>
        )}
      </section>

      <div className="opportunity-danger">
        {confirmDelete ? (
          <>
            <span>Excluir definitivamente?</span>
            <button type="button" className="btn btn-danger btn-sm" disabled={busy} onClick={handleDelete}>
              Sim, excluir
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirmDelete(false)}>
              Cancelar
            </button>
          </>
        ) : (
          <button type="button" className="link-button" onClick={() => setConfirmDelete(true)}>
            <Trash2 size={14} aria-hidden="true" /> Excluir oportunidade
          </button>
        )}
      </div>
    </div>
  );
}
