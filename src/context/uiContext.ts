import { createContext } from 'react';

export interface UIContextValue {
  /** Exibe uma notificação curta e acessível. */
  showToast: (message: string, tone?: 'success' | 'error') => void;
}

export const UIContext = createContext<UIContextValue | null>(null);
