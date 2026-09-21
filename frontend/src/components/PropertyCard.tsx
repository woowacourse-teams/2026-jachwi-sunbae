import { useState, type MouseEventHandler } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { PropertySummary } from '../types/Property';
import type { PublicConfig } from '../types/PublicConfig';
import { formatManwon } from '../utils/propertyFormat';
import ChecklistProgressBar from './ChecklistProgressBar';
import styles from './PropertyCard.module.css';
import AuthenticatedPhoto from './AuthenticatedPhoto';
import mascotImage from '../assets/empty-property.jpg';

type PropertyPhotoThumbnailProps = {
  property: PropertySummary;
  thumbnailUrl?: string;
  config?: PublicConfig;
  onActivate?: () => void;
};

/** 목록 카드에는 대표 사진 한 장만 보여 준다. 나머지 사진은 매물 상세에서 본다. */
const PropertyPhotoThumbnail = ({ property, thumbnailUrl, config, onActivate }: PropertyPhotoThumbnailProps) => {
  const [failed, setFailed] = useState(false);
  const photo = property.representativePhoto ?? property.photos?.[0] ?? null;
  const contentUrl = thumbnailUrl ?? photo?.contentUrl ?? property.photoUrls?.[0];

  return (
    <div className={styles.photo} onClick={() => onActivate?.()}>
      {contentUrl === undefined || failed ? (
        <div className={styles.emptyPhoto} role="img" aria-label="등록된 사진 없음">
          <img src={mascotImage} alt="" />
        </div>
      ) : config !== undefined && photo !== null ? (
        <AuthenticatedPhoto
          config={config}
          propertyId={property.propertyId}
          photoId={photo.photoId}
          contentUrl={contentUrl}
          alt={`${property.name} 대표 사진`}
        />
      ) : (
        <img src={contentUrl} alt={`${property.name} 대표 사진`} draggable={false} onError={() => setFailed(true)} />
      )}
    </div>
  );
};

type PropertyCardProps = {
  property: PropertySummary;
  thumbnailUrl?: string;
  config?: PublicConfig;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
};

const PropertyCard = ({ property, thumbnailUrl, config, onClick }: PropertyCardProps) => {
  const navigate = useNavigate();
  const onSiteStage = property.stages.find((stage) => stage.stage === 'ON_SITE');

  return (
    <article className={styles.listItem}>
      <div className={styles.visual}>
        <PropertyPhotoThumbnail
          property={property}
          thumbnailUrl={thumbnailUrl}
          config={config}
          onActivate={() => navigate(`/properties/${property.propertyId}`)}
        />
      </div>

      <Link
        className={styles.mainLink}
        to={`/properties/${property.propertyId}`}
        aria-label={property.name}
        onClick={onClick}
      >
        <div className={styles.details}>
          <strong className={styles.title}>{property.name}</strong>
          <span className={styles.price}>
            보증금 {formatManwon(property.depositAmount)} / 월세 {formatManwon(property.monthlyRentAmount)}
          </span>
          {property.location.address !== null && <small className={styles.address}>{property.location.address}</small>}
        </div>
        {onSiteStage !== undefined && (
          <div className={styles.stageProgress} aria-label="현장 체크리스트 진행 현황">
            {onSiteStage.applied ? (
              <ChecklistProgressBar
                progress={onSiteStage.progress}
                compact
                trailing={
                  <strong className={styles.stageCount}>
                    {onSiteStage.progress.completedCount}/{onSiteStage.progress.totalCount}
                  </strong>
                }
              />
            ) : (
              <>
                <span className={styles.inactiveBar} aria-hidden="true" />
                <div className={styles.stageStartHint}>
                  <strong>시작 전</strong>
                </div>
              </>
            )}
          </div>
        )}
      </Link>
    </article>
  );
};

export default PropertyCard;
