import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import * as authApi from '../api/auth';
import { setUnauthorizedHandler } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const clearSession = useCallback(() => {
    localStorage.removeItem('auth_token');
    setUser(null);
  }, []);

  // Any request anywhere in the app that comes back 401 routes here, so a
  // token going stale mid-session (expiry, backend restart, revocation)
  // reliably drops the user back to the login screen instead of leaving
  // pages stuck on failed requests.
  useEffect(() => {
    setUnauthorizedHandler(clearSession);
  }, [clearSession]);

  // On first load, a token in localStorage doesn't necessarily mean it's
  // still valid — confirm against /auth/me before trusting it.
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setLoading(false);
      return;
    }
    authApi
      .getCurrentUser()
      .then(setUser)
      .catch(() => clearSession())
      .finally(() => setLoading(false));
  }, [clearSession]);

  const login = useCallback(async (email, password) => {
    setError('');
    const { access_token } = await authApi.login(email, password);
    localStorage.setItem('auth_token', access_token);
    const me = await authApi.getCurrentUser();
    setUser(me);
    return me;
  }, []);

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const value = { user, loading, error, setError, login, logout, isAuthenticated: !!user };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
