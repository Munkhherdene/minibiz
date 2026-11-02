import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import type { Session } from '@supabase/supabase-js';

import { queryClient } from '@/lib/query-client';
import { supabase } from '@/lib/supabase';

type AuthContextValue = {
  session: Session | null;
  isLoading: boolean;
  /**
   * True while the user is resetting a forgotten password. Verifying the recovery
   * code already creates a session, so the root guards keep the auth screens
   * visible until the new password is saved.
   */
  isRecoveringPassword: boolean;
  setRecoveringPassword: (value: boolean) => void;
};

const AuthContext = createContext<AuthContextValue>({
  session: null,
  isLoading: true,
  isRecoveringPassword: false,
  setRecoveringPassword: () => {},
});

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecoveringPassword, setRecoveringPassword] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsLoading(false);
    });

    // Keeps `session` in sync after sign in, sign up, sign out and token refresh.
    const { data } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      // Don't leave one user's business data in memory for the next user.
      if (event === 'SIGNED_OUT') queryClient.clear();
    });

    return () => data.subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{ session, isLoading, isRecoveringPassword, setRecoveringPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
