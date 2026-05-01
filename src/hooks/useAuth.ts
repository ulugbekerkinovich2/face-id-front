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
    let cancelled = false;
    const refresh = async (firstRun = false) => {
      try {
        const res = await fetch(`${API_BASE}/auth/check/`, { credentials: "include" });
        if (!res.ok) throw new Error('invalid');
        const data = await res.json();
        if (cancelled) return;
        const u: AuthUser = {
          username: data.username, role: data.role,
          full_name: data.full_name || "",
          permissions: data.permissions || [],
        };
        setUser(prev => {
          const same = prev
            && prev.username === u.username
            && prev.role === u.role
            && prev.full_name === u.full_name
            && (prev.permissions || []).join("|") === (u.permissions || []).join("|");
          if (same) return prev;
          localStorage.setItem(USER_KEY, JSON.stringify(u));
          return u;
        });
      } catch {
        if (cancelled) return;
        if (firstRun) {
          clearAuth();
          setUser(null);
        }
      } finally {
        if (firstRun && !cancelled) setLoading(false);
      }
    };

    refresh(true);
    // Permission/role o'zgartirilganda darhol ko'rinadi (har 30s + window focus + custom event)
    const interval = setInterval(() => refresh(false), 30_000);
    const onFocus = () => refresh(false);
    const onAuthRefresh = () => refresh(false);
    window.addEventListener('focus', onFocus);
    window.addEventListener('auth:refresh', onAuthRefresh);

    const onAuthExpired = () => {
      clearAuth();
      setUser(null);
    };
    window.addEventListener('auth:expired', onAuthExpired);
    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('auth:refresh', onAuthRefresh);
      window.removeEventListener('auth:expired', onAuthExpired);
    };
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
