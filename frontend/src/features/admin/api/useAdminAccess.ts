import { useCallback, useState } from 'react';

import { usePublicConfig } from '@/shared/config/PublicConfigContext';

import { type AdminSummary, fetchAdminSummary } from './adminApi';

export const useAdminAccess = () => {
  const config = usePublicConfig();
  const [access, setAccess] = useState<{ code: string; summary: AdminSummary } | null>(null);
  const [isChanging, setIsChanging] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const logout = useCallback(() => {
    setAccess(null);
    setError(null);
  }, []);

  const login = async (code: string) => {
    if (isChanging) return;
    setIsChanging(true);
    setError(null);
    try {
      const summary = await fetchAdminSummary(config, code);
      setAccess({ code, summary });
    } catch (failure) {
      setError(failure);
    } finally {
      setIsChanging(false);
    }
  };

  return { access, isChanging, error, login, logout };
};
