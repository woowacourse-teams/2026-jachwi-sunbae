import { useQuery } from '@tanstack/react-query';
import { fetchCurrentMember } from './memberApi';
import { currentMemberQueryKey } from '../../../shared/api/queryClient';
import type { PublicConfig } from '../../../shared/config/publicConfigTypes';

export const getCurrentMemberQueryOptions = (config: PublicConfig) => ({
  queryKey: currentMemberQueryKey,
  queryFn: ({ signal }: { signal: AbortSignal }) => fetchCurrentMember(config, signal),
  staleTime: 5 * 60 * 1_000,
});

export const useCurrentMember = (config: PublicConfig, isEnabled = true) =>
  useQuery({
    ...getCurrentMemberQueryOptions(config),
    enabled: isEnabled,
  });
