import { createContext, useState, useContext, useEffect, useCallback, type ReactNode } from 'react';
import apiClient from '../api/apiClient';

export interface User {
  userId: number;
  email: string;
  name: string;
  role: 'PATIENT' | 'DOCTOR' | 'NURSE' | 'ADMIN';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(false);

  const persist = useCallback((u: User | null, t: string | null) => {
    setUser(u);
    setToken(t);
    if (t) localStorage.setItem('token', t);
    else localStorage.removeItem('token');
    if (u) localStorage.setItem('user', JSON.stringify(u));
    else localStorage.removeItem('user');
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await apiClient.post('/auth/login', { email, password });
      const { token: jwt, user: u } = res.data;
      persist(u, jwt);
    } finally {
      setLoading(false);
    }
  }, [persist]);

  const register = useCallback(async (name: string, email: string, password: string, role: string) => {
    setLoading(true);
    try {
      const res = await apiClient.post('/auth/register', { name, email, password, role });
      const { token: jwt, user: u } = res.data;
      persist(u, jwt);
    } finally {
      setLoading(false);
    }
  }, [persist]);

  const logout = useCallback(() => {
    persist(null, null);
  }, [persist]);

  useEffect(() => {
    if (token && !user) {
      apiClient.get('/auth/me').then((res) => {
        const u = res.data.user;
        persist(u, token);
      }).catch(() => persist(null, null));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
