import React from 'react';

export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'tenant' | 'landlord' | 'admin';
  phone?: string | null;
  avatarUrl?: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  initializing: boolean;
  login: (user: AuthUser, token: string) => void;
  logout: () => void;
  updateUser: (patch: Partial<AuthUser>) => void;
  fetchWithAuth: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
}

const AUTH_TOKEN_KEY = 'propmanage_token';
const AUTH_USER_KEY = 'propmanage_user';

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

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
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setUser(null);
    setToken(null);
  }, []);

  const login = React.useCallback((newUser: AuthUser, newToken: string) => {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(newUser));
    localStorage.setItem(AUTH_TOKEN_KEY, newToken);
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
      const authToken = token || getStoredToken();
      const headers = new Headers(init.headers ?? undefined);
      if (authToken) {
        headers.set('Authorization', `Bearer ${authToken}`);
      }
      headers.set('Content-Type', headers.get('Content-Type') || 'application/json');
      return fetch(input, { ...init, headers });
    },
    [token]
  );

  React.useEffect(() => {
    async function validate() {
      const storedToken = getStoredToken();
      const storedUser = getStoredUser();

      if (!storedToken || !storedUser) {
        setInitializing(false);
        return;
      }

      try {
        const response = await fetch('/api/auth/me', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${storedToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          logout();
          setInitializing(false);
          return;
        }

        const data = await response.json();
        if (data?.success && data?.user) {
          const refreshedUser = data.user as AuthUser;
          localStorage.setItem(AUTH_USER_KEY, JSON.stringify(refreshedUser));
          setUser(refreshedUser);
          setToken(storedToken);
        } else {
          logout();
        }
      } catch {
        logout();
      } finally {
        setInitializing(false);
      }
    }

    validate();
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
