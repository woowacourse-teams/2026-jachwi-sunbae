import { getChecklistErrorMessage } from '@/features/checklist/api/checklistErrorMessages';
import type { useChecklistList } from '@/features/checklist/api/useChecklists';
import useDelayedLoading from '@/shared/lib/hooks/useDelayedLoading';
import { Button, ButtonLink } from '@/shared/ui/button/Button';
import ContentState from '@/shared/ui/content-state/ContentState';

import ChecklistListCard from '../checklist-list-card/ChecklistListCard';

import styles from '../../ChecklistListPage.module.css';

type ChecklistListQuery = ReturnType<typeof useChecklistList>;

type ChecklistListContentProps = {
  list: ChecklistListQuery;
};

const CreateChecklistButton = () => (
  <div className={styles.createCard}>
    <ButtonLink variant="secondary" fullWidth to="/checklists/new">
      새 체크리스트 만들기
    </ButtonLink>
  </div>
);

const ChecklistListContent = ({ list }: ChecklistListContentProps) => {
  const items = list.data?.pages.flatMap((page) => page.content) ?? [];
  const isLoadingVisible = useDelayedLoading(list.isPending);

  if (list.isPending) {
    return isLoadingVisible ? <ContentState page={false} loading title="체크리스트를 불러오는 중이에요." /> : null;
  }

  if (list.isError) {
    return (
      <ContentState
        page={false}
        tone="error"
        title="체크리스트를 불러오지 못했어요."
        description={getChecklistErrorMessage(list.error)}
        onRetry={() => void list.refetch({ cancelRefetch: false })}
      />
    );
  }

  if (items.length === 0) {
    return (
      <>
        <p className={styles.emptyState}>아직 만든 체크리스트가 없어요.</p>
        <CreateChecklistButton />
      </>
    );
  }

  return (
    <>
      <ul className={styles.list}>
        {items.map((item) => (
          <ChecklistListCard key={item.checklistId} checklist={item} />
        ))}
      </ul>

      <CreateChecklistButton />

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
    </>
  );
};

export default ChecklistListContent;
