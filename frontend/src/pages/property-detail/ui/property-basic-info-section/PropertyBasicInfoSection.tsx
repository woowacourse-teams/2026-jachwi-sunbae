import { Link } from 'react-router-dom';

import { formatManwon } from '@/features/property/lib/propertyFormat';
import type { PropertyDetail } from '@/features/property/model/Property';
import Icon from '@/shared/ui/icon/Icon';
import { InfoRow, InfoSection } from '@/shared/ui/info-section/InfoSection';

import infoStyles from '@/shared/ui/info-section/InfoSection.module.css';

type PropertyBasicInfoSectionProps = {
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
  </InfoSection>
);

export default PropertyBasicInfoSection;
