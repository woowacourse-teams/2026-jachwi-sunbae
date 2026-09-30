import { formatManwon } from '@/features/property/lib/propertyFormat';
import type { PropertySummary } from '@/features/property/model/Property';
import AuthenticatedPhoto from '@/features/property/ui/authenticated-photo/AuthenticatedPhoto';
import mascotImage from '@/shared/assets/empty-property.jpg';
import SelectionControl from '@/shared/ui/selection-control/SelectionControl';

import styles from './ComparePropertyOption.module.css';

type ComparePropertyOptionProps = {
  property: PropertySummary;
  isSelected: boolean;
  isDisabled: boolean;
  onToggle: () => void;
};

const StageOverview = ({ property }: { property: PropertySummary }) => (
  <span className={styles.stageOverview}>
    {property.stages.map((stage, index) => (
      <span key={stage.stage} data-applied={stage.applied || undefined}>
        {index + 1}단계 {stage.applied ? `${stage.progress.completedCount}/${stage.progress.totalCount}` : '미적용'}
      </span>
    ))}
  </span>
);

const ComparePropertyOption = ({ property, isSelected, isDisabled, onToggle }: ComparePropertyOptionProps) => (
  <SelectionControl
    className={styles.option}
    checked={isSelected}
    disabled={isDisabled}
    onSelect={onToggle}
    markClassName={styles.checkmark}
  >
    <span className={styles.thumbnail}>
      {property.representativePhoto === null ? (
        <img src={mascotImage} alt="" className={styles.emptyThumbnailMascot} />
      ) : (
        <AuthenticatedPhoto
          propertyId={property.propertyId}
          photoId={property.representativePhoto.photoId}
          contentUrl={property.representativePhoto.contentUrl}
          alt=""
        />
      )}
    </span>
    <span className={styles.propertyInfo}>
      <strong>{property.name}</strong>
      <span>
        보증금 {formatManwon(property.depositAmount)} / 월세 {formatManwon(property.monthlyRentAmount)}
      </span>
      {property.discoverySource.value.length > 0 && <span>발견 경로 · {property.discoverySource.value}</span>}
      <StageOverview property={property} />
    </span>
  </SelectionControl>
);

export default ComparePropertyOption;
