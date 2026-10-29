import { useLocation } from 'react-router-dom';

import { LogScreen } from '@/shared/lib/analytics/logging';
import useIsDesktop from '@/shared/lib/hooks/useIsDesktop';

import LandingDesktopPage from './desktop/LandingDesktopPage';
import LandingMobilePage from './mobile/LandingMobilePage';

/** 생활권 탐색 광고에서 들어오는 랜딩. 영상과 앱 받기를 먼저 보이고, 아래로 프로젝트를 운영 화면과 함께 설명한다. */
const LandingPage = () => {
  // 광고 유입(utm 등)을 홈까지 이어서 측정한다.
  const { search } = useLocation();
  const isDesktop = useIsDesktop();

  return (
    <LogScreen event="landing_viewed">
      {isDesktop ? <LandingDesktopPage search={search} /> : <LandingMobilePage search={search} />}
    </LogScreen>
  );
};

export default LandingPage;
