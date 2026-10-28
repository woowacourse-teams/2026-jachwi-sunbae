import { css } from '@emotion/css';

import { useChecklistList } from '@/features/checklist/api/useChecklists';
import { USER_CHECKLIST_STAGE } from '@/features/checklist/model/checklist';
import TopNavigation from '@/shared/ui/top-navigation/TopNavigation';

import ChecklistListContent from './ui/checklist-list-content/ChecklistListContent';

/** 사용자 체크리스트는 현장 단계 하나만 제공하므로 단계 선택 탭이 없다. */
const ChecklistListPage = () => {
  const list = useChecklistList(USER_CHECKLIST_STAGE);

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.navigationArea}>
          <TopNavigation title="체크리스트" className={styles.topNavigation} />
          <p className={styles.description}>집을 보면서 확인할 나만의 체크리스트를 만들고 항목을 관리합니다.</p>
        </div>

        <ChecklistListContent list={list} />
      </div>
    </main>
  );
};

const styles = {
  page: css`
    label: ChecklistListPage-page;
    min-height: 100%;
    background: var(--color-canvas);
  `,

  container: css`
    label: ChecklistListPage-container;
    padding: 0 0 1.5rem;

    & > .content-state,
    & > .load-more {
      margin-right: 1rem;
      margin-left: 1rem;
    }
  `,

  navigationArea: css`
    label: ChecklistListPage-navigationArea;
    padding: 0 1rem;
    background: var(--color-canvas);

    & > [data-full-bleed='true'] {
      width: 100%;
      margin-left: 0;
    }
  `,

  topNavigation: css`
    label: ChecklistListPage-topNavigation;
    margin-bottom: 0;
    border-bottom: 0;
  `,

  description: css`
    label: ChecklistListPage-description;
    margin: 0.65rem 0 0;
    color: var(--color-muted);
    font-size: 0.68rem;
    line-height: 1.5;
  `,
};

export default ChecklistListPage;
