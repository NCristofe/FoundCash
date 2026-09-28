import { useRef, useState, type FormEvent } from 'react';
import { CalendarDays, Loader2, MessageCircle } from 'lucide-react';
import { FormField } from '../../components/common/FormField';
import { FOLLOW_UP_SHORTCUTS } from '../../config/app';
import { niche } from '../../config/niche';
import { useUI } from '../../context/useUI';
import { friendlyError } from '../../lib/supabase';
import type { Opportunity } from '../../lib/types';
import { addDaysKey, formatDateKey, todayKey } from '../../utils/dates';
import { formatCurrency } from '../../utils/format';
import { formatPhone, parseClientInput, parseCurrencyInput } from '../../utils/parsing';
import { useAppData } from '../state/useAppData';

interface QuickEntryFormProps {
  /** Chamado depois de salvar. `keepOpen` = usuário pediu para cadastrar outra. */
  onSaved?: (opportunity: Opportunity, keepOpen: boolean) => void;
  /** Exibe o botão "Salvar e adicionar outra". */
  allowAnother?: boolean;
  idPrefix?: string;
}

type Errors = Partial<Record<'client' | 'value' | 'date', string>>;

const DEFAULT_SHORTCUT_DAYS = FOLLOW_UP_SHORTCUTS[0].days;

/**
 * Entrada Rápida: três campos (cliente, valor, follow-up) para cadastrar
 * uma proposta em menos de 15 segundos. Enter salva.
 */
export function QuickEntryForm({ onSaved, allowAnother = false, idPrefix = 'qe' }: QuickEntryFormProps) {
  const { createOpportunity } = useAppData();
  const { showToast } = useUI();
  const clientRef = useRef<HTMLInputElement>(null);

  const [client, setClient] = useState('');
  const [valueText, setValueText] = useState('');
  const [shortcutDays, setShortcutDays] = useState<number | null>(DEFAULT_SHORTCUT_DAYS);
  const [customDate, setCustomDate] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  const parsedClient = client.trim() ? parseClientInput(client) : null;
  const parsedValue = parseCurrencyInput(valueText);
  const followUpOn = shortcutDays !== null ? addDaysKey(shortcutDays) : customDate;

  const save = async (keepOpen: boolean) => {
    const nextErrors: Errors = {};
    if (!parsedClient) nextErrors.client = 'Informe o nome do cliente ou o WhatsApp.';
    if (parsedValue === null || parsedValue <= 0) nextErrors.value = 'Informe o valor da proposta.';
    if (!followUpOn) nextErrors.date = 'Escolha quando fazer o follow-up.';
    setErrors(nextErrors);

    const firstInvalid = Object.keys(nextErrors)[0];
    if (firstInvalid || !parsedClient || parsedValue === null) {
      if (firstInvalid) document.getElementById(`${idPrefix}-${firstInvalid}`)?.focus();
      return;
    }

    setSaving(true);
    try {
      const created = await createOpportunity({
        client_name: parsedClient.clientName,
        whatsapp: parsedClient.whatsapp,
        value: parsedValue,
        follow_up_on: followUpOn,
      });
      showToast(`${created.client_name} · ${formatCurrency(created.value)} adicionada.`);
      setClient('');
      setValueText('');
      setShortcutDays(DEFAULT_SHORTCUT_DAYS);
      setCustomDate('');
      clientRef.current?.focus();
      onSaved?.(created, keepOpen);
    } catch (error) {
      showToast(friendlyError(error), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void save(false);
  };

  return (
    <form className="quick-entry" onSubmit={handleSubmit} noValidate>
      <FormField
        ref={clientRef}
        id={`${idPrefix}-client`}
        label="Cliente"
        placeholder={niche.clientPlaceholder}
        autoComplete="off"
        value={client}
        error={errors.client}
        onChange={(event) => setClient(event.target.value)}
        hint={
          parsedClient?.whatsapp ? (
            <span className="quick-entry-detected">
              <MessageCircle size={13} aria-hidden="true" /> WhatsApp detectado: {formatPhone(parsedClient.whatsapp)}
            </span>
          ) : (
            'Nome ou link/número do WhatsApp.'
          )
        }
      />

      <FormField
        id={`${idPrefix}-value`}
        label="Valor da proposta (estimado)"
        inputMode="decimal"
        placeholder={niche.valuePlaceholder}
        autoComplete="off"
        value={valueText}
        error={errors.value}
        onChange={(event) => setValueText(event.target.value)}
        hint={parsedValue ? `= ${formatCurrency(parsedValue)}` : 'Aceita “28.500”, “28,5 mil” ou “28k”.'}
      />

      <fieldset className="quick-entry-dates">
        <legend>Follow-up</legend>
        <div className="chips" role="radiogroup" aria-label="Quando fazer o follow-up">
          {FOLLOW_UP_SHORTCUTS.map((shortcut) => (
            <button
              key={shortcut.days}
              type="button"
              role="radio"
              className="chip"
              aria-checked={shortcutDays === shortcut.days}
              onClick={() => setShortcutDays(shortcut.days)}
            >
              {shortcut.label}
            </button>
          ))}
          <button
            type="button"
            role="radio"
            className="chip"
            aria-checked={shortcutDays === null}
            onClick={() => setShortcutDays(null)}
          >
            <CalendarDays size={14} aria-hidden="true" /> Outra data
          </button>
        </div>

        {shortcutDays === null ? (
          <FormField
            id={`${idPrefix}-date`}
            label="Data do follow-up"
            type="date"
            min={todayKey()}
            value={customDate}
            error={errors.date}
            onChange={(event) => setCustomDate(event.target.value)}
          />
        ) : (
          <p className="field-hint">Lembrete em {formatDateKey(followUpOn)}.</p>
        )}
      </fieldset>

      <div className="quick-entry-actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving && <Loader2 className="spin" size={18} aria-hidden="true" />}
          Salvar oportunidade
        </button>
        {allowAnother && (
          <button type="button" className="btn btn-secondary" disabled={saving} onClick={() => void save(true)}>
            Salvar e adicionar outra
          </button>
        )}
      </div>
    </form>
  );
}
