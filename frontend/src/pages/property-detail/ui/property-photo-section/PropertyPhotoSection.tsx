import { Link } from 'react-router-dom';
import type { MouseEvent } from 'react';
import type { PropertyDetail } from '../../../../features/property/model/Property';
import type { PublicConfig } from '../../../../shared/config/publicConfigTypes';
import AuthenticatedPhoto from '../../../../features/property/ui/authenticated-photo/AuthenticatedPhoto';
import Icon from '../../../../shared/ui/icon/Icon';
import PropertyDetailSection from '../property-detail-section/PropertyDetailSection';
import styles from './PropertyPhotoSection.module.css';

type PropertyPhotoSectionProps = {
  config: PublicConfig;
  propertyId: number;
  propertyName: string;
  photoPreview: PropertyDetail['photoPreview'];
  onSelect: (index: number, trigger: HTMLButtonElement) => void;
};

const PropertyPhotoSection = ({
  config,
  propertyId,
  propertyName,
  photoPreview,
  onSelect,
}: PropertyPhotoSectionProps) => (
  <PropertyDetailSection
    title="사진"
    meta={<span>{photoPreview.totalCount}/30</span>}
    action={
      <Link to={`/properties/${propertyId}/photos`}>
        <Icon name="plus" size={16} /> 사진 관리
      </Link>
    }
  >
    {photoPreview.photos.length > 0 ? (
      <div className={styles.grid}>
        {photoPreview.photos.slice(0, 3).map((photo, index) => {
          const isMorePreview = index === 2 && photoPreview.totalCount > 3;
          return (
            <button
              type="button"
              className={styles.thumbnailButton}
              key={photo.photoId}
              aria-label={`${propertyName} 사진 ${index + 1} 크게 보기`}
              onClick={(event: MouseEvent<HTMLButtonElement>) => onSelect(index, event.currentTarget)}
            >
              <AuthenticatedPhoto
                config={config}
                propertyId={propertyId}
                photoId={photo.photoId}
                contentUrl={photo.contentUrl}
                alt=""
                className={styles.thumbnail}
              />
              {isMorePreview && <span className={styles.moreOverlay}>+{photoPreview.totalCount - 2}</span>}
            </button>
          );
        })}
      </div>
    ) : (
      <Link className={styles.emptyLink} to={`/properties/${propertyId}/photos`}>
        사진을 추가해 주세요.
      </Link>
    )}
  </PropertyDetailSection>
);

export default PropertyPhotoSection;
