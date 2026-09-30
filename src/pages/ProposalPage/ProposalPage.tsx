import { useEffect, useRef, useState } from 'react';
import { LogoMark } from '../../components/common/Logo';
import { supabase } from '../../lib/supabase';
import { useLocation } from '../../router/router';
import type { ProposalResponse, PublicProposal } from '../../lib/types';
import { formatCurrency } from '../../utils/format';
import './ProposalPage.css';

const RESPONSE_OPTIONS: { key: ProposalResponse; label: string; sub: string; icon: string; cls: string }[] = [
  { key: 'quero_fechar', label: 'Quero fechar!', sub: 'Tenho interesse', icon: '🤝', cls: 'proposal-btn--fechar' },
  { key: 'duvida', label: 'Tenho uma dúvida', sub: 'Antes de decidir', icon: '💬', cls: 'proposal-btn--duvida' },
  { key: 'caro', label: 'Achei caro', sub: 'Quero negociar', icon: '💰', cls: 'proposal-btn--caro' },
  { key: 'pensar', label: 'Vou pensar', sub: 'Preciso de tempo', icon: '🤔', cls: 'proposal-btn--pensar' },
];

const RESPONSE_LABELS: Record<ProposalResponse, string> = {
  quero_fechar: 'Quero fechar!',
  duvida: 'Tenho uma dúvida',
  caro: 'Achei caro',
  pensar: 'Vou pensar',
};

const RESPONSE_ICONS: Record<ProposalResponse, string> = {
  quero_fechar: '🤝',
  duvida: '💬',
  caro: '💰',
  pensar: '🤔',
};

interface Props {
  token: string;
}

export function ProposalPage({ token }: Props) {
  const [proposal, setProposal] = useState<PublicProposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const tracked = useRef(false);
  const preview = useLocation().searchParams.get('preview') === '1';

  useEffect(() => {
    if (!token || tracked.current) return;
    tracked.current = true;

    const client = supabase;
    if (!client) {
      setError('Serviço indisponível. Tente novamente mais tarde.');
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const { data, error: rpcError } = await client.rpc('open_proposal', { p_token: token, p_track: !preview });
        if (rpcError) throw rpcError;
        const row = (data as PublicProposal[] | null)?.[0];
        if (!row) {
          setError('Link não encontrado. Verifique se o endereço está correto.');
        } else {
          setProposal({ ...row, value: Number(row.value) });
          if (row.response) setDone(true);
        }
      } catch {
        setError('Não consegui carregar a proposta. Tente novamente.');
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const handleRespond = async (response: ProposalResponse) => {
    if (!supabase || submitting || done || preview) return;
    setSubmitting(true);
    try {
      const { error: rpcError } = await supabase.rpc('respond_proposal', {
        p_token: token,
        p_response: response,
        p_note: note.trim() || null,
      });
      if (rpcError) throw rpcError;
      setProposal((prev) => (prev ? { ...prev, response, responded_at: new Date().toISOString() } : prev));
      setDone(true);
    } catch {
      alert('Não foi possível registrar sua resposta. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const pdfUrl = proposal?.file_path
    ? supabase?.storage.from('proposals').getPublicUrl(proposal.file_path).data.publicUrl
    : null;

  if (loading) {
    return (
      <div className="proposal-page">
        <div className="proposal-state">
          <LogoMark size={40} />
          <p>Carregando proposta…</p>
        </div>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="proposal-page">
        <div className="proposal-state">
          <LogoMark size={40} />
          <h1>Proposta não encontrada</h1>
          <p>{error ?? 'Este link pode ter expirado ou estar incorreto.'}</p>
        </div>
        <footer className="proposal-footer">
          Powered by <a href="/" target="_blank" rel="noreferrer">FoundCash</a>
        </footer>
      </div>
    );
  }

  return (
    <div className="proposal-page">
      <header className="proposal-header">
        <div className="proposal-header-info">
          {proposal.business_name && (
            <p className="proposal-header-business">{proposal.business_name}</p>
          )}
          <p className="proposal-header-client">Proposta para {proposal.client_name}</p>
        </div>
        {proposal.value > 0 && (
          <span className="proposal-value-chip">{formatCurrency(proposal.value)}</span>
        )}
      </header>

      {preview && (
        <p className="proposal-preview-banner" role="status">
          Pré-visualização: esta abertura não é contada e as respostas ficam desativadas.
        </p>
      )}

      <div className="proposal-viewer">
        {pdfUrl && (
          <iframe
            className="proposal-iframe"
            src={pdfUrl}
            title={`Proposta para ${proposal.client_name}`}
          />
        )}
      </div>

      {done ? (
        <div className="proposal-responded">
          <div className="proposal-responded-icon">
            {RESPONSE_ICONS[proposal.response!]}
          </div>
          <p className="proposal-responded-title">
            Resposta registrada: &ldquo;{RESPONSE_LABELS[proposal.response!]}&rdquo;
          </p>
          <p className="proposal-responded-note">
            Obrigado pelo retorno! O integrador já foi notificado e entrará em contato em breve.
          </p>
        </div>
      ) : (
        <div className="proposal-response-panel">
          <p className="proposal-response-title">O que você achou da proposta?</p>
          <p className="proposal-response-subtitle">
            Sua resposta vai diretamente para o integrador.
          </p>
          <div className="proposal-response-buttons">
            {RESPONSE_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                type="button"
                className={`proposal-btn ${opt.cls}`}
                disabled={submitting || preview}
                onClick={() => handleRespond(opt.key)}
              >
                <span className="proposal-btn-icon">{opt.icon}</span>
                <span>{opt.label}</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 400, opacity: 0.75 }}>{opt.sub}</span>
              </button>
            ))}
          </div>
          <div className="proposal-note-area">
            <textarea
              placeholder="Deixe uma mensagem opcional (dúvida, condição, observação…)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              disabled={submitting}
            />
          </div>
        </div>
      )}

      <footer className="proposal-footer">
        Powered by <a href="/" target="_blank" rel="noreferrer">FoundCash</a>
      </footer>
    </div>
  );
}
