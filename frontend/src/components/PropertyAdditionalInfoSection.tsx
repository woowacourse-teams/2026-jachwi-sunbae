import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { InfoRow, InfoSection } from './ui/InfoSection';
import Icon from './ui/Icon';
import infoStyles from './ui/InfoSection.module.css';
import type { PropertyMemoDocument, PropertyMemoItem } from '../types/Property';
import type { PublicConfig } from '../types/PublicConfig';

const FIELD_DEFINITIONS = [
  { key: 'maintenance', label: '관리비·포함 항목', matches: ['관리비'] },
  { key: 'options', label: '옵션', matches: ['방 옵션', '옵션'] },
  { key: 'moveIn', label: '입주 가능일', matches: ['입주 가능일'] },
  { key: 'residentRegistration', label: '전입신고 가능 여부', matches: ['전입신고'] },
] as const;

type FieldDefinition = (typeof FIELD_DEFINITIONS)[number];

const findMemoItem = (items: PropertyMemoItem[], definition: FieldDefinition) =>
  items.find((item) => definition.matches.some((match) => item.label.includes(match)));

type PropertyAdditionalInfoSectionProps = {
  config: PublicConfig;
  propertyId: number;
  memo: PropertyMemoDocument;
};

/** 값은 보여 주기만 하고, 고치는 일은 메모 편집 화면이 맡는다. */
const PropertyAdditionalInfoSection = ({ propertyId, memo }: PropertyAdditionalInfoSectionProps) => {
  const fields = useMemo(
    () => FIELD_DEFINITIONS.map((definition) => ({ definition, item: findMemoItem(memo.items, definition) })),
    [memo.items],
  );

  return (
    <InfoSection
      title="부가 정보"
      label="매물 부가 정보"
      action={
        <Link className={infoStyles.sectionAction} to={`/properties/${propertyId}/memo`}>
          <Icon name="edit" size={14} /> 편집
        </Link>
      }
    >
      {fields.map(({ definition, item }) =>
        item === undefined ? null : (
          <InfoRow key={definition.key} label={definition.label} value={item.content} />
        ),
      )}
    </InfoSection>
  );
};

export default PropertyAdditionalInfoSection;
