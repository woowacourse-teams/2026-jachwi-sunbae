import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ApiError } from '../apis/apiClient';
import { getPropertyErrorMessage } from '../apis/propertyErrorMessages';
import PhotoUploadPanel from '../components/PhotoUploadPanel';
import PropertyPhotoCard from '../components/PropertyPhotoCard';
import AppBar from '../components/ui/AppBar';
import { usePropertyDetail, usePropertyPhotos } from '../hooks/query/useProperties';
import type { PublicConfig } from '../types/PublicConfig';
import { parsePositiveId } from '../utils/propertyFormat';
import styles from './PropertyPhotosPage.module.css';

type PropertyPhotosPageProps = { config: PublicConfig };

const PropertyPhotosPage = ({ config }: PropertyPhotosPageProps) => {
  const { propertyId: propertyIdParam } = useParams();
  const propertyId = parsePositiveId(propertyIdParam);

  if (propertyId === null)
    return (
      <main className="property-page">
        <div className="page-container">
          <div className="content-state">
            <strong>올바른 매물 주소가 아니에요.</strong>
            <Link to="/properties">매물 목록으로 돌아가기</Link>
          </div>
        </div>
      </main>
    );
  return <ResolvedPropertyPhotosPage config={config} propertyId={propertyId} />;
};

const ResolvedPropertyPhotosPage = ({ config, propertyId }: { config: PublicConfig; propertyId: number }) => {
  const [visibleCount, setVisibleCount] = useState(6);
  const property = usePropertyDetail(config, propertyId);
  const photos = usePropertyPhotos(config, propertyId);

  if (property.isPending || photos.isPending)
    return (
      <main className="property-page">
        <div className="page-container">
          <div className="content-state" role="status">
            <span className="spinner" />
            사진 정보를 불러오는 중이에요.
          </div>
        </div>
      </main>
    );

  if (property.isError || photos.isError) {
    const error = property.error ?? photos.error;
    const isNotFound = error instanceof ApiError && error.code === 'PROPERTY_NOT_FOUND';
    return (
      <main className="property-page">
        <div className="page-container">
          <div className="content-state content-state--error" role="alert">
            <strong>{isNotFound ? '매물을 찾을 수 없어요.' : '사진 목록을 불러오지 못했어요.'}</strong>
            <span>{getPropertyErrorMessage(error)}</span>
            {!isNotFound && (
              <button
                className="inline-button"
                type="button"
                onClick={() => void Promise.all([property.refetch(), photos.refetch()])}
              >
                다시 시도
              </button>
            )}
            <Link to="/properties">매물 목록으로 돌아가기</Link>
          </div>
        </div>
      </main>
    );
  }

  const visiblePhotos = photos.data.photos.slice(0, visibleCount);

  return (
    <main className={styles.page}>
      <AppBar
        title={`${property.data.name} · 사진 ${photos.data.totalCount}장`}
        backTo={`/properties/${propertyId}`}
        backLabel="매물 상세로 돌아가기"
      />
      <div className={styles.container}>
        <h1 className="sr-only">{property.data.name} 사진 관리</h1>
        <section aria-labelledby="photo-gallery-heading">
          <h2 className="sr-only" id="photo-gallery-heading" tabIndex={-1}>
            등록한 사진 {photos.data.totalCount}장
          </h2>
          <div className={styles.grid}>
            <PhotoUploadPanel config={config} propertyId={propertyId} currentPhotoCount={photos.data.totalCount} />
            {photos.data.photos.length === 0 ? (
              <div className={styles.empty}>
                <strong>등록한 사진이 없어요.</strong>
                <span>왼쪽 위 추가 버튼으로 사진을 등록해 보세요.</span>
              </div>
            ) : (
              <ul className={styles.photoList}>
                {visiblePhotos.map((photo, index) => (
                  <PropertyPhotoCard
                    key={photo.photoId}
                    config={config}
                    propertyId={propertyId}
                    photo={photo}
                    position={index + 1}
                  />
                ))}
              </ul>
            )}
          </div>
          {visibleCount < photos.data.photos.length && (
            <button
              className={styles.loadMore}
              type="button"
              onClick={() => setVisibleCount((current) => Math.min(current + 6, photos.data.photos.length))}
            >
              다음 사진 보기
            </button>
          )}
        </section>
      </div>
    </main>
  );
};

export default PropertyPhotosPage;
