import { Link } from 'react-router-dom';
import { InfoRow, InfoSection } from './ui/InfoSection';
import Icon from './ui/Icon';
import infoStyles from './ui/InfoSection.module.css';
import type { PropertyDetail } from '../types/Property';
import { roomOptionLabels, utilityOptionLabels } from '../constants/propertyOptions';
import { formatManwon } from '../utils/propertyFormat';

type PropertyAdditionalInfoSectionProps = {
  property: PropertyDetail;
};

const formatDate = (value: string | null): string => value?.replace(/-/g, '.') ?? '';
// LocalDateTime은 초가 0이면 초 자리를 생략해서 온다. 초가 붙어 온 경우에만 잘라낸다.
const formatDateTime = (value: string | null): string =>
  value === null ? '' : value.replace('T', ' ').replace(/(\d{2}:\d{2}):\d{2}(?:\.\d+)?$/, '$1');

/** 새 매물 API가 돌려준 부가 정보를 그대로 표시하고, 편집은 한 화면에서 전체 PUT으로 저장한다. */
const PropertyAdditionalInfoSection = ({ property }: PropertyAdditionalInfoSectionProps) => (
  <InfoSection
    title="부가 정보"
    label="매물 부가 정보"
    action={
      <Link className={infoStyles.sectionAction} to={`/properties/${property.propertyId}/memo`}>
        <Icon name="edit" size={14} /> 편집
      </Link>
    }
  >
    <InfoRow label="입주 가능일" value={formatDate(property.availableMoveInDate)} />
    <InfoRow
      label="관리비"
      value={property.maintenanceFeeAmount === null ? '' : formatManwon(property.maintenanceFeeAmount)}
    />
    <InfoRow label="관리비 포함 공과금" value={utilityOptionLabels(property.utilityOptions)} />
    <InfoRow label="방 옵션" value={roomOptionLabels(property.roomOptions)} />
    <InfoRow label="방문 일정" value={formatDateTime(property.visitScheduledAt)} />
    <InfoRow label="확인한 곳" value={property.discoverySource.value} />
  </InfoSection>
);

export default PropertyAdditionalInfoSection;
