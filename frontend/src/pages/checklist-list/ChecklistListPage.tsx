import { useChecklistList } from '@/features/checklist/api/useChecklists';
import { USER_CHECKLIST_STAGE } from '@/features/checklist/model/checklist';
import TopNavigation from '@/shared/ui/top-navigation/TopNavigation';

import ChecklistListContent from './ui/checklist-list-content/ChecklistListContent';

import styles from './ChecklistListPage.module.css';

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

export default ChecklistListPage;
