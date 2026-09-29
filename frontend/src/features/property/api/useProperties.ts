import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { usePublicConfig } from '@/shared/config/PublicConfigContext';
import type { PublicConfig } from '@/shared/config/publicConfigTypes';

import { fetchPropertyPhotos } from './photoApi';
import {
  fetchProperties,
  fetchPropertyChecklistDetail,
  fetchPropertyChecklistOverview,
  fetchPropertyDetail,
  fetchPropertyMemo,
} from './propertyApi';
import { propertyQueryKeys } from './propertyQueryKeys';

export const usePropertyList = () => {
  const config = usePublicConfig();
  return useInfiniteQuery({
    queryKey: propertyQueryKeys.list(''),
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) => fetchProperties(config, { query: '', page: pageParam, size: 20 }, signal),
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.page + 1 : undefined),
  });
};

export const getPropertyDetailQueryOptions = (config: PublicConfig, propertyId: number) => ({
  queryKey: propertyQueryKeys.detail(propertyId),
  queryFn: ({ signal }: { signal: AbortSignal }) => fetchPropertyDetail(config, propertyId, signal),
});

export const usePropertyDetail = (propertyId: number) => {
  const config = usePublicConfig();
  return useQuery(getPropertyDetailQueryOptions(config, propertyId));
};

export const usePropertyMemo = (propertyId: number) => {
  const config = usePublicConfig();
  return useQuery({
    queryKey: propertyQueryKeys.memo(propertyId),
    queryFn: ({ signal }) => fetchPropertyMemo(config, propertyId, signal),
  });
};

export const usePropertyChecklistOverview = (propertyId: number) => {
  const config = usePublicConfig();
  return useQuery({
    queryKey: propertyQueryKeys.checklists(propertyId),
    queryFn: ({ signal }) => fetchPropertyChecklistOverview(config, propertyId, signal),
  });
};

export const usePropertyChecklistDetail = (propertyId: number, propertyChecklistId: number) => {
  const config = usePublicConfig();
  return useQuery({
    queryKey: propertyQueryKeys.checklist(propertyId, propertyChecklistId),
    queryFn: ({ signal }) => fetchPropertyChecklistDetail(config, propertyId, propertyChecklistId, signal),
  });
};

export const usePropertyPhotos = (propertyId: number) => {
  const config = usePublicConfig();
  return useQuery({
    queryKey: propertyQueryKeys.photos(propertyId),
    queryFn: ({ signal }) => fetchPropertyPhotos(config, propertyId, signal),
  });
};
