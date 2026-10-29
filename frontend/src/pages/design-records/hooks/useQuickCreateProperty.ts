import type { MapAddress } from '@/features/map/model/Map';
import { useCreateProperty } from '@/features/property/api/usePropertyMutations';
import { toQuickPropertyInput } from '@/features/property/lib/propertyForm';

type Options = {
  onCreated: (propertyId: number) => void;
  onError: () => void;
};

/**
 * 본 방 기록 지도에서 고른 위치로 등록 화면 없이 바로 매물을 만든다.
 * 이름은 `새 매물`, 보증금과 월세는 0으로 만들고 나머지는 상세에서 채운다.
 */
const useQuickCreateProperty = ({ onCreated, onError }: Options) => {
  const createProperty = useCreateProperty('map');

  const create = (location: MapAddress) => {
    if (createProperty.isPending) return;
    createProperty
      .mutateAsync(toQuickPropertyInput(location))
      .then((created) => onCreated(created.propertyId))
      .catch(onError);
  };

  return { create, isCreating: createProperty.isPending };
};

export default useQuickCreateProperty;
