import { useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ApiError } from '../apis/apiClient';
import { getPropertyErrorMessage } from '../apis/propertyErrorMessages';
import AuthenticatedPhoto from '../components/AuthenticatedPhoto';
import ConfirmDialog from '../components/ConfirmDialog';
import PreVisitMemoEditor from '../components/PreVisitMemoEditor';
import StartVisitPanel from '../components/StartVisitPanel';
import Icon from '../components/ui/Icon';
import TopNavigation from '../components/ui/TopNavigation';
import { usePropertyDetail } from '../hooks/query/useProperties';
import { useRemoveProperty } from '../hooks/query/usePropertyMutations';
import { CHECKLIST_STAGES } from '../types/Checklist';
import type { PublicConfig } from '../types/PublicConfig';
import {
  formatDateTime,
  formatWon,
  getChecklistStageLabel,
  getSafeHttpUrl,
  parsePositiveId,
} from '../utils/propertyFormat';
import styles from './PropertyDetailPage.module.css';

type PropertyDetailPageProps = { config: PublicConfig };

const PropertyDetailPage = ({ config }: PropertyDetailPageProps) => {
  const { propertyId: propertyIdParam } = useParams();
  const propertyId = parsePositiveId(propertyIdParam);

  if (propertyId === null) {
    return <InvalidPropertyState />;
  }

  return <ResolvedPropertyDetailPage config={config} propertyId={propertyId} />;
};

const InvalidPropertyState = () => (
  <main className="property-page">
    <div className="page-container">
      <div className="content-state">
        <strong>올바른 매물 주소가 아니에요.</strong>
        <Link to="/properties">매물 목록으로 돌아가기</Link>
      </div>
    </div>
  </main>
);

