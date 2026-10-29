import useIsDesktop from '@/shared/lib/hooks/useIsDesktop';

import CheapMealsDesktopPage from './desktop/CheapMealsDesktopPage';
import CheapMealsMobilePage from './mobile/CheapMealsMobilePage';

/** 저렴한 한 끼 찾기(`/cheap-meals`). 데스크탑과 휴대폰 화면을 여기서 한 번만 고르고, 탭과 패널은 두 화면이 함께 쓴다. */
const CheapMealsPage = () => (useIsDesktop() ? <CheapMealsDesktopPage /> : <CheapMealsMobilePage />);

export default CheapMealsPage;
