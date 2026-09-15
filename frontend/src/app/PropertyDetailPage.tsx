import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ApiError } from '../apis/apiClient';
import { getPropertyErrorMessage } from '../apis/propertyErrorMessages';
import AuthenticatedPhoto from '../components/AuthenticatedPhoto';
import ChecklistProgressBar from '../components/ChecklistProgressBar';
import ConfirmDialog from '../components/ConfirmDialog';
import PropertyPhotoViewer from '../components/PropertyPhotoViewer';
import PropertyAdditionalInfoSection from '../components/PropertyAdditionalInfoSection';
import PropertyBasicInfoSection from '../components/PropertyBasicInfoSection';
import Icon from '../components/ui/Icon';
import TopNavigation from '../components/ui/TopNavigation';
import TopNavigationMenu from '../components/ui/TopNavigationMenu';
import { Button, ButtonLink } from '../components/ui/Button';
import PageHeading from '../components/ui/PageHeading';

import { usePropertyChecklistOverview, usePropertyDetail, usePropertyMemo } from '../hooks/query/useProperties';
import { useAssignActiveChecklist } from '../hooks/query/useChecklistMutations';
import { useRemoveProperty, useSavePropertyMemoDocument } from '../hooks/query/usePropertyMutations';
import type { PublicConfig } from '../types/PublicConfig';
import { parsePositiveId } from '../utils/propertyFormat';
import { clearLastSelectedChecklist, readLastSelectedChecklist } from './lastChecklistStore';
import styles from './PropertyDetailPage.module.css';
import ContentState from '../components/ui/ContentState';

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
  const memo = usePropertyMemo(config, propertyId);
  const checklists = usePropertyChecklistOverview(config, propertyId);
  const assignDefaultChecklist = useAssignActiveChecklist(config, propertyId, 'ON_SITE');
  const removeMutation = useRemoveProperty(config, propertyId);
  const saveMemo = useSavePropertyMemoDocument(config, propertyId);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isQuickMemoOpen, setIsQuickMemoOpen] = useState(false);
  const [quickMemoDraft, setQuickMemoDraft] = useState('');
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const deleteButtonRef = useRef<HTMLButtonElement>(null);
  const quickMemoDialogRef = useRef<HTMLDialogElement>(null);
  const quickMemoTriggerRef = useRef<HTMLButtonElement>(null);
  const photoTriggerRef = useRef<HTMLButtonElement | null>(null);
  const defaultChecklistAssignmentStarted = useRef(false);
  const onSiteChecklist = checklists.data?.stages.find((item) => item.stage === 'ON_SITE');

  useEffect(() => {
    const dialog = quickMemoDialogRef.current;
    if (dialog === null) return;

    if (isQuickMemoOpen && !dialog.open) {
      dialog.showModal();
      return;
    }

    if (!isQuickMemoOpen && dialog.open) {
      dialog.close();
      quickMemoTriggerRef.current?.focus();
    }
  }, [isQuickMemoOpen]);

  useEffect(() => {
    if (
      checklists.isPending ||
      checklists.isError ||
      checklists.data === undefined ||
      onSiteChecklist?.applied === true ||
      defaultChecklistAssignmentStarted.current
    ) {
      return;
    }

    defaultChecklistAssignmentStarted.current = true;
    // 마지막으로 고른 체크리스트로 시작하고, 그 목록이 사라졌으면 제공 템플릿으로 되돌린다.
    const remembered = readLastSelectedChecklist();
    void assignDefaultChecklist.mutateAsync(remembered).catch(() => {
      if (remembered === 'SYSTEM_DEFAULT') return;
      clearLastSelectedChecklist();
      void assignDefaultChecklist.mutateAsync('SYSTEM_DEFAULT').catch(() => {
        // 자동 적용은 한 번만 시도한다. 실패 시 화면의 시작 버튼으로 사용자가 재시도할 수 있다.
      });
    });
  }, [assignDefaultChecklist, checklists.data, checklists.isError, checklists.isPending, onSiteChecklist?.applied]);

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

        <section className={styles.heroPhotoSection} aria-label="대표 사진">
          {detail.photoPreview.photos.length > 0 ? (
            <button
              type="button"
              className={styles.heroPhotoButton}
              aria-label={`${detail.name} 대표 사진 크게 보기`}
              onClick={() => {
                photoTriggerRef.current = null;
                setSelectedPhotoIndex(0);
              }}
            >
              <AuthenticatedPhoto
                config={config}
                propertyId={propertyId}
                photoId={detail.photoPreview.photos[0].photoId}
                contentUrl={detail.photoPreview.photos[0].contentUrl}
                alt={`${detail.name} 대표 사진`}
                className={styles.heroPhoto}
              />
            </button>
          ) : (
            <Link className={styles.heroPhotoButton} to={`/properties/${propertyId}/photos`}>
              <span className={styles.heroPhotoAdd}>
                <Icon name="plus" size={16} />
                사진 추가
              </span>
            </Link>
          )}
        </section>

        <PageHeading title={detail.name} variant="overlap" />
        <PropertyBasicInfoSection config={config} property={detail} />

        {memo.isPending ? (
          <section className={styles.sectionStateCard} aria-label="매물 부가 정보">
            매물 부가 정보를 불러오는 중이에요.
          </section>
        ) : memo.isError ? (
          <button className={styles.sectionRetryCard} type="button" onClick={() => void memo.refetch()}>
            매물 부가 정보를 불러오지 못했어요. 다시 시도
          </button>
        ) : (
          <PropertyAdditionalInfoSection
            config={config}
            propertyId={propertyId}
            memo={memo.data}
            discoverySource={detail.discoverySource.value}
          />
        )}

        {memo.isPending ? (
          <section className={styles.memoSection} aria-label="매물 메모">
            <div className={styles.sectionHeading}>
              <h2>메모</h2>
            </div>
            <p className={styles.sectionStateCard}>매물 메모를 불러오는 중이에요.</p>
          </section>
        ) : memo.isError ? (
          <section className={styles.memoSection} aria-label="매물 메모">
            <div className={styles.sectionHeading}>
              <h2>메모</h2>
            </div>
            <button className={styles.sectionRetryCard} type="button" onClick={() => void memo.refetch()}>
              매물 메모를 불러오지 못했어요. 다시 시도
            </button>
          </section>
        ) : (
          <section className={styles.quickMemoSection} aria-label="매물 메모">
            <div className={styles.sectionHeading}>
              <h2>메모</h2>
            </div>
            <button
              ref={quickMemoTriggerRef}
              type="button"
              className={styles.quickMemoField}
              onClick={() => {
                setQuickMemoDraft(memo.data.freeMemo);
                setIsQuickMemoOpen(true);
              }}
            >
              {memo.data.freeMemo || '탭해서 메모를 입력해 주세요.'}
            </button>
          </section>
        )}

        <dialog
          ref={quickMemoDialogRef}
          className={styles.quickMemoDialog}
          aria-labelledby="quick-memo-dialog-title"
          onCancel={(event) => {
            event.preventDefault();
            if (!saveMemo.isPending) setIsQuickMemoOpen(false);
          }}
          onClose={() => {
            if (isQuickMemoOpen && !saveMemo.isPending) setIsQuickMemoOpen(false);
          }}
        >
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const memoDocument = memo.data;
              if (memoDocument === undefined) return;
              void saveMemo
                .mutateAsync({
                  items: memoDocument.items.map((item) => ({
                    systemMemoItemId: item.systemMemoItemId,
                    content: item.content,
                  })),
                  freeMemo: quickMemoDraft.trim(),
                })
                .then(() => setIsQuickMemoOpen(false))
                .catch(() => undefined);
            }}
          >
            <h2 id="quick-memo-dialog-title">메모</h2>
            <textarea
              id="quick-memo-input"
              aria-label="메모 내용"
              value={quickMemoDraft}
              maxLength={2_000}
              rows={5}
              placeholder="그 외 내용을 자유롭게 적어보세요."
              onChange={(event) => setQuickMemoDraft(event.target.value)}
              autoFocus
            />
            {saveMemo.isError && (
              <p className={styles.quickMemoDialogError}>메모를 저장하지 못했어요. 다시 시도해 주세요.</p>
            )}
            <div className={styles.quickMemoDialogActions}>
              <button
                type="button"
                className={styles.quickMemoCancelButton}
                disabled={saveMemo.isPending}
                onClick={() => setIsQuickMemoOpen(false)}
              >
                취소
              </button>
              <button type="submit" className={styles.quickMemoSaveButton} disabled={saveMemo.isPending}>
                {saveMemo.isPending ? '저장 중…' : '저장'}
              </button>
            </div>
          </form>
        </dialog>

        <section className={styles.photoSection} aria-label="매물 사진">
          <div className={styles.sectionHeading}>
            <div>
              <h2>사진</h2>
              <span>{detail.photoPreview.totalCount}/30</span>
            </div>
            <Link to={`/properties/${propertyId}/photos`}>
              <Icon name="plus" size={16} /> 사진 관리
            </Link>
          </div>
          {detail.photoPreview.photos.length > 0 ? (
            <div className={styles.photoGrid}>
              {detail.photoPreview.photos.slice(0, 3).map((photo, index) => {
                const isMorePreview = index === 2 && detail.photoPreview.totalCount > 3;
                return (
                  <button
                    type="button"
                    className={styles.photoThumbnailLink}
                    key={photo.photoId}
                    aria-label={`${detail.name} 사진 ${index + 1} 크게 보기`}
                    onClick={(event) => {
                      photoTriggerRef.current = event.currentTarget;
                      setSelectedPhotoIndex(index);
                    }}
                  >
                    <AuthenticatedPhoto
                      config={config}
                      propertyId={propertyId}
                      photoId={photo.photoId}
                      contentUrl={photo.contentUrl}
                      alt=""
                      className={styles.photoThumbnail}
                    />
                    {isMorePreview && (
                      <span className={styles.photoMoreOverlay}>+{detail.photoPreview.totalCount - 2}</span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <Link className={styles.emptyPhotoLink} to={`/properties/${propertyId}/photos`}>
              사진을 추가해 주세요.
            </Link>
          )}
        </section>

        <section className={styles.checklistSection} aria-labelledby="checklist-heading">
          <div className={styles.checklistHeading}>
            <div>
              <h2 id="checklist-heading">체크리스트</h2>
            </div>
          </div>
          {onSiteChecklist !== undefined && onSiteChecklist.progress.totalCount > 0 && (
            <ChecklistProgressBar
              progress={onSiteChecklist.progress}
              trailing={
                <strong className={styles.checklistCount}>
                  {onSiteChecklist.progress.completedCount}/{onSiteChecklist.progress.totalCount}
                </strong>
              }
            />
          )}
          {checklists.isError && (
            <button className={styles.sectionRetry} type="button" onClick={() => void checklists.refetch()}>
              체크리스트 정보를 불러오지 못했어요. 다시 시도
            </button>
          )}
          {assignDefaultChecklist.isError && (
            <p className={styles.sectionRetry}>체크리스트를 시작하지 못했어요. 다시 눌러 주세요.</p>
          )}
          {!checklists.isError &&
            (onSiteChecklist?.applied === true && onSiteChecklist.propertyChecklistId !== null ? (
              <ButtonLink
                className={styles.checklistEnterMain}
                variant="primary"
                fullWidth
                to={`/properties/${propertyId}/checklists/${onSiteChecklist.propertyChecklistId}`}
                state={{ from: 'property-detail' }}
              >
                체크리스트
                <Icon name="arrow-right" size={16} />
              </ButtonLink>
            ) : (
              <Button
                className={styles.checklistEnterMain}
                variant="primary"
                fullWidth
                isLoading={assignDefaultChecklist.isPending}
                loadingLabel="준비 중…"
                onClick={() => {
                  void assignDefaultChecklist
                    .mutateAsync('SYSTEM_DEFAULT')
                    .then((applied) => {
                      navigate(`/properties/${propertyId}/checklists/${applied.propertyChecklistId}`, {
                        replace: true,
                        state: { from: 'property-detail' },
                      });
                    })
                    .catch(() => undefined);
                }}
              >
                체크리스트
                <Icon name="arrow-right" size={16} />
              </Button>
            ))}
        </section>

        <section className={styles.contractSection} aria-label="계약">
          <ButtonLink
            className={styles.contractButton}
            variant="secondary"
            fullWidth
            to={`/properties/${propertyId}/active-checklists/PRE_CONTRACT?from=property-detail`}
          >
            계약 시 체크리스트
            <Icon name="arrow-right" size={16} />
          </ButtonLink>
        </section>

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
