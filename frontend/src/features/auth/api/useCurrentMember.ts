import { useQuery } from '@tanstack/react-query';

import { currentMemberQueryKey } from '@/shared/api/queryClient';
import { usePublicConfig } from '@/shared/config/PublicConfigContext';
import type { PublicConfig } from '@/shared/config/publicConfigTypes';

import { fetchCurrentMember } from './memberApi';

export const getCurrentMemberQueryOptions = (config: PublicConfig) => ({
  queryKey: currentMemberQueryKey,
  queryFn: ({ signal }: { signal: AbortSignal }) => fetchCurrentMember(config, signal),
  staleTime: 5 * 60 * 1_000,
});

export const useCurrentMember = (isEnabled = true) => {
  const config = usePublicConfig();
  return useQuery({
    ...getCurrentMemberQueryOptions(config),
    enabled: isEnabled,
  });
};
