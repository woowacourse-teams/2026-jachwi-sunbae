import { getChecklistErrorMessage } from '../../features/checklist/api/checklistErrorMessages';
import ChecklistListCard from './ui/checklist-list-card/ChecklistListCard';
import { Button, ButtonLink } from '../../shared/ui/button/Button';
import TopNavigation from '../../shared/ui/top-navigation/TopNavigation';
import { USER_CHECKLIST_STAGE } from '../../features/checklist/model/checklist';
import { useChecklistList } from '../../features/checklist/api/useChecklists';
import useDelayedLoading from '../../shared/lib/hooks/useDelayedLoading';
import type { PublicConfig } from '../../shared/config/publicConfigTypes';
import styles from './ChecklistListPage.module.css';
import ContentState from '../../shared/ui/content-state/ContentState';

/** 사용자 체크리스트는 현장 단계 하나만 제공하므로 단계 선택 탭이 없다. */
const ChecklistListPage = ({ config }: { config: PublicConfig }) => {
  const list = useChecklistList(config, USER_CHECKLIST_STAGE);
  const items = list.data?.pages.flatMap((page) => page.content) ?? [];
  const isLoadingVisible = useDelayedLoading(list.isPending);
  const isLoading = list.isPending || isLoadingVisible;

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.navigationArea}>
          <TopNavigation title="체크리스트" className={styles.topNavigation} />
          <p className={styles.description}>집을 보면서 확인할 나만의 체크리스트를 만들고 항목을 관리합니다.</p>
        </div>

        {isLoading ? (
          isLoadingVisible ? (
            <ContentState page={false} loading title="체크리스트를 불러오는 중이에요." />
          ) : null
        ) : list.isError ? (
          <ContentState
            page={false}
            tone="error"
            title="체크리스트를 불러오지 못했어요."
            description={getChecklistErrorMessage(list.error)}
            onRetry={() => void list.refetch({ cancelRefetch: false })}
          />
        ) : items.length === 0 ? (
          <p className={styles.emptyState}>아직 만든 체크리스트가 없어요.</p>
        ) : (
          <ul className={styles.list}>
            {items.map((item) => (
              <ChecklistListCard key={item.checklistId} config={config} checklist={item} />
            ))}
          </ul>
        )}
        {!isLoading && !list.isError && (
          <div className={styles.createCard}>
            <ButtonLink variant="secondary" fullWidth to="/checklists/new">
              새 체크리스트 만들기
            </ButtonLink>
          </div>
        )}

        {list.hasNextPage && (
          <div className="load-more">
            {list.isFetchNextPageError && (
              <p role="alert">추가 목록을 불러오지 못했어요. 기존 목록은 그대로 유지됩니다.</p>
            )}
            <Button
              variant="secondary"
              fullWidth
              isLoading={list.isFetchingNextPage}
              loadingLabel="불러오는 중…"
              onClick={() => void list.fetchNextPage()}
            >
              {list.isFetchNextPageError ? '다시 불러오기' : '체크리스트 더 보기'}
            </Button>
          </div>
        )}
      </div>
    </main>
  );
};

export default ChecklistListPage;
