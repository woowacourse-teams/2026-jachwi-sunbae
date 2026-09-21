import { useQueries } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { fetchPropertyPhotoContent } from '../../apis/photoApi';
import { propertyQueryKeys } from '../../app/propertyQueryKeys';
import type { PropertySummary } from '../../types/Property';
import type { PublicConfig } from '../../types/PublicConfig';

/**
 * 매물 대표 사진을 인증 요청으로 받아 blob URL로 돌려준다.
 * 지도 마커는 React 밖에서 DOM으로 만들기 때문에 인증이 끝난 URL만 넘겨야 한다.
 */
export const usePropertyPhotoObjectUrls = (
  config: PublicConfig,
  properties: PropertySummary[],
): Record<number, string> => {
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

  // 불러온 사진 구성이 바뀔 때만 URL을 다시 만들고, 이전 URL은 정리한다.
  const loadedSignature = targets
    .map((target, index) => `${target.propertyId}:${target.photoId}:${blobsRef.current[index] === undefined ? 0 : 1}`)
    .join('|');
  const [objectUrls, setObjectUrls] = useState<Record<number, string>>({});

  useEffect(() => {
    const created: string[] = [];
    const next: Record<number, string> = {};
    targetsRef.current.forEach((target, index) => {
      const blob = blobsRef.current[index];
      if (blob === undefined) return;
      const objectUrl = URL.createObjectURL(blob);
      created.push(objectUrl);
      next[target.propertyId] = objectUrl;
    });
    setObjectUrls(next);

    return () => {
      created.forEach((objectUrl) => URL.revokeObjectURL(objectUrl));
    };
  }, [loadedSignature]);

  return objectUrls;
};
