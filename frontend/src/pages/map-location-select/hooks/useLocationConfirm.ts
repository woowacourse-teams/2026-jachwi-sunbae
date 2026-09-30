import { useNavigate } from 'react-router-dom';

import type { MapAddress } from '@/features/map/model/Map';
import type { PropertyInputDto } from '@/features/property/api/dtos/PropertyDto';
import { usePropertyList } from '@/features/property/api/useProperties';
import { useCreateProperty } from '@/features/property/api/usePropertyMutations';
import { trackPostHogEvent } from '@/shared/lib/analytics/posthog';

type UseLocationConfirmOptions = {
  returnTo: string;
  registrationDraft: PropertyInputDto | undefined;
};

/**
 * 고른 위치를 확정한다.
 * 등록 초안을 들고 왔다면 바로 매물을 만들고, 아니면 위치를 들고 이전 폼으로 돌아간다.
 */
const useLocationConfirm = ({ returnTo, registrationDraft }: UseLocationConfirmOptions) => {
  const navigate = useNavigate();
  const properties = usePropertyList();
  const createProperty = useCreateProperty();

  const confirm = (selected: MapAddress) => {
    const address = selected.roadAddress ?? selected.jibunAddress ?? selected.address;
    if (registrationDraft !== undefined) {
      void createProperty
        .mutateAsync({ ...registrationDraft, address, latitude: selected.latitude, longitude: selected.longitude })
        .then((created) => {
          trackPostHogEvent('property_created', {
            first_property: (properties.data?.pages[0]?.totalElements ?? 0) === 0,
          });
          navigate(`/properties/${created.propertyId}`, { replace: true });
        })
        .catch((error) =>
          trackPostHogEvent('property_creation_failed', { error_kind: error instanceof Error ? 'request' : 'unknown' }),
        );
      return;
    }
    navigate(returnTo, {
      replace: true,
      state: { address: address ?? '', latitude: selected.latitude, longitude: selected.longitude },
    });
  };

  return {
    confirm,
    isCreating: createProperty.isPending,
    hasCreateError: createProperty.isError,
  };
};

export default useLocationConfirm;
