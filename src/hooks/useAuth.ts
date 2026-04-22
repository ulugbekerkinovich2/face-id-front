import { useState, useEffect, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'https://face-id-admin.misterdev.uz/api';
const TOKEN_KEY = 'authToken';
const USER_KEY = 'authUser';

export interface AuthUser {
  username: string;
  role: string;
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
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
  const [loading, setLoading] = useState<boolean>(!!getToken());

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/check/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('invalid');
        const data = await res.json();
        const u: AuthUser = { username: data.username, role: data.role };
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
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { error: { message: data.error || `Xatolik (${res.status})` } };
      }
      localStorage.setItem(TOKEN_KEY, data.token);
      const u: AuthUser = { username: data.username, role: data.role };
      localStorage.setItem(USER_KEY, JSON.stringify(u));
      setUser(u);
      return { error: null };
    } catch (e: any) {
      return { error: { message: e?.message || 'Tarmoq xatoligi' } };
    }
  }, []);

  const signOut = useCallback(async () => {
    const token = getToken();
    clearAuth();
    setUser(null);
    if (token) {
      try {
        await fetch(`${API_BASE}/auth/logout/`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        /* ignore — token lokal o'chirildi */
      }
    }
  }, []);

  return { user, loading, signIn, signOut };
}
