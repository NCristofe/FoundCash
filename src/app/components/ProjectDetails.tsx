import { useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { FormField } from '../../components/common/FormField';
import { clientTypeLabels, interestLabels, leadSourceLabels } from '../../config/niche';
import { useUI } from '../../context/useUI';
import { friendlyError } from '../../lib/supabase';
import type { ClientType, Interest, LeadSource, Opportunity } from '../../lib/types';
import { parseCurrencyInput } from '../../utils/parsing';
import type { OpportunityChanges } from '../services/api';
import { useAppData } from '../state/useAppData';

const toText = (value: number | null) => (value === null ? '' : String(value).replace('.', ','));

function parseDecimal(text: string): number | null | undefined {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const value = Number(trimmed.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(value) && value >= 0 ? value : undefined;
}

/** Dados do projeto solar: tudo opcional, editável a qualquer momento. */
export function ProjectDetails({ opportunity }: { opportunity: Opportunity }) {
  const { updateOpportunity } = useAppData();
  const { showToast } = useUI();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [value, setValue] = useState(String(opportunity.value).replace('.', ','));
  const [city, setCity] = useState(opportunity.city ?? '');
  const [clientType, setClientType] = useState<ClientType | ''>(opportunity.client_type ?? '');
  const [kwh, setKwh] = useState(toText(opportunity.monthly_kwh));
  const [kwp, setKwp] = useState(toText(opportunity.system_kwp));
  const [seller, setSeller] = useState(opportunity.seller ?? '');
  const [source, setSource] = useState<LeadSource | ''>(opportunity.lead_source ?? '');
  const [interest, setInterest] = useState<Interest | ''>(opportunity.interest ?? '');
  const [expires, setExpires] = useState(opportunity.proposal_expires_on ?? '');
  const [notes, setNotes] = useState(opportunity.notes ?? '');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsedValue = parseCurrencyInput(value);
    const parsedKwh = parseDecimal(kwh);
    const parsedKwp = parseDecimal(kwp);

    if (parsedValue === null || parsedValue <= 0) return setError('Informe um valor de projeto válido.');
    if (parsedKwh === undefined) return setError('Consumo médio inválido.');
    if (parsedKwp === undefined) return setError('Potência estimada inválida.');
    setError(null);

    const changes: OpportunityChanges = {
      value: parsedValue,
      city: city.trim() || null,
      client_type: clientType || null,
      monthly_kwh: parsedKwh,
      system_kwp: parsedKwp,
      seller: seller.trim() || null,
      lead_source: source || null,
      interest: interest || null,
      proposal_expires_on: expires || null,
      notes: notes.trim() || null,
    };

    setSaving(true);
    try {
      await updateOpportunity(opportunity.id, changes);
      showToast('Dados do projeto salvos.');
      setOpen(false);
    } catch (saveError) {
      showToast(friendlyError(saveError), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <details className="project-details" open={open} onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary>Dados do projeto</summary>
      <form className="project-form" onSubmit={(event) => void handleSubmit(event)} noValidate>
        <FormField
          id="pd-value"
          label="Valor do projeto (R$)"
          inputMode="decimal"
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
        <FormField id="pd-city" label="Cidade" maxLength={80} value={city} onChange={(event) => setCity(event.target.value)} />
        <div className="field">
          <label htmlFor="pd-type">Tipo de cliente</label>
          <select id="pd-type" value={clientType} onChange={(event) => setClientType(event.target.value as ClientType | '')}>
            <option value="">Não informado</option>
            {(Object.keys(clientTypeLabels) as ClientType[]).map((key) => (
              <option key={key} value={key}>
                {clientTypeLabels[key]}
              </option>
            ))}
          </select>
        </div>
        <FormField
          id="pd-kwh"
          label="Consumo médio (kWh/mês)"
          inputMode="decimal"
          value={kwh}
          onChange={(event) => setKwh(event.target.value)}
        />
        <FormField
          id="pd-kwp"
          label="Potência estimada (kWp)"
          inputMode="decimal"
          value={kwp}
          onChange={(event) => setKwp(event.target.value)}
        />
        <FormField
          id="pd-seller"
          label="Vendedor responsável"
          maxLength={60}
          value={seller}
          onChange={(event) => setSeller(event.target.value)}
        />
        <div className="field">
          <label htmlFor="pd-source">Origem do lead</label>
          <select id="pd-source" value={source} onChange={(event) => setSource(event.target.value as LeadSource | '')}>
            <option value="">Não informada</option>
            {(Object.keys(leadSourceLabels) as LeadSource[]).map((key) => (
              <option key={key} value={key}>
                {leadSourceLabels[key]}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="pd-interest">Nível de interesse</label>
          <select id="pd-interest" value={interest} onChange={(event) => setInterest(event.target.value as Interest | '')}>
            <option value="">Não avaliado</option>
            {(Object.keys(interestLabels) as Interest[]).map((key) => (
              <option key={key} value={key}>
                {interestLabels[key]}
              </option>
            ))}
          </select>
        </div>
        <FormField
          id="pd-expires"
          label="Validade da proposta"
          type="date"
          value={expires}
          onChange={(event) => setExpires(event.target.value)}
        />
        <div className="field project-form-wide">
          <label htmlFor="pd-notes">Observações</label>
          <textarea id="pd-notes" maxLength={2000} value={notes} onChange={(event) => setNotes(event.target.value)} />
        </div>

        {error && (
          <p className="field-error project-form-wide" role="alert">
            {error}
          </p>
        )}
        <div className="project-form-wide">
          <button type="submit" className="btn btn-secondary btn-sm" disabled={saving}>
            {saving && <Loader2 className="spin" size={16} aria-hidden="true" />}
            Salvar dados do projeto
          </button>
        </div>
      </form>
    </details>
  );
}
