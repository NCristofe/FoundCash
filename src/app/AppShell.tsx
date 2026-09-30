import { useEffect, useState, type ReactNode } from 'react';
import { Loader2, LogOut, Menu, Plus, X } from 'lucide-react';
import { useAuth } from '../auth/useAuth';
import { LogoMark } from '../components/common/Logo';
import { isBackendConfigured } from '../lib/supabase';
import type { Profile } from '../lib/types';
import { Link } from '../router/Link';
import { navigate } from '../router/router';
import { DashboardPage } from './pages/DashboardPage';
import { LossesPage } from './pages/LossesPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { ReportPage } from './pages/ReportPage';
import { ScriptsPage } from './pages/ScriptsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AppDataProvider } from './state/AppDataProvider';
import { useAppData } from './state/useAppData';
import './theme.css';
import './app.css';
import './radar.css';

const navItems = [
  { to: '/app', label: 'Radar' },
  { to: '/app/relatorio', label: 'Relatório' },
  { to: '/app/scripts', label: 'Scripts' },
  { to: '/app/perdas', label: 'Perdas' },
  { to: '/app/configuracoes', label: 'Configurações' },
];

function FullScreenMessage({ children }: { children: ReactNode }) {
  return (
    <div className="fc-app">
      <main className="app-fullscreen">
        <LogoMark size={40} />
        {children}
      </main>
    </div>
  );
}

/** Garante sessão + perfil antes de renderizar o app. */
export function AppShell({ pathname }: { pathname: string }) {
  const { session, profile, profileLoading, profileError } = useAuth();

  useEffect(() => {
    if (session === null) {
      navigate('/entrar', { replace: true });
    }
  }, [session]);

  if (!isBackendConfigured) {
    return (
      <FullScreenMessage>
        <h1>Backend não configurado</h1>
        <p className="text-muted">Defina as variáveis do Supabase no .env.local (veja o README).</p>
        <Link to="/" className="btn btn-secondary">
          Voltar ao site
        </Link>
      </FullScreenMessage>
    );
  }

  if (session === undefined || session === null || profileLoading) {
    return (
      <FullScreenMessage>
        <Loader2 className="spin" size={24} aria-label="Carregando" />
      </FullScreenMessage>
    );
  }

  if (!profile) {
    return (
      <FullScreenMessage>
        <h1>Não foi possível carregar sua conta</h1>
        <p className="text-muted">{profileError ?? 'Perfil não encontrado.'}</p>
        <button type="button" className="btn btn-secondary" onClick={() => window.location.reload()}>
          Tentar novamente
        </button>
      </FullScreenMessage>
    );
  }

  return (
    <div className="fc-app">
      <AppDataProvider>
        <AppLayout pathname={pathname} profile={profile} />
      </AppDataProvider>
    </div>
  );
}

function trialDaysLeft(profile: Profile): number {
  return Math.ceil((new Date(profile.trial_ends_at).getTime() - Date.now()) / 86_400_000);
}

function AppLayout({ pathname, profile }: { pathname: string; profile: Profile }) {
  const { signOut } = useAuth();
  const { openQuickEntry } = useAppData();
  const [menuOpen, setMenuOpen] = useState(false);
  const isOnboarding = pathname === '/app/boas-vindas';

  // Primeiro acesso: leva ao onboarding das 5 primeiras oportunidades.
  useEffect(() => {
    if (!profile.onboarding_completed_at && pathname === '/app') {
      navigate('/app/boas-vindas', { replace: true });
    }
  }, [profile.onboarding_completed_at, pathname]);

  // Atalho "N" abre a Entrada Rápida.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== 'n' || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement;
      if (target.closest('input, textarea, select, [contenteditable="true"], dialog[open]')) return;
      event.preventDefault();
      openQuickEntry();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [openQuickEntry]);

  useEffect(() => setMenuOpen(false), [pathname]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  const daysLeft = trialDaysLeft(profile);

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-container app-header-inner">
          <Link to="/app" className="app-brand" aria-label="FoundCash — painel">
            <LogoMark size={30} />
            <span>
              Found<span className="text-green">Cash</span>
            </span>
          </Link>

          {!isOnboarding && (
            <nav className={`app-nav ${menuOpen ? 'is-open' : ''}`} id="app-nav" aria-label="Menu do app">
              {navItems.map((item) => (
                <Link key={item.to} to={item.to} className="app-nav-link" activeClassName="is-active">
                  {item.label}
                </Link>
              ))}
              <button type="button" className="app-nav-link app-signout" onClick={handleSignOut}>
                <LogOut size={16} aria-hidden="true" /> Sair
              </button>
            </nav>
          )}

          <div className="app-header-actions">
            {!isOnboarding && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={openQuickEntry}
                aria-keyshortcuts="N"
                title="Nova oportunidade (atalho: N)"
              >
                <Plus size={18} aria-hidden="true" />
                <span className="app-hide-mobile">Nova oportunidade</span>
              </button>
            )}
            {!isOnboarding && (
              <button
                type="button"
                className="icon-button app-menu-toggle"
                aria-expanded={menuOpen}
                aria-controls="app-nav"
                aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
                onClick={() => setMenuOpen((open) => !open)}
              >
                {menuOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
              </button>
            )}
          </div>
        </div>
      </header>

      {!isOnboarding && (
        <p className={`app-trial ${daysLeft <= 3 ? 'is-urgent' : ''}`}>
          {daysLeft > 0
            ? `Teste grátis: ${daysLeft === 1 ? 'falta 1 dia' : `faltam ${daysLeft} dias`}.`
            : 'Seu teste grátis terminou. Fale com a gente para ativar sua assinatura.'}{' '}
          <Link to="/app/configuracoes">Ver plano</Link>
        </p>
      )}

      <main className="app-main app-container" id="conteudo">
        <AppRoutes pathname={pathname} />
      </main>
    </div>
  );
}

function AppRoutes({ pathname }: { pathname: string }) {
  switch (pathname) {
    case '/app':
      return <DashboardPage />;
    case '/app/boas-vindas':
      return <OnboardingPage />;
    case '/app/relatorio':
      return <ReportPage />;
    case '/app/scripts':
      return <ScriptsPage />;
    case '/app/perdas':
      return <LossesPage />;
    case '/app/configuracoes':
      return <SettingsPage />;
    default:
      return (
        <div className="app-empty">
          <h1>Página não encontrada</h1>
          <Link to="/app" className="btn btn-secondary">
            Voltar ao painel
          </Link>
        </div>
      );
  }
}
