import { Link } from 'react-router-dom';
import { InfoRow, InfoSection } from './ui/InfoSection';
import Icon from './ui/Icon';
import infoStyles from './ui/InfoSection.module.css';
import type { PropertyMemoDocument } from '../types/Property';
import type { PublicConfig } from '../types/PublicConfig';

type PropertyAdditionalInfoSectionProps = {
  config: PublicConfig;
  propertyId: number;
  memo: PropertyMemoDocument;
  /** 매물에 저장된 값이라 메모 항목과 별개로 받는다. */
  discoverySource: string;
};

/**
 * 값은 보여 주기만 하고, 고치는 일은 편집 화면이 맡는다.
 * 항목과 순서는 서버가 준 그대로 쓴다. 화면마다 목록을 따로 들고 있으면 편집 화면과 순서가 어긋난다.
 */
const PropertyAdditionalInfoSection = ({ propertyId, memo, discoverySource }: PropertyAdditionalInfoSectionProps) => (
  <InfoSection
    title="부가 정보"
    label="매물 부가 정보"
    action={
      <Link className={infoStyles.sectionAction} to={`/properties/${propertyId}/memo`}>
        <Icon name="edit" size={14} /> 편집
      </Link>
    }
  >
    {memo.items.map((item) => (
      <InfoRow key={item.systemMemoItemId} label={item.label} value={item.content} />
    ))}
    <InfoRow label="확인한 곳" value={discoverySource} />
  </InfoSection>
);

export default PropertyAdditionalInfoSection;