const ResolvedPropertyDetailPage = ({ config, propertyId }: { config: PublicConfig; propertyId: number }) => {
  const navigate = useNavigate();
  const property = usePropertyDetail(config, propertyId);
  const removeMutation = useRemoveProperty(config, propertyId);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const deleteButtonRef = useRef<HTMLButtonElement>(null);

  if (property.isPending) {
    return (
      <main className="property-page">
        <div className="page-container">
          <div className="content-state" role="status">
            <span className="spinner" />
            매물 상세를 불러오는 중이에요.
          </div>
        </div>
      </main>
    );
  }

  if (property.isError) {
    const isNotFound = property.error instanceof ApiError && property.error.code === 'PROPERTY_NOT_FOUND';
    return (
      <main className="property-page">
        <div className="page-container">
          <div className="content-state content-state--error" role="alert">
            <strong>{isNotFound ? '매물을 찾을 수 없어요.' : '매물 상세를 불러오지 못했어요.'}</strong>
            <span>{getPropertyErrorMessage(property.error)}</span>
            {!isNotFound && (
              <button className="inline-button" type="button" onClick={() => void property.refetch()}>
                다시 시도
              </button>
            )}
            <Link to="/properties">매물 목록으로 돌아가기</Link>
          </div>
        </div>
      </main>
    );
  }

  const detail = property.data;
  const safeSourceUrl = detail.discoverySource.type === 'URL' ? getSafeHttpUrl(detail.discoverySource.value) : null;

  const deleteProperty = async () => {
    try {
      await removeMutation.mutateAsync();
      setIsDeleteDialogOpen(false);
      navigate('/properties', { replace: true, state: { focusHeading: true } });
    } catch {
      // Dialog remains open with a safe retryable error.
    }
  };

  return (
    <main className={`${styles.page} property-detail-page`}>
      <div className={styles.container}>
        <TopNavigation
          title="매물 정보"
          backTo="/properties"
          backLabel="매물 목록으로 돌아가기"
          endSlot={
            <details className={styles.pageMenu}>
              <summary aria-label="매물 메뉴 열기">
                <Icon name="more-vertical" size={22} />
              </summary>
              <div className={styles.pageMenuItems}>
                <Link to={`/properties/${propertyId}/edit`}>수정</Link>
                <StartVisitPanel config={config} property={detail} compact />
              </div>
            </details>
          }
        />
        <header className={styles.detailHeader}>
          <h1>{detail.name}</h1>
          <p>최근 활동 {formatDateTime(detail.lastActivityAt)}</p>
        </header>

        <section className={styles.basicSection} aria-labelledby="basic-info-heading">
          <h2 id="basic-info-heading">계약 조건과 발견 경로</h2>
          <dl className={styles.definitionList}>
            <div className={styles.definitionItem}>
              <dt>보증금</dt>
              <dd>{formatWon(detail.depositAmount)}</dd>
            </div>
            <div className={styles.definitionItem}>
              <dt>월세</dt>
              <dd>{formatWon(detail.monthlyRentAmount)}</dd>
            </div>
            <div className={styles.definitionItem}>
              <dt>발견 경로</dt>
              <dd>
                {safeSourceUrl === null ? (
                  detail.discoverySource.value
                ) : (
                  <a href={safeSourceUrl} target="_blank" rel="noopener noreferrer">
                    매물 원문 새 창에서 보기
                  </a>
                )}
              </dd>
            </div>
          </dl>

          <section className={styles.photoSection} aria-labelledby="property-photos-heading">
            <div className={styles.photoHeading}>
              <h3 id="property-photos-heading">
                사진 <span>{detail.photoPreview.totalCount}장</span>
              </h3>
              {detail.photoPreview.totalCount === 0 && (
                <Link to={`/properties/${propertyId}/photos`}>
                  <Icon name="plus" size={16} /> 사진 추가
                </Link>
              )}
            </div>

            {detail.photoPreview.photos.length === 0 ? (
              <Link className={styles.photoEmpty} to={`/properties/${propertyId}/photos`}>
                <Icon name="image" size={24} />
                <span>사진을 추가해 보세요.</span>
              </Link>
            ) : (
              <div className={styles.photoGrid}>
                {detail.photoPreview.photos.slice(0, 3).map((photo, index, visiblePhotos) => {
                  const isLastPreview = index === visiblePhotos.length - 1;
                  const hasMorePhotos = detail.photoPreview.totalCount > visiblePhotos.length;

                  return (
                    <Link
                      className={styles.photoThumbnailLink}
                      key={photo.photoId}
                      to={`/properties/${propertyId}/photos`}
                      aria-label={`${detail.name} 사진 ${index + 1} 크게 보기`}
                    >
                      <AuthenticatedPhoto
                        config={config}
                        propertyId={propertyId}
                        photoId={photo.photoId}
                        contentUrl={photo.contentUrl}
                        alt=""
                        className={styles.photoThumbnail}
                      />
                      {isLastPreview && hasMorePhotos && (
                        <span className={styles.photoOverlay}>전체 {detail.photoPreview.totalCount}장</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        </section>

        <PreVisitMemoEditor key={propertyId} config={config} propertyId={propertyId} initialMemo={detail.memo} />

        <section className={styles.checklistSection} aria-labelledby="checklist-heading">
          <h2 id="checklist-heading">현재 연결된 확인 단계</h2>
          <ul className={styles.checklistList}>
            {CHECKLIST_STAGES.map((stage) => {
              const checklist = detail.activeChecklists.find((item) => item.stage === stage);
              return (
                <li className={checklist === undefined ? styles.unlinkedChecklist : styles.linkedChecklist} key={stage}>
                  <Link to={`/properties/${propertyId}/active-checklists/${stage}`}>
                    <span>
                      <small>{getChecklistStageLabel(stage)}</small>
                      <strong>{checklist?.name ?? '연결된 체크리스트 없음'}</strong>
                    </span>
                    <Icon name="arrow-right" size={18} />
                  </Link>
                </li>
              );
            })}
          </ul>
          <p className="section-note">원본 체크리스트를 수정하면 연결한 모든 매물에 바로 반영됩니다.</p>
        </section>

        <section className="detail-section danger-section" aria-labelledby="delete-heading">
          <h2 id="delete-heading">이 매물을 삭제하면</h2>
          <ul>
            <li>사진 {detail.deletionImpact.photoCount}장</li>
            <li>방문 기록 {detail.deletionImpact.visitCount}개</li>
            <li>활성 체크리스트 연결 {detail.deletionImpact.activeChecklistCount}개</li>
          </ul>
          <p>체크리스트 원본과 다른 매물의 연결은 유지됩니다.</p>
          <button
            ref={deleteButtonRef}
            className="danger-outline-button"
            type="button"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            매물 삭제
          </button>
        </section>

        <ConfirmDialog
          isOpen={isDeleteDialogOpen}
          title={`${detail.name} 매물을 삭제할까요?`}
          description={
            <>
              <p>매물과 연결된 사진·방문 기록·활성 연결이 삭제되며 되돌릴 수 없습니다.</p>
              <ul>
                <li>사진 {detail.deletionImpact.photoCount}장</li>
                <li>방문 {detail.deletionImpact.visitCount}개</li>
                <li>활성 연결 {detail.deletionImpact.activeChecklistCount}개</li>
              </ul>
              <p>사용자가 만든 체크리스트 원본과 다른 매물 연결은 유지됩니다.</p>
            </>
          }
          confirmLabel="매물 삭제"
          isConfirming={removeMutation.isPending}
          returnFocusRef={deleteButtonRef}
          onCancel={() => setIsDeleteDialogOpen(false)}
          onConfirm={() => void deleteProperty()}
        >
          {removeMutation.isError && (
            <p className="form-error" role="alert">
              {getPropertyErrorMessage(removeMutation.error)} 매물은 그대로 유지됩니다.
            </p>
          )}
        </ConfirmDialog>
      </div>
    </main>
  );
};

export default PropertyDetailPage;
