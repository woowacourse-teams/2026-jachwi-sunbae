import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

import { usePublicConfig } from '@/shared/config/PublicConfigContext';

import { fetchAdminMembers, isAdminUnauthorized } from './adminApi';

export const useAdminDashboard = (accessCode: string, onUnauthorized: () => void) => {
  const config = usePublicConfig();
  const members = useQuery({
    queryKey: ['admin', 'members'],
    queryFn: ({ signal }) => fetchAdminMembers(config, accessCode, signal),
  });
  useEffect(() => {
    if (isAdminUnauthorized(members.error)) onUnauthorized();
  }, [members.error, onUnauthorized]);
  return members;
};
