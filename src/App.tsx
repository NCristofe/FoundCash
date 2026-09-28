import { AppShell } from './app/AppShell';
import { AuthProvider } from './auth/AuthProvider';
import { UIProvider } from './context/UIProvider';
import { AuthPage } from './pages/AuthPage/AuthPage';
import { LandingPage } from './pages/LandingPage/LandingPage';
import { NotFound } from './pages/NotFound/NotFound';
import { useLocation } from './router/router';

function Routes() {
  const { pathname } = useLocation();

  if (pathname === '/') return <LandingPage />;
  if (pathname === '/entrar') return <AuthPage key="login" mode="login" />;
  if (pathname === '/cadastro') return <AuthPage key="signup" mode="signup" />;
  if (pathname === '/recuperar-senha') return <AuthPage key="forgot" mode="forgot" />;
  if (pathname === '/redefinir-senha') return <AuthPage key="reset" mode="reset" />;
  if (pathname === '/app' || pathname.startsWith('/app/')) return <AppShell pathname={pathname} />;
  return <NotFound />;
}

export default function App() {
  return (
    <UIProvider>
      <AuthProvider>
        <Routes />
      </AuthProvider>
    </UIProvider>
  );
}
