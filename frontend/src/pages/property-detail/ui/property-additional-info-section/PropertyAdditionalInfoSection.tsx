import PropertyAdditionalInfoForm from '@/pages/property-memo/ui/property-additional-info-form/PropertyAdditionalInfoForm';
import { formatManwon } from '@/features/property/lib/propertyFormat';
import type { PropertyDetail } from '@/features/property/model/Property';
import { roomOptionLabels, utilityOptionLabels } from '@/features/property/model/propertyOptions';
import InfoValue from '@/shared/ui/info-value/InfoValue';

import type { AdditionalEditField, PropertyEditField } from '../../model/editField';
import PropertyInfoSection from '../property-info-section/PropertyInfoSection';

type PropertyAdditionalInfoSectionProps = {
  property: PropertyDetail;
  /** 지금 그 줄 안에서 고치고 있는 항목. 상세 화면 하나에서 한 번에 한 줄만 연다. */
  editingField: PropertyEditField | null;
  /** 누른 항목을 그 줄 안의 입력으로 연다. */
  onEdit: (field: AdditionalEditField) => void;
  onSaved: (field: AdditionalEditField) => void;
  onCancel: () => void;
  /** 방금 저장한 항목. 그 줄 값 아래에 잠깐 저장했다고 알린다. */
  savedField: PropertyEditField | null;
};

const formatDate = (value: string | null): string => value?.replace(/-/g, '.') ?? '';
// LocalDateTime은 초가 0이면 초 자리를 생략해서 온다. 초가 붙어 온 경우에만 잘라낸다.
const formatDateTime = (value: string | null): string =>
  value === null ? '' : value.replace('T', ' ').replace(/(\d{2}:\d{2}):\d{2}(?:\.\d+)?$/, '$1');

const SAVED_TEXT = '✓ 저장했어요';

/**
 * 새 매물 API가 돌려준 부가 정보를 그대로 표시하고, 줄을 누르면 모달 없이 그 줄 안에서 그 항목만 고친다.
 * 관리비와 공과금은 한 입력에서 함께 고치므로, 고치는 동안에는 관리비 줄에 입력을 펼치고 공과금 줄은 접는다.
 */
const PropertyAdditionalInfoSection = ({
  property,
  editingField,
  onEdit,
  onSaved,
  onCancel,
  savedField,
}: PropertyAdditionalInfoSectionProps) => {
  const row = (field: AdditionalEditField) => ({
    onEdit: () => onEdit(field),
    editor:
      editingField === field ? (
        <PropertyAdditionalInfoForm
          property={property}
          layout="inline"
          field={field}
          onSaved={() => onSaved(field)}
          onCancel={onCancel}
        />
      ) : undefined,
    editorLayout: 'block' as const,
    feedback: savedField === field ? SAVED_TEXT : undefined,
  });

  return (
    <PropertyInfoSection title="부가 정보" label="매물 부가 정보">
      <InfoValue label="입주 가능일" value={formatDate(property.availableMoveInDate)} {...row('availableMoveInDate')} />
      <InfoValue
        label="관리비"
        value={property.maintenanceFeeAmount === null ? '' : formatManwon(property.maintenanceFeeAmount)}
        {...row('maintenance')}
      />
      {editingField !== 'maintenance' && (
        <InfoValue
          label="관리비 포함 공과금"
          value={utilityOptionLabels(property.utilityOptions)}
          onEdit={() => onEdit('maintenance')}
        />
      )}
      <InfoValue label="방 옵션" value={roomOptionLabels(property.roomOptions)} {...row('roomOptions')} />
      <InfoValue label="방문 일정" value={formatDateTime(property.visitScheduledAt)} {...row('visitScheduledAt')} />
      <InfoValue label="확인한 곳" value={property.discoverySource.value} {...row('discoverySource')} />
    </PropertyInfoSection>
  );
};

export default PropertyAdditionalInfoSection;
