import { useState, type FormEvent } from 'react';
import { Copy, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '../../auth/useAuth';
import { FormField } from '../../components/common/FormField';
import { builtInTemplates } from '../../config/niche';
import { useUI } from '../../context/useUI';
import { friendlyError } from '../../lib/supabase';
import type { MessageTemplate } from '../../lib/types';
import { ProLock } from '../components/ProLock';
import { deleteTemplate, saveTemplate } from '../services/api';
import { useAppData } from '../state/useAppData';

interface Draft {
  id?: string;
  title: string;
  body: string;
}

const emptyDraft: Draft = { title: '', body: '' };

export function ScriptsPage() {
  const { profile } = useAuth();
  const { customTemplates, setCustomTemplates } = useAppData();
  const { showToast } = useUI();
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [saving, setSaving] = useState(false);
  const isPro = profile?.plan === 'pro';

  const copy = async (template: MessageTemplate) => {
    try {
      await navigator.clipboard.writeText(template.body);
      showToast('Script copiado.');
    } catch {
      showToast('Não foi possível copiar.', 'error');
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.title.trim() || !draft.body.trim()) {
      showToast('Preencha o título e a mensagem.', 'error');
      return;
    }
    setSaving(true);
    try {
      const saved = await saveTemplate({ id: draft.id, title: draft.title.trim(), body: draft.body.trim() });
      setCustomTemplates(
        draft.id
          ? customTemplates.map((item) => (item.id === saved.id ? saved : item))
          : [...customTemplates, saved],
      );
      setDraft(emptyDraft);
      showToast(draft.id ? 'Script atualizado.' : 'Script criado.');
    } catch (error) {
      showToast(friendlyError(error), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTemplate(id);
      setCustomTemplates(customTemplates.filter((item) => item.id !== id));
      showToast('Script excluído.');
    } catch (error) {
      showToast(friendlyError(error), 'error');
    }
  };

  const renderCard = (template: MessageTemplate) => (
    <li key={template.id} className="script-card">
      <div className="script-card-head">
        <h3>{template.title}</h3>
        <div className="script-card-actions">
          <button type="button" className="icon-button" onClick={() => copy(template)} aria-label={`Copiar ${template.title}`}>
            <Copy size={16} aria-hidden="true" />
          </button>
          {!template.builtIn && isPro && (
            <>
              <button
                type="button"
                className="icon-button"
                onClick={() => setDraft({ id: template.id, title: template.title, body: template.body })}
                aria-label={`Editar ${template.title}`}
              >
                <Pencil size={16} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="icon-button"
                onClick={() => handleDelete(template.id)}
                aria-label={`Excluir ${template.title}`}
              >
                <Trash2 size={16} aria-hidden="true" />
              </button>
            </>
          )}
        </div>
      </div>
      <p>{template.body}</p>
    </li>
  );

  return (
    <div className="scripts">
      <header className="page-head">
        <div>
          <p className="page-kicker">Scripts de abordagem</p>
          <h1 className="page-title">Mensagens prontas para cada situação</h1>
          <p className="text-muted">
            Use <code>{'{cliente}'}</code> e <code>{'{valor}'}</code> — o FoundCash preenche na hora de enviar.
          </p>
        </div>
      </header>

      <section aria-labelledby="padrao-titulo">
        <h2 id="padrao-titulo" className="panel-title">
          Scripts padrão para energia solar
        </h2>
        <ul className="script-grid">{builtInTemplates.map(renderCard)}</ul>
      </section>

      <section aria-labelledby="meus-titulo" className="scripts-custom">
        <h2 id="meus-titulo" className="panel-title">
          Meus scripts
        </h2>
        {!isPro ? (
          <ProLock feature="Personalizar scripts" />
        ) : (
          <>
            {customTemplates.length > 0 && <ul className="script-grid">{customTemplates.map(renderCard)}</ul>}
            <form className="panel script-form" onSubmit={handleSubmit}>
              <h3 className="panel-title">{draft.id ? 'Editar script' : 'Novo script'}</h3>
              <FormField
                id="script-title"
                label="Título"
                maxLength={80}
                value={draft.title}
                onChange={(event) => setDraft({ ...draft, title: event.target.value })}
              />
              <div className="field">
                <label htmlFor="script-body">Mensagem</label>
                <textarea
                  id="script-body"
                  maxLength={2000}
                  value={draft.body}
                  onChange={(event) => setDraft({ ...draft, body: event.target.value })}
                />
              </div>
              <div className="quick-entry-actions">
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {draft.id ? 'Salvar alterações' : 'Criar script'}
                </button>
                {draft.id && (
                  <button type="button" className="btn btn-ghost" onClick={() => setDraft(emptyDraft)}>
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
