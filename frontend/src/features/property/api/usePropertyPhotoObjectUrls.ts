import { useQueries } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';

import { usePublicConfig } from '@/shared/config/PublicConfigContext';

import type { PropertySummary } from '../model/Property';
import { fetchPropertyPhotoContent } from './photoApi';
import { propertyQueryKeys } from './propertyQueryKeys';

type CachedObjectUrl = {
  photoId: number;
  url: string;
};

/**
 * 매물 대표 사진을 인증 요청으로 받아 blob URL로 돌려준다.
 * 지도 마커는 React 밖에서 DOM으로 만들기 때문에 인증이 끝난 URL만 넘겨야 한다.
 */
export const usePropertyPhotoObjectUrls = (properties: PropertySummary[]): Record<number, string> => {
  const config = usePublicConfig();
  const targets = useMemo(
    () =>
      properties
        .filter((property) => property.representativePhoto !== null)
        .map((property) => ({
          propertyId: property.propertyId,
          photoId: property.representativePhoto!.photoId,
          contentUrl: property.representativePhoto!.contentUrl,
        })),
    [properties],
  );

  const results = useQueries({
    queries: targets.map((target) => ({
      queryKey: propertyQueryKeys.photoContent(target.propertyId, target.photoId),
      queryFn: ({ signal }: { signal: AbortSignal }) => fetchPropertyPhotoContent(config, target.contentUrl, signal),
      staleTime: Number.POSITIVE_INFINITY,
      gcTime: 0,
    })),
  });

  const targetsRef = useRef(targets);
  targetsRef.current = targets;
  const blobsRef = useRef<Array<Blob | undefined>>([]);
  blobsRef.current = results.map((result) => result.data);

  const cacheRef = useRef(new Map<number, CachedObjectUrl>());
  const [objectUrls, setObjectUrls] = useState<Record<number, string>>({});

  // 사진이 새로 도착했거나 대표 사진 구성이 바뀔 때만 캐시를 갱신한다.
  const loadedSignature = targets
    .map((target, index) => `${target.propertyId}:${target.photoId}:${blobsRef.current[index] === undefined ? 0 : 1}`)
    .join('|');

  useEffect(() => {
    const cache = cacheRef.current;
    const activePropertyIds = new Set(targetsRef.current.map((target) => target.propertyId));
    let changed = false;

    targetsRef.current.forEach((target, index) => {
      const cached = cache.get(target.propertyId);
      if (cached !== undefined && cached.photoId !== target.photoId) {
        URL.revokeObjectURL(cached.url);
        cache.delete(target.propertyId);
        changed = true;
      }

      const blob = blobsRef.current[index];
      if (blob === undefined || cache.has(target.propertyId)) return;
      cache.set(target.propertyId, { photoId: target.photoId, url: URL.createObjectURL(blob) });
      changed = true;
    });

    cache.forEach((cached, propertyId) => {
      if (activePropertyIds.has(propertyId)) return;
      URL.revokeObjectURL(cached.url);
      cache.delete(propertyId);
      changed = true;
    });

    if (changed) {
      setObjectUrls(Object.fromEntries([...cache].map(([propertyId, cached]) => [propertyId, cached.url])));
    }
  }, [loadedSignature]);

  useEffect(
    () => () => {
      cacheRef.current.forEach(({ url }) => URL.revokeObjectURL(url));
      cacheRef.current.clear();
    },
    [],
  );

  return objectUrls;
};
