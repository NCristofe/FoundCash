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
        setProfileState({ userId, profile: (data as Profile | null) ?? null, error: error?.message ?? null });
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
      setProfileState({ userId, profile: data as Profile, error: null });
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
