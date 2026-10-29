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
 * 데스크탑 화면. 다른 화면과 같은 공용 헤더 아래에 제목과 탭을 두고, 패널은 남은 높이를 채운다.
 * 목록 탭은 64rem 본문 안에 넓게 늘어놓고, 식당 탭은 지도를 화면 끝까지 넓힌다.
 */
const CheapMealsDesktopPage = () => {
  const tabs = useMealTabs('desktop');
  return (
    // 탭은 주소로 바뀌므로 key 없이 화면에 처음 들어올 때만 기록한다.
    <LogScreen event={CHEAP_MEAL_EVENTS.viewed}>
      <main className={styles.page}>
        <DesktopHeader />
        <div className={styles.top}>
          <PageHeading title="저렴한 한 끼 찾기" />
          <MealTabList tabs={tabs} className={styles.tabs} />
        </div>
        <div className={cx(styles.body, tabs.tab === 'restaurant' && styles.mapBody)}>
          <MealTabPanels tabs={tabs} />
        </div>
        {tabs.detail && <MealDetails detail={tabs.detail} layout={tabs.layout} onClose={tabs.closeDetail} />}
      </main>
    </LogScreen>
  );
};

const content = css`
  width: min(100%, 64rem);
  margin-right: auto;
  margin-left: auto;
  padding-right: 2rem;
  padding-left: 2rem;
  box-sizing: border-box;
`;

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
  top: cx(
    content,
    css`
      label: CheapMealsDesktopPage-top;
      flex-shrink: 0;
      padding-top: 0.75rem;
    `,
  ),
  tabs: css`
    label: CheapMealsDesktopPage-tabs;
    grid-template-columns: repeat(4, 7rem);
  `,
  body: cx(
    content,
    css`
      label: CheapMealsDesktopPage-body;
      display: flex;
      flex: 1;
      flex-direction: column;
      min-height: 0;
    `,
  ),
  // 식당 탭은 지도를 본문 폭에 가두지 않고 화면 끝까지 쓴다.
  mapBody: css`
    label: CheapMealsDesktopPage-mapBody;
    width: 100%;
    padding-right: 0;
    padding-left: 0;
  `,
};

export default CheapMealsDesktopPage;
