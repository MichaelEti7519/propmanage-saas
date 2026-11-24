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
  token: string | null;
  initializing: boolean;
  login: (user: AuthUser, token: string, refreshToken?: string) => void;
  logout: () => void;
  updateUser: (patch: Partial<AuthUser>) => void;
  fetchWithAuth: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
}

const AUTH_TOKEN_KEY = 'propmanage_token';
const AUTH_REFRESH_KEY = 'propmanage_refresh_token';
const AUTH_USER_KEY = 'propmanage_user';

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

// A rotation invalidates the token it was handed, so two screens hitting 401 at the same moment must
// share one refresh request. A second concurrent rotation would look like token theft to the server
// and would sign the user out of everything.
let refreshInFlight: Promise<string | null> | null = null;

function clearStoredSession() {
  localStorage.removeItem(AUTH_USER_KEY);
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_REFRESH_KEY);
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

function getStoredToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

function getStoredRefreshToken(): string | null {
  return localStorage.getItem(AUTH_REFRESH_KEY);
}

// Exchanges the refresh token for a new pair. Returns null when the session is genuinely over.
async function rotateSession(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;

  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) return null;

  refreshInFlight = (async () => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success || !data.token || !data.refreshToken) {
        clearStoredSession();
        return null;
      }

      localStorage.setItem(AUTH_TOKEN_KEY, data.token);
      localStorage.setItem(AUTH_REFRESH_KEY, data.refreshToken);
      if (data.user) localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user as AuthUser));
      return data.token as string;
    } catch {
      // A network failure is not proof the session is dead, so the tokens are left in place.
      return null;
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
  const [token, setToken] = React.useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return getStoredToken();
  });
  const [initializing, setInitializing] = React.useState(true);

  const logout = React.useCallback(() => {
    const refreshToken = getStoredRefreshToken();
    const authToken = getStoredToken();

    if (refreshToken || authToken) {
      // Fire and forget: the local session is cleared either way, because a user who clicked
      // "sign out" must end up signed out even if the network is down.
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({ refreshToken }),
      }).catch(() => undefined);
    }

    clearStoredSession();
    setUser(null);
    setToken(null);
  }, []);

  const login = React.useCallback((newUser: AuthUser, newToken: string, newRefreshToken?: string) => {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(newUser));
    localStorage.setItem(AUTH_TOKEN_KEY, newToken);
    if (newRefreshToken) {
      localStorage.setItem(AUTH_REFRESH_KEY, newRefreshToken);
    } else {
      localStorage.removeItem(AUTH_REFRESH_KEY);
    }
    setUser(newUser);
    setToken(newToken);
  }, []);

  // Merge edited profile fields into the session so avatars and names update everywhere
  // without a re-login. The stored copy keeps the refresh path showing the latest values.
  const updateUser = React.useCallback((patch: Partial<AuthUser>) => {
    setUser((current) => {
      if (!current) return current;
      const next = { ...current, ...patch };
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const fetchWithAuth = React.useCallback(
    async (input: RequestInfo, init: RequestInit = {}) => {
      const send = (authToken: string | null) => {
        const headers = new Headers(init.headers ?? undefined);
        if (authToken) {
          headers.set('Authorization', `Bearer ${authToken}`);
        }
        headers.set('Content-Type', headers.get('Content-Type') || 'application/json');
        return fetch(input, { ...init, headers });
      };

      // localStorage is the source of truth: a rotation replaces the token outside React state.
      const response = await send(getStoredToken() ?? token);
      if (response.status !== 401) return response;

      const refreshed = await rotateSession();
      if (!refreshed) return response;

      setToken(refreshed);
      return send(refreshed);
    },
    [token]
  );

  React.useEffect(() => {
    let cancelled = false;

    async function validate() {
      const storedToken = getStoredToken();
      const storedUser = getStoredUser();

      if (!storedToken || !storedUser) {
        setInitializing(false);
        return;
      }

      const fetchMe = (authToken: string) =>
        fetch('/api/auth/me', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        });

      try {
        let response = await fetchMe(storedToken);

        // An expired access token is the normal case after a page reload, not a signed-out user.
        if (response.status === 401 && getStoredRefreshToken()) {
          const refreshed = await rotateSession();
          if (refreshed) response = await fetchMe(refreshed);
        }

        if (cancelled) return;

        if (!response.ok) {
          logout();
          return;
        }

        const data = await response.json();
        if (data?.success && data?.user) {
          const refreshedUser = data.user as AuthUser;
          localStorage.setItem(AUTH_USER_KEY, JSON.stringify(refreshedUser));
          setUser(refreshedUser);
          setToken(getStoredToken());
        } else {
          logout();
        }
      } catch {
        logout();
      } finally {
        if (!cancelled) setInitializing(false);
      }
    }

    validate();
    return () => {
      cancelled = true;
    };
  }, [logout]);

  return (
    <AuthContext.Provider value={{ user, token, initializing, login, logout, updateUser, fetchWithAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
