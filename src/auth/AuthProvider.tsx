import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Profile, ProfileUpdate } from '../lib/types';
import { AuthContext } from './authContext';

interface ProfileState {
  /** Usuário ao qual o resultado se refere (evita usar dados de outra sessão). */
  userId: string;
  profile: Profile | null;
  error: string | null;
}

/** Antes da migração de segurança as colunas `desired_*` não existem: cai para o plano em uso. */
function normalizeProfile(row: Partial<Profile> | null): Profile | null {
  if (!row) return null;
  return {
    ...(row as Profile),
    desired_plan: row.desired_plan ?? row.plan ?? 'essencial',
    desired_cycle: row.desired_cycle ?? row.billing_cycle ?? 'monthly',
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(supabase ? undefined : null);
  const [profileState, setProfileState] = useState<ProfileState | null>(null);
  const userId = session?.user.id;

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!supabase || !userId) return;

    let cancelled = false;
    supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
      .then(({ data, error }) => {
        if (cancelled) return;
        setProfileState({ userId, profile: normalizeProfile(data), error: error?.message ?? null });
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const current = profileState && profileState.userId === userId ? profileState : null;
  const profile = current?.profile ?? null;
  const profileLoading = Boolean(userId) && !current;
  const profileError = current?.error ?? null;

  const updateProfile = useCallback(
    async (changes: ProfileUpdate) => {
      if (!supabase || !userId) return;
      const { data, error } = await supabase.from('profiles').update(changes).eq('id', userId).select('*').single();
      if (error) throw error;
      setProfileState({ userId, profile: normalizeProfile(data), error: null });
    },
    [userId],
  );

  const signOut = useCallback(async () => {
    await supabase?.auth.signOut();
  }, []);

  const value = useMemo(
    () => ({ session, profile, profileLoading, profileError, updateProfile, signOut }),
    [session, profile, profileLoading, profileError, updateProfile, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
