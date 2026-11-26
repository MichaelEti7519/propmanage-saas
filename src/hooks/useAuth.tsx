import React from 'react';

export type VerificationStatus = 'not_started' | 'pending' | 'verified' | 'rejected' | 'needs_review';

export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'tenant' | 'landlord' | 'admin';
  phone?: string | null;
  avatarUrl?: string | null;
  emailVerificationStatus?: VerificationStatus;
  adminMfaEnabled?: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  initializing: boolean;
  login: (user: AuthUser) => void;
  logout: () => void;
  updateUser: (patch: Partial<AuthUser>) => void;
  fetchWithAuth: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
}

const AUTH_USER_KEY = 'propmanage_user';
const LEGACY_TOKEN_KEYS = ['propmanage_token', 'propmanage_refresh_token'];

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);
let refreshInFlight: Promise<boolean> | null = null;

function clearStoredSession() {
  localStorage.removeItem(AUTH_USER_KEY);
  LEGACY_TOKEN_KEYS.forEach((key) => localStorage.removeItem(key));
}

function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

async function rotateSession() {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success) return false;
      if (data.user) localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user as AuthUser));
      return true;
    } catch {
      return false;
    }
  })().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(() => {
    if (typeof window === 'undefined') return null;
    return getStoredUser();
  });
  const [initializing, setInitializing] = React.useState(true);

  const logout = React.useCallback(() => {
    fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    }).catch(() => undefined);
    clearStoredSession();
    setUser(null);
  }, []);

  const login = React.useCallback((newUser: AuthUser) => {
    clearStoredSession();
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(newUser));
    setUser(newUser);
  }, []);

  const updateUser = React.useCallback((patch: Partial<AuthUser>) => {
    setUser((current) => {
      if (!current) return current;
      const next = { ...current, ...patch };
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const fetchWithAuth = React.useCallback(async (input: RequestInfo, init: RequestInit = {}) => {
    const send = () => {
      const headers = new Headers(init.headers ?? undefined);
      if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
      return fetch(input, { ...init, credentials: 'include', headers });
    };

    const response = await send();
    if (response.status !== 401) return response;
    if (!(await rotateSession())) {
      logout();
      return response;
    }
    return send();
  }, [logout]);

  React.useEffect(() => {
    let cancelled = false;
    async function validate() {
      try {
        let response = await fetch('/api/auth/me', { credentials: 'include' });
        if (response.status === 401 && await rotateSession()) {
          response = await fetch('/api/auth/me', { credentials: 'include' });
        }
        if (cancelled) return;
        if (!response.ok) {
          clearStoredSession();
          setUser(null);
          return;
        }
        const data = await response.json();
        if (data?.success && data?.user) {
          const currentUser = data.user as AuthUser;
          localStorage.setItem(AUTH_USER_KEY, JSON.stringify(currentUser));
          LEGACY_TOKEN_KEYS.forEach((key) => localStorage.removeItem(key));
          setUser(currentUser);
        } else {
          clearStoredSession();
          setUser(null);
        }
      } catch {
        if (!cancelled) {
          clearStoredSession();
          setUser(null);
        }
      } finally {
        if (!cancelled) setInitializing(false);
      }
    }
    void validate();
    return () => { cancelled = true; };
  }, []);

  return (
    <AuthContext.Provider value={{ user, initializing, login, logout, updateUser, fetchWithAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
