import { createContext } from 'react';
import type { PlanId } from '../data/pricing';

export type AuthMode = 'signup' | 'login';

export interface AuthState {
  mode: AuthMode;
  planId: PlanId;
}

export interface UIContextValue {
  /** Abre o modal de cadastro ou login (fluxo simulado nesta versão). */
  openAuth: (mode: AuthMode, planId?: PlanId) => void;
  /** Exibe uma notificação curta e acessível. */
  showToast: (message: string) => void;
}

export const UIContext = createContext<UIContextValue | null>(null);
