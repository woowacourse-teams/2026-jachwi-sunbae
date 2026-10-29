import { useState } from 'react';

import { formatManwon } from '@/features/property/lib/propertyFormat';
import type { PropertyDetail } from '@/features/property/model/Property';
import InfoValue from '@/shared/ui/info-value/InfoValue';

import type { BasicEditField } from '../../model/editField';
import PropertyInfoSection from '../property-info-section/PropertyInfoSection';
import PropertyNameInput from './PropertyNameInput';

type PropertyBasicInfoSectionProps = {
  property: PropertyDetail;
  /** 누른 항목의 수정 시트를 상세 화면 위에 연다. 이름은 시트 없이 그 줄에서 고친다. */
  onEdit: (field: BasicEditField) => void;
};

/** 새 매물은 보증금과 월세를 0으로 만든다. 둘 다 0이면 아직 입력하지 않은 것으로 본다. */
const formatPrice = ({ depositAmount, monthlyRentAmount }: PropertyDetail): string =>
  depositAmount === 0 && monthlyRentAmount === 0
    ? ''
    : `${formatManwon(depositAmount)} / ${formatManwon(monthlyRentAmount)}`;

const PropertyBasicInfoSection = ({ property, onEdit }: PropertyBasicInfoSectionProps) => {
  const [isEditingName, setIsEditingName] = useState(false);

  return (
    <PropertyInfoSection title="기본 정보" label="매물 기본 정보">
      <InfoValue
        label="매물 이름"
        value={property.name}
        onEdit={() => setIsEditingName(true)}
        editor={
          isEditingName ? <PropertyNameInput property={property} onDone={() => setIsEditingName(false)} /> : undefined
        }
      />
      <InfoValue
        label="보증금 / 월세"
        value={formatPrice(property)}
        emptyText="보증금과 월세를 입력해 주세요"
        onEdit={() => onEdit('price')}
      />
      <InfoValue
        label="주소"
        value={property.location.address ?? ''}
        emptyText="주소를 입력해 주세요"
        onEdit={() => onEdit('location')}
      />
    </PropertyInfoSection>
  );
};

export default PropertyBasicInfoSection;
