"use client";

import React from "react";

type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  username: string | null;
  role: "USER" | "ADMIN" | "SUPER_ADMIN";
  status: "PENDING_VERIFICATION" | "ACTIVE" | "SUSPENDED" | "DELETED";
};

type UserAuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  refreshSession: () => Promise<void>;
  logout: () => Promise<{ ok: boolean; error?: string }>;
};

const UserAuthContext = React.createContext<UserAuthContextValue | null>(null);

export function UserAuthProvider({
  children,
  initialUser,
}: {
  children: React.ReactNode;
  initialUser?: AuthUser | null;
}) {
  const [user, setUser] = React.useState<AuthUser | null>(initialUser ?? null);
  const [isLoading, setIsLoading] = React.useState(initialUser === undefined);

  const refreshSession = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/me", {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      });

      const data = (await response.json().catch(() => ({ user: null }))) as {
        user: AuthUser | null;
      };
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (initialUser !== undefined) return;
    void refreshSession();
  }, [initialUser, refreshSession]);

  const logout = React.useCallback(async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        return { ok: false, error: "Sesi gagal diakhiri. Silakan coba lagi." };
      }

      setUser(null);
      return { ok: true };
    } catch {
      return { ok: false, error: "Terjadi gangguan jaringan. Silakan coba lagi." };
    }
  }, []);

  const contextValue = React.useMemo<UserAuthContextValue>(
    () => ({
      user,
      isLoading,
      refreshSession,
      logout,
    }),
    [isLoading, logout, refreshSession, user],
  );

  return (
    <UserAuthContext.Provider value={contextValue}>
      {children}
    </UserAuthContext.Provider>
  );
}

export function useUserAuth() {
  const context = React.useContext(UserAuthContext);
  if (!context) {
    throw new Error("useUserAuth harus dipakai di dalam UserAuthProvider.");
  }
  return context;
}
