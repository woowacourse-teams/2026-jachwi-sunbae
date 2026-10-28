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
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: 'error',
    },
    options: {
      // 폴더 구조(pages → features → shared)와 같은 순서로 보여준다.
      storySort: {
        order: [
          '페이지',
          [
            '홈',
            '본 방 기록',
            '매물 상세',
            '매물 등록',
            '매물 메모',
            '매물 체크리스트',
            '체크리스트 진행',
            '체크리스트 목록',
            '체크리스트 만들기',
            '동네 찾기',
            '주변 분석',
            '위치 선택',
            '방 비교',
            '마이',
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
