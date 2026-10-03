import { useEffect, useState } from 'react';
import { api, type User } from '../lib/api';

export const useSession = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    const expired = () => setUser(null);
    window.addEventListener('session-expired', expired);
    void api
      .refresh()
      .then((session) => setUser(session.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
    return () => window.removeEventListener('session-expired', expired);
  }, []);
  const authenticate = async (
    mode: 'login' | 'register',
    email: string,
    password: string,
    rememberMe: boolean
  ) => {
    setError('');
    setLoading(true);
    try {
      const result = await api[mode](email, password, rememberMe);
      setUser(result.user);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No fue posible iniciar la sesión');
    } finally {
      setLoading(false);
    }
  };
  return {
    user,
    loading,
    error,
    login: (email: string, password: string, rememberMe: boolean) =>
      authenticate('login', email, password, rememberMe),
    register: (email: string, password: string, rememberMe: boolean) =>
      authenticate('register', email, password, rememberMe),
    logout: async () => {
      await api.logout();
      setUser(null);
    }
  };
};
