import * as SecureStore from 'expo-secure-store';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

interface Session {
  accessToken: string;
  refreshToken: string;
}

interface AuthContextShape {
  userId: string | null;
  session: Session | null;
  setAuth: (userId: string, session: Session) => Promise<void>;
}

const AuthContext = createContext<AuthContextShape | null>(null);

const SESSION_KEY = 'gymbros.session';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    SecureStore.getItemAsync(SESSION_KEY).then((raw) => {
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw) as { userId: string; session: Session };
      setUserId(parsed.userId);
      setSession(parsed.session);
    }).catch(() => undefined);
  }, []);

  const value = useMemo<AuthContextShape>(() => ({
    userId,
    session,
    setAuth: async (nextUserId, nextSession) => {
      setUserId(nextUserId);
      setSession(nextSession);
      await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify({ userId: nextUserId, session: nextSession }));
    }
  }), [session, userId]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
