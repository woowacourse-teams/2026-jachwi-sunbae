import { css, cx } from '@emotion/css';

import { LogScreen } from '@/shared/lib/analytics/logging';
import DesktopHeader from '@/shared/ui/desktop-header/DesktopHeader';
import PageHeading from '@/shared/ui/page-heading/PageHeading';

import useMealTabs from '../hooks/useMealTabs';
import { CHEAP_MEAL_EVENTS } from '../lib/cheapMealAnalytics';
import MealTabList from '../ui/meal-tab-list/MealTabList';
import MealTabPanels from '../ui/meal-tab-panels/MealTabPanels';
import MealDetails from '../ui/MealDetails';

/**
 * 데스크탑 화면. 다른 화면과 같은 공용 헤더 아래 왼쪽 칸에 제목과 카테고리(식당, 편의점, 배달)를 세로로 두고,
 * 오른쪽 본문이 남은 너비와 높이를 채운다. 카테고리를 위쪽 가로 탭으로 두면 편의점 브랜드·행사 선택과 함께 탭 줄이 겹겹이 쌓인다.
 * 목록 탭은 본문 안에 넓게 늘어놓고, 식당 탭은 지도를 본문 끝까지 넓힌다.
 */
const CheapMealsDesktopPage = () => {
  const tabs = useMealTabs('desktop');
  return (
    // 탭은 주소로 바뀌므로 key 없이 화면에 처음 들어올 때만 기록한다.
    <LogScreen event={CHEAP_MEAL_EVENTS.viewed}>
      <main className={styles.page}>
        <DesktopHeader />
        <div className={styles.layout}>
          <aside className={styles.side}>
            <div className={styles.heading}>
              <PageHeading title="저렴한 한 끼" />
            </div>
            <MealTabList tabs={tabs} orientation="vertical" />
          </aside>
          <div className={cx(styles.body, tabs.tab === 'restaurant' && styles.mapBody)}>
            <MealTabPanels tabs={tabs} />
          </div>
        </div>
        {tabs.detail && <MealDetails detail={tabs.detail} layout={tabs.layout} onClose={tabs.closeDetail} />}
      </main>
    </LogScreen>
  );
};

const styles = {
  page: css`
    label: CheapMealsDesktopPage-page;
    display: flex;
    flex-direction: column;
    height: 100dvh;
    background: var(--color-surface);
    color: var(--color-ink);
    overflow: hidden;
  `,

  /* 왼쪽 13rem 칸에 제목과 카테고리, 오른쪽에 본문을 둔다. */
  layout: css`
    label: CheapMealsDesktopPage-layout;
    display: grid;
    grid-template-columns: 13rem minmax(0, 1fr);
    flex: 1;
    min-height: 0;
  `,

  side: css`
    label: CheapMealsDesktopPage-side;
    display: grid;
    align-content: start;
    gap: 1rem;
    padding: 1.5rem 1rem 1.5rem 1.5rem;
    border-right: 1px solid var(--color-border);
  `,

  heading: css`
    label: CheapMealsDesktopPage-heading;
    padding-left: 0.9rem;
  `,

  body: css`
    label: CheapMealsDesktopPage-body;
    display: flex;
    flex-direction: column;
    min-height: 0;
    padding: 0 2.5rem;
  `,

  // 식당 탭은 지도를 본문 여백 없이 오른쪽 끝까지 쓴다.
  mapBody: css`
    label: CheapMealsDesktopPage-mapBody;
    padding: 0;
  `,
};

export default CheapMealsDesktopPage;
