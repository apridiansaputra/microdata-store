"use client";

import React from "react";

type AdminUser = {
  id: string;
  email: string;
  fullName: string;
  username: string | null;
  role: "USER" | "ADMIN" | "SUPER_ADMIN";
  status: "PENDING_VERIFICATION" | "ACTIVE" | "SUSPENDED" | "DELETED";
};

type AdminAuthContextValue = {
  user: AdminUser | null;
  isLoading: boolean;
  refreshSession: () => Promise<void>;
  logout: () => Promise<{ ok: boolean; error?: string }>;
};

const AdminAuthContext = React.createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({
  children,
  initialUser,
}: {
  children: React.ReactNode;
  initialUser?: AdminUser | null;
}) {
  const [user, setUser] = React.useState<AdminUser | null>(initialUser ?? null);
  const [isLoading, setIsLoading] = React.useState(initialUser === undefined);

  const refreshSession = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/admin/me", {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      });

      const data = (await response.json().catch(() => ({ user: null }))) as {
        user: AdminUser | null;
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
      const response = await fetch("/api/auth/admin/logout", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        return { ok: false, error: "Sesi admin gagal diakhiri. Silakan coba lagi." };
      }

      setUser(null);
      return { ok: true };
    } catch {
      return { ok: false, error: "Terjadi gangguan jaringan. Silakan coba lagi." };
    }
  }, []);

  const contextValue = React.useMemo<AdminAuthContextValue>(
    () => ({
      user,
      isLoading,
      refreshSession,
      logout,
    }),
    [isLoading, logout, refreshSession, user],
  );

  return (
    <AdminAuthContext.Provider value={contextValue}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = React.useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth harus dipakai di dalam AdminAuthProvider.");
  }
  return context;
}
