import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL ?? 'https://jttwmccqqshdltafaaze.supabase.co';
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? 'sb_publishable_S8sg7VDBv8Dh6pt3hgylJg_FQzX5ftv';

/** `null` quando as variáveis de ambiente não foram configuradas (a landing continua funcionando). */
export const supabase: SupabaseClient | null = url && anonKey ? createClient(url, anonKey) : null;

export const isBackendConfigured = supabase !== null;

export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error('Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env.local.');
  }
  return supabase;
}

/** Converte erros do Supabase/Postgres em mensagens para o usuário. */
export function friendlyError(error: unknown): string {
  let message = String(error);
  if (error instanceof Error) message = error.message;
  else if (typeof error === 'object' && error && 'message' in error) {
    message = String((error as { message: unknown }).message);
  }

  if (message.includes('LIMITE_PLANO')) {
    return 'Você atingiu o limite de oportunidades abertas do plano Essencial. Feche algumas ou mude para o Pro.';
  }
  if (message.includes('Invalid login credentials')) return 'E-mail ou senha incorretos.';
  if (message.includes('User already registered')) return 'Já existe uma conta com este e-mail. Tente entrar.';
  if (message.includes('Email not confirmed')) return 'Confirme seu e-mail pelo link que enviamos antes de entrar.';
  if (message.includes('Password should be')) return 'A senha deve ter pelo menos 6 caracteres.';
  if (message.includes('Failed to fetch')) return 'Sem conexão com o servidor. Verifique sua internet.';
  return 'Algo deu errado. Tente novamente.';
}
