import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ToastRegion, type ToastMessage } from '../components/Toast/ToastRegion';
import { UIContext } from './uiContext';

const TOAST_DURATION = 4000;

export function UIProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const nextToastId = useRef(0);
  const timers = useRef(new Map<number, number>());

  useEffect(() => {
    const activeTimers = timers.current;
    return () => activeTimers.forEach((timer) => window.clearTimeout(timer));
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timer = timers.current.get(id);
    if (timer) window.clearTimeout(timer);
    timers.current.delete(id);
  }, []);

  const showToast = useCallback(
    (message: string, tone: 'success' | 'error' = 'success') => {
      nextToastId.current += 1;
      const id = nextToastId.current;
      setToasts((current) => [...current.slice(-2), { id, message, tone }]);
      timers.current.set(
        id,
        window.setTimeout(() => dismissToast(id), TOAST_DURATION),
      );
    },
    [dismissToast],
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <UIContext.Provider value={value}>
      {children}
      <ToastRegion toasts={toasts} onDismiss={dismissToast} />
    </UIContext.Provider>
  );
}
