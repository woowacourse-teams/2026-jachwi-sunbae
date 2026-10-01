import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { usePublicConfig } from '@/shared/config/PublicConfigContext';

import { fetchPropertyPhotoContent } from './photoApi';
import { propertyQueryKeys } from './propertyQueryKeys';

export const useAuthenticatedPhoto = (propertyId: number, photoId: number, contentUrl: string) => {
  const config = usePublicConfig();
  const photoQuery = useQuery({
    queryKey: propertyQueryKeys.photoContent(propertyId, photoId),
    queryFn: ({ signal }) => fetchPropertyPhotoContent(config, contentUrl, signal),
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 0,
  });
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (photoQuery.data === undefined) {
      setObjectUrl(null);
      return;
    }

    const nextObjectUrl = URL.createObjectURL(photoQuery.data);
    setObjectUrl(nextObjectUrl);

    return () => {
      URL.revokeObjectURL(nextObjectUrl);
    };
  }, [photoQuery.data]);

  return { ...photoQuery, objectUrl };
};
