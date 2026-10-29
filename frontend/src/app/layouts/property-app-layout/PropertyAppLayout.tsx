import { useLocation, useOutletContext } from 'react-router-dom';

import type { Member } from '@/features/auth/model/Member';
import useIsDesktop from '@/shared/lib/hooks/useIsDesktop';
import { DesktopHeaderSlotProvider } from '@/shared/ui/desktop-header/DesktopHeaderSlot';

import type { AppShellState } from './appShell';
import PropertyAppDesktopLayout from './desktop/PropertyAppDesktopLayout';
import PropertyAppMobileLayout from './mobile/PropertyAppMobileLayout';

/** 로그인 뒤 앱 화면의 셸. 화면 주소로 배치 상태를 정하고, 데스크탑·휴대폰 셸을 여기서 한 번만 고른다. */
const PropertyAppLayout = () => {
  const member = useOutletContext<Member>();
  const location = useLocation();
  const isDesktop = useIsDesktop();
  const isPropertyDetailPath = /^\/properties\/\d+$/.test(location.pathname);
  const isMapPage = location.pathname === '/neighborhoods' || location.pathname.startsWith('/neighborhoods/areas/');
  // 매물 사진·메모·수정·주변 분석과 동네 주변 분석은 상세로 돌아가는 자체 "<"를 쓴다.
  // 홈으로 가는 상단 바를 위에 겹치면 그 "<"를 눌러 홈으로 빠져나가 버린다.
  const hasOwnBackNavigation =
    /^\/properties\/\d+\/(photos|memo|edit|nearby)$/.test(location.pathname) ||
    location.pathname === '/neighborhoods/nearby';
  const shell: AppShellState = {
    fullScreen:
      location.pathname === '/map/select-location' ||
      location.pathname.startsWith('/properties/new') ||
      isPropertyDetailPath ||
      // 체크리스트 편집은 자체 상단 내비게이션을 쓴다.
      location.pathname === '/checklists' ||
      /^\/properties\/\d+\/checklists\/\d+$/.test(location.pathname),
    isMapPage,
    isPropertyDetailPath,
    isHomeWidthPage: location.pathname === '/me',
    isWidePage: location.pathname === '/checklists',
  };

  return (
    <DesktopHeaderSlotProvider>
      {isDesktop ? (
        <PropertyAppDesktopLayout member={member} shell={shell} />
      ) : (
        // 방 비교는 자체 상단 내비게이션이 홈으로 돌아가므로 상단 바를 겹쳐 두지 않는다.
        // 동네 찾기 지도는 지도·검색을 화면 위까지 쓰므로 상단 바를 두지 않는다.
        // 마이는 동네 찾기 등과 같은 "<" 상단 바를 쓰고, 그 옆에 화면 제목을 둔다.
        <PropertyAppMobileLayout
          member={member}
          shell={shell}
          hidesAppBar={location.pathname === '/compare' || isMapPage || hasOwnBackNavigation}
          appBarTitle={location.pathname === '/me' ? '마이' : undefined}
        />
      )}
    </DesktopHeaderSlotProvider>
  );
};

export default PropertyAppLayout;
