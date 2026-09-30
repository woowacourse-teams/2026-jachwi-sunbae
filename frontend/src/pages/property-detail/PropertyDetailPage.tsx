import { useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { describePropertyLoadError } from '@/features/property/api/propertyErrorMessages';
import { usePropertyDetail } from '@/features/property/api/useProperties';
import { useRemoveProperty } from '@/features/property/api/usePropertyMutations';
import { parsePositiveId } from '@/features/property/lib/propertyFormat';
import type { PropertyDetail } from '@/features/property/model/Property';
import PropertyPhotoViewer from '@/features/property/ui/property-photo-viewer/PropertyPhotoViewer';
import ConfirmDialog from '@/shared/ui/confirm-dialog/ConfirmDialog';
import ContentState from '@/shared/ui/content-state/ContentState';
import PageHeading from '@/shared/ui/page-heading/PageHeading';
import QueryState from '@/shared/ui/query-state/QueryState';
import TopNavigationMenu from '@/shared/ui/top-navigation-menu/TopNavigationMenu';

import PropertyAdditionalInfoSection from './ui/property-additional-info-section/PropertyAdditionalInfoSection';
import PropertyBasicInfoSection from './ui/property-basic-info-section/PropertyBasicInfoSection';
import PropertyChecklistSection from './ui/property-checklist-section/PropertyChecklistSection';
import PropertyHeroPhoto from './ui/property-hero-photo/PropertyHeroPhoto';
import PropertyMemoSection from './ui/property-memo-section/PropertyMemoSection';
import PropertyPhotoSection from './ui/property-photo-section/PropertyPhotoSection';

import styles from './PropertyDetailPage.module.css';

const backToList = <Link to="/properties">매물 목록으로 돌아가기</Link>;
const describeError = describePropertyLoadError('매물 상세를 불러오지 못했어요.');

type PropertyDetailViewProps = { propertyId: number; detail: PropertyDetail };

const PropertyDetailPage = () => {
  const propertyId = parsePositiveId(useParams().propertyId);
  if (propertyId === null) return <ContentState title="올바른 매물 주소가 아니에요.">{backToList}</ContentState>;
  return <ResolvedPropertyDetailPage propertyId={propertyId} />;
};

const ResolvedPropertyDetailPage = ({ propertyId }: { propertyId: number }) => {
  const property = usePropertyDetail(propertyId);

  return (
    <QueryState
      query={property}
      loadingTitle="매물 상세를 불러오는 중이에요."
      describeError={describeError}
      errorAction={backToList}
    >
      {(detail) => <PropertyDetailView propertyId={propertyId} detail={detail} />}
    </QueryState>
  );
};

const PropertyDetailView = ({ propertyId, detail }: PropertyDetailViewProps) => {
  const navigate = useNavigate();
  const removeMutation = useRemoveProperty(propertyId);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const deleteButtonRef = useRef<HTMLButtonElement>(null);
  const photoTriggerRef = useRef<HTMLButtonElement | null>(null);

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
        <PropertyHeroPhoto
          propertyId={propertyId}
          propertyName={detail.name}
          photos={detail.photoPreview.photos}
          backTo="/properties"
          onOpen={() => {
            photoTriggerRef.current = null;
            setSelectedPhotoIndex(0);
          }}
        />

        <div className={styles.infoPanel}>
          <div className={styles.titleRow}>
            <PageHeading title={detail.name} />
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
          </div>

          <PropertyBasicInfoSection property={detail} />

          <PropertyAdditionalInfoSection property={detail} />

          <PropertyMemoSection propertyId={propertyId} />

          <PropertyPhotoSection
            propertyId={propertyId}
            propertyName={detail.name}
            photoPreview={detail.photoPreview}
            onSelect={(index, trigger) => {
              photoTriggerRef.current = trigger;
              setSelectedPhotoIndex(index);
            }}
          />

          <PropertyChecklistSection propertyId={propertyId} />
        </div>

        {selectedPhotoIndex !== null && (
          <PropertyPhotoViewer
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
