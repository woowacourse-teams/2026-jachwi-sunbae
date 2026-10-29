import { formatManwon } from '@/features/property/lib/propertyFormat';
import type { PropertyDetail } from '@/features/property/model/Property';
import { roomOptionLabels, utilityOptionLabels } from '@/features/property/model/propertyOptions';
import InfoValue from '@/shared/ui/info-value/InfoValue';

import type { AdditionalEditField } from '../../model/editField';
import PropertyInfoSection from '../property-info-section/PropertyInfoSection';

type PropertyAdditionalInfoSectionProps = {
  property: PropertyDetail;
  /** 누른 항목의 수정 시트를 상세 화면 위에 연다. */
  onEdit: (field: AdditionalEditField) => void;
};

const formatDate = (value: string | null): string => value?.replace(/-/g, '.') ?? '';
// LocalDateTime은 초가 0이면 초 자리를 생략해서 온다. 초가 붙어 온 경우에만 잘라낸다.
const formatDateTime = (value: string | null): string =>
  value === null ? '' : value.replace('T', ' ').replace(/(\d{2}:\d{2}):\d{2}(?:\.\d+)?$/, '$1');

/** 새 매물 API가 돌려준 부가 정보를 그대로 표시하고, 줄을 누르면 그 항목만 상세 위 시트에서 고친다. */
const PropertyAdditionalInfoSection = ({ property, onEdit }: PropertyAdditionalInfoSectionProps) => (
  <PropertyInfoSection title="부가 정보" label="매물 부가 정보">
    <InfoValue
      label="입주 가능일"
      value={formatDate(property.availableMoveInDate)}
      onEdit={() => onEdit('availableMoveInDate')}
    />
    <InfoValue
      label="관리비"
      value={property.maintenanceFeeAmount === null ? '' : formatManwon(property.maintenanceFeeAmount)}
      onEdit={() => onEdit('maintenance')}
    />
    <InfoValue
      label="관리비 포함 공과금"
      value={utilityOptionLabels(property.utilityOptions)}
      onEdit={() => onEdit('maintenance')}
    />
    <InfoValue label="방 옵션" value={roomOptionLabels(property.roomOptions)} onEdit={() => onEdit('roomOptions')} />
    <InfoValue
      label="방문 일정"
      value={formatDateTime(property.visitScheduledAt)}
      onEdit={() => onEdit('visitScheduledAt')}
    />
    <InfoValue label="확인한 곳" value={property.discoverySource.value} onEdit={() => onEdit('discoverySource')} />
  </PropertyInfoSection>
);

export default PropertyAdditionalInfoSection;
