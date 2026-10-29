import { useEffect, useState } from 'react';

import { useLogger } from '@/shared/lib/analytics/logging';

import { categorySelectedParams, CHEAP_MEAL_EVENTS, type CheapMealCategorySource } from '../lib/cheapMealAnalytics';
import { type MealTab } from '../model/MealNavigation';
import useMealNavigation from './useMealNavigation';

export type MealLayout = 'mobile' | 'desktop';

/** 데스크탑과 휴대폰 화면이 함께 쓰는 탭 상태. 한 번 연 탭은 필터와 스크롤을 지키려고 계속 그려 둔다. */
const useMealTabs = (layout: MealLayout) => {
  const navigation = useMealNavigation();
  const { tab } = navigation;
  const { log } = useLogger();
  const [visited, setVisited] = useState<MealTab[]>([tab]);
  useEffect(() => {
    setVisited((previous) => (previous.includes(tab) ? previous : [...previous, tab]));
  }, [tab]);
  return {
    ...navigation,
    layout,
    isRendered: (value: MealTab) => visited.includes(value) || tab === value,
    // 사용자가 직접 고른 카테고리만 기록한다. 같은 탭을 다시 누르거나 전체 탭으로 돌아가는 것은 기록하지 않는다.
    selectTab: (next: MealTab, source: CheapMealCategorySource) => {
      if (next === tab) return;
      if (next !== 'all') log(CHEAP_MEAL_EVENTS.categorySelected, categorySelectedParams(next, source));
      navigation.selectTab(next);
    },
  };
};

export type MealTabs = ReturnType<typeof useMealTabs>;

export default useMealTabs;
