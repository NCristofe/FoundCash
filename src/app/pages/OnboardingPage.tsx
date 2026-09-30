import { useState } from 'react';
import { ArrowRight, CalendarCheck, PartyPopper } from 'lucide-react';
import { useAuth } from '../../auth/useAuth';
import { HELP_SESSION_URL, ONBOARDING_TARGET } from '../../config/app';
import { niche } from '../../config/niche';
import { useUI } from '../../context/useUI';
import { friendlyError } from '../../lib/supabase';
import { navigate } from '../../router/router';
import { formatCurrency } from '../../utils/format';
import { QuickEntryForm } from '../components/QuickEntryForm';
import { openOpportunities } from '../metrics';
import { useAppData } from '../state/useAppData';

/**
 * Boas-vindas: ajuda o usuário a cadastrar as primeiras 5 propostas paradas
 * e mostra, na hora, quanto dinheiro estava esquecido.
 */
export function OnboardingPage() {
  const { profile, updateProfile } = useAuth();
  const { opportunities } = useAppData();
  const { showToast } = useUI();
  const [finishing, setFinishing] = useState(false);

  const open = openOpportunities(opportunities);
  const count = Math.min(open.length, ONBOARDING_TARGET);
  const total = open.reduce((sum, item) => sum + item.value, 0);
  const done = open.length >= ONBOARDING_TARGET;
  const firstName = profile?.full_name.split(' ')[0] ?? '';

  const finish = async () => {
    setFinishing(true);
    try {
      await updateProfile({ onboarding_completed_at: new Date().toISOString() });
      navigate('/app', { replace: true });
    } catch (error) {
      showToast(friendlyError(error), 'error');
      setFinishing(false);
    }
  };

  return (
    <div className="onboarding">
      <header className="onboarding-head">
        <p className="page-kicker">Boas-vindas{firstName ? `, ${firstName}` : ''}</p>
        <h1 className="page-title">Vamos ligar o radar da sua operação comercial.</h1>
        <ol className="onboarding-steps" aria-label="Como funciona">
          <li>
            <strong>Cadastre</strong> suas oportunidades
          </li>
          <li>
            <strong>O FoundCash encontra</strong> o que precisa de atenção
          </li>
          <li>
            <strong>Recupere</strong> e acompanhe seu dinheiro em jogo
          </li>
        </ol>
        <p className="text-muted">
          {niche.onboardingPrompt} Cadastre as {ONBOARDING_TARGET} primeiras — leva menos de 15 segundos cada.
        </p>
      </header>

      <div
        className="onboarding-progress"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={ONBOARDING_TARGET}
        aria-valuenow={count}
        aria-label="Propostas cadastradas"
      >
        <div className="onboarding-progress-bar">
          <span style={{ width: `${(count / ONBOARDING_TARGET) * 100}%` }} />
        </div>
        <p>
          <strong>
            {count} de {ONBOARDING_TARGET}
          </strong>{' '}
          oportunidades · <span className="text-green">{formatCurrency(total)}</span> em jogo
        </p>
      </div>

      <div className="onboarding-grid">
        <section className="panel" aria-label="Cadastrar proposta">
          {done ? (
            <div className="onboarding-done" role="status">
              <PartyPopper size={40} aria-hidden="true" />
              <h2>Você tem {formatCurrency(total)} em jogo.</h2>
              <p className="text-muted">
                No painel, o radar mostra quanto desse valor está sem acompanhamento e quem precisa de contato hoje.
                Quando uma venda sair, marque “Fechou negócio”.
              </p>
              <button type="button" className="btn btn-primary btn-lg" disabled={finishing} onClick={finish}>
                Ir para o meu painel <ArrowRight className="icon-arrow" size={18} aria-hidden="true" />
              </button>
            </div>
          ) : (
            <QuickEntryForm idPrefix="onboarding" />
          )}
        </section>

        <aside className="onboarding-side">
          {open.length > 0 && (
            <div className="panel">
              <h2 className="panel-title">Já cadastradas</h2>
              <ul className="onboarding-list">
                {open.slice(0, 8).map((item) => (
                  <li key={item.id}>
                    <span>{item.client_name}</span>
                    <strong className="tabular">{formatCurrency(item.value)}</strong>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {HELP_SESSION_URL && (
            <div className="panel onboarding-help">
              <CalendarCheck size={22} aria-hidden="true" />
              <h2 className="panel-title">Quer ajuda para começar?</h2>
              <p className="text-muted">
                Agende uma sessão gratuita de 20 minutos e cadastramos suas propostas junto com você.
              </p>
              <a className="btn btn-secondary btn-sm" href={HELP_SESSION_URL} target="_blank" rel="noreferrer">
                Agendar sessão de ajuda
              </a>
            </div>
          )}

          {!done && (
            <button type="button" className="link-button" disabled={finishing} onClick={finish}>
              Pular por enquanto
            </button>
          )}
        </aside>
      </div>
    </div>
  );
}
