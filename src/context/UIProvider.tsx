import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AuthModal } from '../components/AuthModal/AuthModal';
import { ToastRegion, type ToastMessage } from '../components/Toast/ToastRegion';
import type { PlanId } from '../data/pricing';
import { UIContext, type AuthMode, type AuthState } from './uiContext';

const TOAST_DURATION = 3600;

export function UIProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const nextToastId = useRef(0);
  const timers = useRef(new Map<number, number>());

  useEffect(() => {
    const activeTimers = timers.current;
    return () => activeTimers.forEach((timer) => window.clearTimeout(timer));
  }, []);

  const openAuth = useCallback((mode: AuthMode, planId: PlanId = 'free') => {
    setAuth({ mode, planId });
  }, []);

  const closeAuth = useCallback(() => setAuth(null), []);

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timer = timers.current.get(id);
    if (timer) window.clearTimeout(timer);
    timers.current.delete(id);
  }, []);

  const showToast = useCallback(
    (message: string) => {
      nextToastId.current += 1;
      const id = nextToastId.current;
      setToasts((current) => [...current.slice(-2), { id, message }]);
      timers.current.set(
        id,
        window.setTimeout(() => dismissToast(id), TOAST_DURATION),
      );
    },
    [dismissToast],
  );

  const value = useMemo(() => ({ openAuth, showToast }), [openAuth, showToast]);

  return (
    <UIContext.Provider value={value}>
      {children}
      <AuthModal state={auth} onClose={closeAuth} />
      <ToastRegion toasts={toasts} onDismiss={dismissToast} />
    </UIContext.Provider>
  );
}
