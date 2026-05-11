import { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import { AuthResponse, User } from '../types';
import { api } from './AxiosProvider';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  register: (
    name: string,
    email: string,
    password: string,
    role: User['role'],
    preferred_language: string
  ) => Promise<AuthResponse>;
  logout: () => void;
}

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

export const AuthContext = createContext<AuthContextValue | null>(null);

/** Read session once at module load so the first paint has `user`/`token` for i18n and routes. */
const initialSession = ((): { user: User | null; token: string | null } => {
  if (typeof window === 'undefined') return { user: null, token: null };
  try {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);
    return {
      token: storedToken,
      user: storedUser ? (JSON.parse(storedUser) as User) : null,
    };
  } catch {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    return { user: null, token: null };
  }
})();

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(initialSession.user);
  const [token, setToken] = useState<string | null>(initialSession.token);

  const persist = (next: AuthResponse): AuthResponse => {
    localStorage.setItem(TOKEN_KEY, next.token);
    localStorage.setItem(USER_KEY, JSON.stringify(next.user));
    setToken(next.token);
    setUser(next.user);
    return next;
  };

  const login = async (email: string, password: string): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>('/api/auth/login', { email, password });
    return persist(data);
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    role: User['role'],
    preferred_language: string
  ): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>('/api/auth/register', {
      name,
      email,
      password,
      role,
      preferred_language,
    });
    return persist(data);
  };

  const logout = (): void => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isLoading: false,
      isAuthenticated: token !== null,
      login,
      register,
      logout,
    }),
    [user, token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};
