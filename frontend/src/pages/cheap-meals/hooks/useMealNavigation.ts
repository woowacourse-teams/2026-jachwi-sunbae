import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import { MEAL_TABS, type MealDetail, type MealTab } from '../model/MealNavigation';

type SheetState = { cheapMealDetail?: MealDetail };

const useMealNavigation = () => {
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const value = params.get('tab') ?? 'all';
  const tab: MealTab = Object.prototype.hasOwnProperty.call(MEAL_TABS, value) ? (value as MealTab) : 'all';
  const detail = (location.state as SheetState | null)?.cheapMealDetail;
  return {
    tab,
    detail,
    selectTab: (next: MealTab) => {
      if (tab === next) return;
      const query = new URLSearchParams();
      if (next !== 'all') query.set('tab', next);
      setParams(query, { state: null });
    },
    openDetail: (detail: MealDetail) =>
      navigate({ pathname: location.pathname, search: location.search }, { state: { cheapMealDetail: detail } }),
    closeDetail: () => navigate(-1),
  };
};
export default useMealNavigation;
