import { Link } from 'react-router-dom';
import { InfoRow, InfoSection } from './ui/InfoSection';
import Icon from './ui/Icon';
import infoStyles from './ui/InfoSection.module.css';
import type { PropertyDetail } from '../types/Property';
import type { PublicConfig } from '../types/PublicConfig';
import { formatManwon } from '../utils/propertyFormat';

type PropertyBasicInfoSectionProps = {
  config: PublicConfig;
  property: PropertyDetail;
};

const PropertyBasicInfoSection = ({ property }: PropertyBasicInfoSectionProps) => (
  <InfoSection
    title="기본 정보"
    label="매물 기본 정보"
    action={
      <Link className={infoStyles.sectionAction} to={`/properties/${property.propertyId}/edit`}>
        <Icon name="edit" size={14} /> 편집
      </Link>
    }
  >
    <InfoRow label="매물 이름" value={property.name} />
    <InfoRow
      label="보증금 / 월세"
      value={`${formatManwon(property.depositAmount)} / ${formatManwon(property.monthlyRentAmount)}`}
    />
    <InfoRow label="주소" value={property.location.address ?? ''} emptyText="주소를 입력해 주세요" />
    <InfoRow label="확인한 곳" value={property.discoverySource.value} />
  </InfoSection>
);

export default PropertyBasicInfoSection;
