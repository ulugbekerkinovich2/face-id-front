import { useState, useEffect, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_URL as string;
const USER_KEY = 'authUser';

export interface AuthUser {
  username: string;
  role: string;
  full_name?: string;
  permissions?: string[];
}

export function clearAuth() {
  localStorage.removeItem(USER_KEY);
}

function readStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(readStoredUser);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/check/`, { credentials: "include" });
        if (!res.ok) throw new Error('invalid');
        const data = await res.json();
        const u: AuthUser = {
          username: data.username, role: data.role,
          full_name: data.full_name || "",
          permissions: data.permissions || [],
        };
        setUser(u);
        localStorage.setItem(USER_KEY, JSON.stringify(u));
      } catch {
        clearAuth();
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();

    const onAuthExpired = () => {
      clearAuth();
      setUser(null);
    };
    window.addEventListener('auth:expired', onAuthExpired);
    return () => window.removeEventListener('auth:expired', onAuthExpired);
  }, []);

  const signIn = useCallback(async (username: string, password: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { error: { message: data.error || `Xatolik (${res.status})` } };
      }
      const u: AuthUser = {
        username: data.username, role: data.role,
        full_name: data.full_name || "",
        permissions: data.permissions || [],
      };
      localStorage.setItem(USER_KEY, JSON.stringify(u));
      setUser(u);
      return { error: null };
    } catch (e: any) {
      return { error: { message: e?.message || 'Tarmoq xatoligi' } };
    }
  }, []);

  const signOut = useCallback(async () => {
    clearAuth();
    setUser(null);
    try {
      await fetch(`${API_BASE}/auth/logout/`, { method: 'POST', credentials: 'include' });
    } catch {
      /* ignore */
    }
  }, []);

  return { user, loading, signIn, signOut };
}
