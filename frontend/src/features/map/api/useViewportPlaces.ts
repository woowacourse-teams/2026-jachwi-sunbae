import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { usePublicConfig } from '@/shared/config/PublicConfigContext';

import { isInBounds, type ViewportQuery, viewportTiles } from '../lib/mapViewportQuery';
import { fetchNearbyAgencies } from './agencyApi';
import { useViewportBusStops } from './useViewportBusStops';

/**
 * 지도 화면을 덮는 반경으로 공인중개사와 버스정류장을 함께 조회하고 화면 안의 것만 남긴다.
 * 정류장은 화면이 2km보다 넓으면 네 칸으로 나눠 가장자리까지 조회한다. 공인중개사는 카카오 조회를 아끼려 가운데 한 번만 조회한다.
 * 같은 화면이면 잠시 캐시해 카카오·정류장 조회를 줄이고, 지도를 옮기는 동안에는 이전 결과를 그대로 둔다.
 */
export const useViewportPlaces = (query: ViewportQuery | null) => {
  const config = usePublicConfig();
  const key = [config.apiBaseUrl, query?.center.latitude, query?.center.longitude, query?.radius];
  const agencies = useQuery({
    queryKey: ['viewport-agencies', ...key],
    queryFn: ({ signal }) =>
      fetchNearbyAgencies(config, query!.center.latitude, query!.center.longitude, query!.radius, signal),
    enabled: query !== null,
    staleTime: 5 * 60 * 1000,
    retry: false,
    placeholderData: keepPreviousData,
  });
  const bounds = query?.bounds;
  const tiles = useMemo(() => (bounds ? viewportTiles(bounds) : []), [bounds]);
  const busStops = useViewportBusStops(tiles, bounds ?? null, query !== null);
  const agencyData = agencies.data;
  const visibleAgencies = useMemo(
    () => (bounds ? (agencyData?.agencies ?? []).filter((agency) => isInBounds(agency, bounds)) : []),
    [agencyData, bounds],
  );
  return {
    agencies: visibleAgencies,
    busStops: busStops.busStops,
    isAgenciesLoading: query !== null && agencies.isFetching,
    agenciesFailed: agencies.isError && !agencies.isFetching,
    busStopsFailed: busStops.isError,
    refetch: () => Promise.all([agencies.refetch(), busStops.refetch()]),
  };
};
