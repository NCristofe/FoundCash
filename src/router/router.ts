import { useMemo, useSyncExternalStore } from 'react';

/**
 * Roteador mínimo baseado na History API — suficiente para as poucas rotas
 * do app sem adicionar dependências.
 */

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener('popstate', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('popstate', listener);
  };
}

function getSnapshot() {
  return window.location.pathname + window.location.search;
}

export function navigate(to: string, options: { replace?: boolean } = {}) {
  if (to === getSnapshot()) return;
  if (options.replace) window.history.replaceState(null, '', to);
  else window.history.pushState(null, '', to);
  notify();
  window.scrollTo({ top: 0 });
}

export function useLocation() {
  const location = useSyncExternalStore(subscribe, getSnapshot);

  return useMemo(() => {
    const url = new URL(location, window.location.origin);
    return { pathname: url.pathname.replace(/\/+$/, '') || '/', searchParams: url.searchParams };
  }, [location]);
}
