"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import type { AuthUserClient } from "@/lib/api";

interface AuthContextType {
  user: AuthUserClient | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: AuthUserClient) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUserClient | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("rex_token");
    const storedUser = localStorage.getItem("rex_user");
    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        setUser(JSON.parse(storedUser) as AuthUserClient);
      } catch {
        localStorage.removeItem("rex_token");
        localStorage.removeItem("rex_user");
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback((newToken: string, newUser: AuthUserClient) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("rex_token", newToken);
    localStorage.setItem("rex_user", JSON.stringify(newUser));
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("rex_token");
    localStorage.removeItem("rex_user");
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
