import { useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ApiError } from '../../features/auth/api/apiClient';
import { getPropertyErrorMessage } from '../../features/property/api/propertyErrorMessages';
import ConfirmDialog from '../../shared/ui/confirm-dialog/ConfirmDialog';
import PropertyPhotoViewer from '../../features/property/ui/property-photo-viewer/PropertyPhotoViewer';
import PropertyAdditionalInfoSection from './ui/property-additional-info-section/PropertyAdditionalInfoSection';
import PropertyBasicInfoSection from './ui/property-basic-info-section/PropertyBasicInfoSection';
import PropertyChecklistSection from './ui/property-checklist-section/PropertyChecklistSection';
import PropertyHeroPhoto from './ui/property-hero-photo/PropertyHeroPhoto';
import PropertyMemoSection from './ui/property-memo-section/PropertyMemoSection';
import PropertyPhotoSection from './ui/property-photo-section/PropertyPhotoSection';
import TopNavigation from '../../shared/ui/top-navigation/TopNavigation';
import TopNavigationMenu from '../../shared/ui/top-navigation-menu/TopNavigationMenu';
import PageHeading from '../../shared/ui/page-heading/PageHeading';

import { usePropertyDetail } from '../../features/property/api/useProperties';
import { useRemoveProperty } from '../../features/property/api/usePropertyMutations';
import type { PublicConfig } from '../../shared/config/publicConfigTypes';
import { parsePositiveId } from '../../features/property/lib/propertyFormat';
import styles from './PropertyDetailPage.module.css';
import ContentState from '../../shared/ui/content-state/ContentState';

const PropertyDetailPage = ({ config }: { config: PublicConfig }) => {
  const propertyId = parsePositiveId(useParams().propertyId);
  if (propertyId === null) {
    return (
      <main className="property-page">
        <ContentState page={false} title="올바른 매물 주소가 아니에요.">
          <Link to="/properties">매물 목록으로 돌아가기</Link>
        </ContentState>
      </main>
    );
  }
  return <ResolvedPropertyDetailPage config={config} propertyId={propertyId} />;
};

const ResolvedPropertyDetailPage = ({ config, propertyId }: { config: PublicConfig; propertyId: number }) => {
  const navigate = useNavigate();
  const property = usePropertyDetail(config, propertyId);
  const removeMutation = useRemoveProperty(config, propertyId);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const deleteButtonRef = useRef<HTMLButtonElement>(null);
  const photoTriggerRef = useRef<HTMLButtonElement | null>(null);

  if (property.isPending) return <ContentState page={false} loading title="매물 상세를 불러오는 중이에요." />;
  if (property.isError) {
    const isNotFound = property.error instanceof ApiError && property.error.code === 'PROPERTY_NOT_FOUND';
    return (
      <main className="property-page">
        <ContentState
          page={false}
          tone="error"
          title={isNotFound ? '매물을 찾을 수 없어요.' : '매물 상세를 불러오지 못했어요.'}
          description={getPropertyErrorMessage(property.error)}
          onRetry={isNotFound ? undefined : () => void property.refetch()}
        >
          <Link to="/properties">매물 목록으로 돌아가기</Link>
        </ContentState>
      </main>
    );
  }

  const detail = property.data;

  const deleteProperty = async () => {
    try {
      await removeMutation.mutateAsync();
      setIsDeleteDialogOpen(false);
      navigate('/properties', { replace: true, state: { focusHeading: true } });
    } catch {
      // 삭제 확인 창에서 재시도할 수 있도록 유지한다.
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <TopNavigation
          className={styles.detailNavigation}
          title={detail.name}
          backTo="/properties"
          backLabel="매물 목록으로 돌아가기"
          endSlot={
            <TopNavigationMenu label="매물 정보 메뉴 열기">
              <button
                ref={deleteButtonRef}
                type="button"
                data-tone="danger"
                onClick={() => {
                  removeMutation.reset();
                  setIsDeleteDialogOpen(true);
                }}
              >
                삭제
              </button>
            </TopNavigationMenu>
          }
        />

        <PropertyHeroPhoto
          config={config}
          propertyId={propertyId}
          propertyName={detail.name}
          photos={detail.photoPreview.photos}
          onOpen={() => {
            photoTriggerRef.current = null;
            setSelectedPhotoIndex(0);
          }}
        />

        <PageHeading title={detail.name} variant="overlap" />
        <PropertyBasicInfoSection config={config} property={detail} />

        <PropertyAdditionalInfoSection property={detail} />

        <PropertyMemoSection config={config} propertyId={propertyId} />

        <PropertyPhotoSection
          config={config}
          propertyId={propertyId}
          propertyName={detail.name}
          photoPreview={detail.photoPreview}
          onSelect={(index, trigger) => {
            photoTriggerRef.current = trigger;
            setSelectedPhotoIndex(index);
          }}
        />

        <PropertyChecklistSection config={config} propertyId={propertyId} />

        {selectedPhotoIndex !== null && (
          <PropertyPhotoViewer
            config={config}
            propertyId={propertyId}
            propertyName={detail.name}
            initialIndex={selectedPhotoIndex}
            onClose={() => {
              setSelectedPhotoIndex(null);
              window.requestAnimationFrame(() => photoTriggerRef.current?.focus());
            }}
          />
        )}

        <ConfirmDialog
          isOpen={isDeleteDialogOpen}
          title={`${detail.name}을 삭제할까요?`}
          description="삭제한 매물은 되돌릴 수 없습니다."
          confirmLabel="매물 삭제"
          isConfirming={removeMutation.isPending}
          returnFocusRef={deleteButtonRef}
          onCancel={() => setIsDeleteDialogOpen(false)}
          onConfirm={() => void deleteProperty()}
        >
          {removeMutation.isError && (
            <p role="alert" className={styles.deleteError}>
              매물을 삭제하지 못했습니다. 매물은 그대로 유지됩니다.
            </p>
          )}
        </ConfirmDialog>
      </div>
    </main>
  );
};

export default PropertyDetailPage;
