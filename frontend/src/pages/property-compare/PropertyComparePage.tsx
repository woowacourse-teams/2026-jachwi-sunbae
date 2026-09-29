import { getPropertyErrorMessage } from '@/features/property/api/propertyErrorMessages';
import { usePropertyList } from '@/features/property/api/useProperties';
import { Button, ButtonLink } from '@/shared/ui/button/Button';
import EmptyState from '@/shared/ui/empty-state/EmptyState';
import InlineNotice from '@/shared/ui/inline-notice/InlineNotice';
import TopNavigation from '@/shared/ui/top-navigation/TopNavigation';

import usePropertyComparison, { MAX_SELECTION, MIN_SELECTION } from './hooks/usePropertyComparison';
import CompareActionBar from './ui/compare-action-bar/CompareActionBar';
import ComparePropertyOption from './ui/compare-property-option/ComparePropertyOption';

import styles from './PropertyComparePage.module.css';

const PropertyComparePage = () => {
  const properties = usePropertyList();
  const items = properties.data?.pages.flatMap((page) => page.content) ?? [];
  const { selectedIds, isExporting, hasExportError, toggle, downloadPdf } = usePropertyComparison();
  const hasEnoughProperties = items.length >= MIN_SELECTION;

  return (
    <main className={styles.page}>
      <TopNavigation title="비교할 매물 선택" backTo="/properties" />
      {properties.isPending && (
        <div className={styles.loading} role="status">
          <span className={styles.spinner} aria-hidden="true" />
          매물을 불러오는 중이에요.
        </div>
      )}
      {properties.isError && (
        <div className={styles.errorState}>
          <InlineNotice tone="error">{getPropertyErrorMessage(properties.error)}</InlineNotice>
          <Button variant="secondary" fullWidth onClick={() => void properties.refetch()}>
            다시 시도
          </Button>
        </div>
      )}
      {properties.isSuccess && (
        <div className={styles.content}>
          <section className={styles.intro} aria-labelledby="compare-intro-heading">
            <span>기록 비교 PDF</span>
            <h2 id="compare-intro-heading">함께 볼 매물을 골라 주세요.</h2>
            <p>2~5개 매물의 기본 정보, 사진, 메모와 체크 결과를 그대로 모아 드려요.</p>
            <InlineNotice>점수나 추천 없이 저장한 사실만 보여 드립니다. 최종 판단은 직접 해 주세요.</InlineNotice>
          </section>

          <div className={styles.selectionHeader} aria-live="polite">
            <strong>{selectedIds.length}개 선택</strong>
            <span>최대 {MAX_SELECTION}개</span>
          </div>

          {hasEnoughProperties ? (
            <ul className={styles.propertyList} aria-label="비교할 매물 목록">
              {items.map((property) => {
                const isSelected = selectedIds.includes(property.propertyId);
                return (
                  <li key={property.propertyId}>
                    <ComparePropertyOption
                      property={property}
                      isSelected={isSelected}
                      isDisabled={!isSelected && selectedIds.length >= MAX_SELECTION}
                      onToggle={() => toggle(property.propertyId)}
                    />
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState
              variant="plain"
              title="비교하려면 매물이 2개 필요해요."
              description="매물을 하나 더 등록한 뒤 기록을 나란히 확인해 보세요."
              action={<ButtonLink to="/properties/new">매물 등록하기</ButtonLink>}
            />
          )}

          {hasExportError && (
            <InlineNotice tone="error">PDF를 만들지 못했어요. 잠시 후 다시 시도해 주세요.</InlineNotice>
          )}

          {hasEnoughProperties && (
            <CompareActionBar
              selectedCount={selectedIds.length}
              isExporting={isExporting}
              onDownload={() => void downloadPdf()}
            />
          )}
        </div>
      )}
    </main>
  );
};

export default PropertyComparePage;
