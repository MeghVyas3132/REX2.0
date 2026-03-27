"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/lib/api/client";
import { clearStoredToken, getStoredToken, setStoredToken } from "@/lib/auth/token-storage";
import type { AuthUser } from "@/lib/api/types";

type SessionContextValue = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  signIn: (token: string, user: AuthUser) => void;
  signOut: () => void;
  refreshUser: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const signOut = useCallback(() => {
    setUser(null);
    setToken(null);
    clearStoredToken();
  }, []);

  const signIn = useCallback((nextToken: string, nextUser: AuthUser) => {
    setToken(nextToken);
    setUser(nextUser);
    setStoredToken(nextToken);
  }, []);

  const refreshUser = useCallback(async () => {
    const storedToken = getStoredToken();
    if (!storedToken) {
      signOut();
      return;
    }

    type MeResponse = { user: AuthUser };
    try {
      const data = await apiRequest<MeResponse>("/api/auth/me");
      setToken(storedToken);
      setUser(data.user);
    } catch {
      signOut();
    }
  }, [signOut]);

  useEffect(() => {
    let active = true;

    const init = async () => {
      const storedToken = getStoredToken();
      if (!storedToken) {
        if (active) setLoading(false);
        return;
      }

      await refreshUser();
      if (active) setLoading(false);
    };

    void init();

    return () => {
      active = false;
    };
  }, [refreshUser]);

  const value = useMemo(
    () => ({ user, token, loading, signIn, signOut, refreshUser }),
    [user, token, loading, signIn, signOut, refreshUser],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within AuthProvider");
  }

  return context;
}
