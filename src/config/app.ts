/** Quantas oportunidades o onboarding pede para cadastrar. */
export const ONBOARDING_TARGET = 5;

/** Quantas oportunidades aparecem no painel de prioridade. */
export const PRIORITY_COUNT = 3;

/** Link para a "sessão de ajuda" oferecida aos primeiros usuários (vazio = oculto). */
export const HELP_SESSION_URL = import.meta.env.VITE_HELP_SESSION_URL ?? '';

/** Atalhos de data de follow-up na Entrada Rápida. */
export const FOLLOW_UP_SHORTCUTS = [
  { label: 'Amanhã', days: 1 },
  { label: '3 dias', days: 3 },
  { label: '1 semana', days: 7 },
] as const;
