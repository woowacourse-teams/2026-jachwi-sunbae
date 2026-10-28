import type { Decorator, Preview } from '@storybook/react-webpack5';
import { type QueryKey, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { PublicConfigProvider } from '../src/shared/config/PublicConfigContext';
import { DesktopHeaderSlotProvider } from '../src/shared/ui/desktop-header/DesktopHeaderSlot';

import '../src/app/styles/global.styles';
import '../src/app/styles/tokens.styles';
import '../src/app/styles/utilities.styles';

/**
 * 스토리마다 앱과 같은 Provider로 감싼다. 서버 요청은 보내지 않고, 화면이 읽을 데이터는 `parameters.queryData`로 미리 넣는다.
 *
 * - `parameters.route`: 처음 열 주소(기본 `/`)
 * - `parameters.routePath`: `useParams`가 필요하면 그 경로 패턴(예: `/properties/:propertyId`)
 * - `parameters.queryData`: `[queryKey, data]` 목록. React Query 캐시에 넣어 둔다.
 */
const withAppProviders: Decorator = (Story, { parameters }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Infinity, refetchOnWindowFocus: false },
      mutations: { retry: false },
    },
  });
  const queryData = (parameters.queryData ?? []) as Array<[QueryKey, unknown]>;
  queryData.forEach(([queryKey, data]) => queryClient.setQueryData(queryKey, data));
  const route = (parameters.route as string | undefined) ?? '/';
  const routePath = parameters.routePath as string | undefined;

  return (
    <PublicConfigProvider config={{ apiBaseUrl: 'http://localhost:8080', mapProviderMode: 'demo' }}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[route]}>
          <DesktopHeaderSlotProvider>
            {routePath ? (
              <Routes>
                <Route path={routePath} element={<Story />} />
              </Routes>
            ) : (
              <Story />
            )}
          </DesktopHeaderSlotProvider>
        </MemoryRouter>
      </QueryClientProvider>
    </PublicConfigProvider>
  );
};

const preview: Preview = {
  decorators: [withAppProviders],
  parameters: {
    layout: 'centered',
    // className·ref는 화면 상태가 아니라 컨트롤에서 뺀다. 필수 props를 먼저 보여준다.
    controls: {
      expanded: true,
      sort: 'requiredFirst',
      exclude: ['className', 'ref'],
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    // 툴바에서 앱이 나누는 화면 폭(휴대폰·태블릿·데스크탑)으로 바로 바꿔 본다. 데스크탑 기준은 useIsDesktop과 같은 1024px 이상이다.
    viewport: {
      options: {
        mobile: { name: '휴대폰 (390)', styles: { width: '390px', height: '844px' }, type: 'mobile' },
        tablet: { name: '태블릿 (820)', styles: { width: '820px', height: '1180px' }, type: 'tablet' },
        desktop: { name: '데스크탑 (1440)', styles: { width: '1440px', height: '900px' }, type: 'desktop' },
      },
    },
    a11y: {
      test: 'error',
    },
    options: {
      // 폴더 구조(pages → features → shared)와 같은 순서로 보여준다. 데스크탑·휴대폰을 나눈 페이지는 그 아래를 화면별로 묶는다.
      // storySort는 Storybook이 코드를 실행하지 않고 읽으므로 변수 없이 값을 그대로 적는다.
      storySort: {
        order: [
          '페이지',
          [
            '홈',
            ['데스크탑', '휴대폰', '공통'],
            '본 방 기록',
            ['데스크탑', '휴대폰', '공통'],
            '매물 상세',
            '매물 등록',
            '매물 메모',
            '매물 체크리스트',
            '체크리스트 진행',
            '체크리스트 목록',
            '체크리스트 만들기',
            '동네 찾기',
            ['데스크탑', '휴대폰', '공통'],
            '주변 분석',
            '위치 선택',
            '방 비교',
            ['데스크탑', '휴대폰', '공통'],
            '마이',
            ['데스크탑', '휴대폰', '공통'],
            '사용 가이드',
            '준비 중 기능',
          ],
          '기능',
          ['매물', '체크리스트', '지도', '거리 메모', '날씨', '온보딩'],
          '공용',
        ],
      },
    },
  },
};

export default preview;
