import { createContext } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { Profile, ProfileUpdate } from '../lib/types';

export interface AuthContextValue {
  /** `undefined` enquanto a sessão ainda está sendo carregada. */
  session: Session | null | undefined;
  profile: Profile | null;
  profileLoading: boolean;
  updateProfile: (changes: ProfileUpdate) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
