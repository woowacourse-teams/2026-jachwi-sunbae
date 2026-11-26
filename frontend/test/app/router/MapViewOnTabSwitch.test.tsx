import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEffect, useRef, useState } from 'react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import type { MapCanvasProps } from '@/features/map/model/MapCanvas';

import { server } from '../../server';

// 실제 지도처럼 자기 시점(가운데와 확대 단계)을 들고, 받은 값이 지금 시점과 다를 때만 그 자리로 옮긴 뒤 멈춘 시점을 화면에 알린다(idle).
// 사용자가 끌거나 확대해도 알린다. 화면이 알린 시점과 다른 값을 계속 돌려보내면 알림이 끝없이 이어지므로, 무한 갱신도 이 가짜 지도로 잡힌다.
const lifetime = vi.hoisted(() => ({ mounts: 0 }));
vi.mock('@/features/map/ui/map-canvas/MapCanvasSurface', () => ({
  default: ({
    center,
    level = 5,
    onCenterChange,
    onLevelChange,
    markers = [],
    regions = [],
    circles = [],
  }: MapCanvasProps) => {
    const [camera, setCamera] = useState({ latitude: center.latitude, longitude: center.longitude, level });
    const cameraRef = useRef(camera);
    const callbacks = useRef({ onCenterChange, onLevelChange });
    callbacks.current = { onCenterChange, onLevelChange };
    const idle = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    // 옮기고 나서 잠깐 뒤(idle)에 그때의 시점을 알린다. 여러 번 옮기면 마지막 시점만 알린다.
    const settle = (next: typeof camera) => {
      cameraRef.current = next;
      setCamera(next);
      clearTimeout(idle.current);
      idle.current = setTimeout(() => {
        callbacks.current.onCenterChange?.(cameraRef.current.latitude, cameraRef.current.longitude);
        callbacks.current.onLevelChange?.(cameraRef.current.level);
      }, 10);
    };
    useEffect(() => {
      lifetime.mounts += 1;
    }, []);
    useEffect(() => {
      const current = cameraRef.current;
      if (current.latitude === center.latitude && current.longitude === center.longitude && current.level === level)
        return;
      settle({ latitude: center.latitude, longitude: center.longitude, level });
    }, [center.latitude, center.longitude, level]);
    useEffect(() => () => clearTimeout(idle.current), []);
    return (
      <div aria-label="지도">
        <output aria-label="지도 가운데">{`${camera.latitude},${camera.longitude}`}</output>
        <output aria-label="지도 확대 단계">{camera.level}</output>
        <output aria-label="지도 마커">{markers.map((marker) => marker.id).join(' ')}</output>
        <output aria-label="지도 구역">{regions.map((region) => region.id).join(' ')}</output>
        <output aria-label="지도 반경 원">{circles.length}</output>
        <button type="button" onClick={() => settle({ ...camera, latitude: 37.6012, longitude: 127.0345 })}>
          지도 끌기
        </button>
        <button type="button" onClick={() => settle({ ...camera, level: 2 })}>
          지도 가까이
        </button>
      </div>
    );
  },
}));

const config = { apiBaseUrl: 'http://localhost:8080' };

let navigateTo: (path: string) => void = () => undefined;
const NavigateProbe = () => {
  const navigate = useNavigate();
  navigateTo = navigate;
  return null;
};

const setViewport = (desktop: boolean) =>
  vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
    matches: desktop && query === '(min-width: 1024px)',
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  }));

// 지도 화면은 다녀온 탭 사이의 시점을 모듈에 기억한다. 테스트마다 앱 모듈을 새로 불러 앞 테스트의 시점이 넘어오지 않게 한다.
const renderApp = async () => {
  vi.resetModules();
  const [
    { default: AppRoutes },
    { setAuthentication },
    { queryClient },
    { PublicConfigProvider },
    { handlers },
    store,
  ] = await Promise.all([
    import('@/app/router/AppRoutes'),
    import('@/features/auth/model/authStore'),
    import('@/shared/api/queryClient'),
    import('@/shared/config/PublicConfigContext'),
    import('@/app/mocks/handlers'),
    import('@/app/mocks/mockStore'),
  ]);
  store.resetMockStore();
  server.use(...handlers);
  setAuthentication({ accessToken: 'memory-token', tokenType: 'Bearer', expiresIn: 60 });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/']}>
        <PublicConfigProvider config={config}>
          <AppRoutes />
          <NavigateProbe />
        </PublicConfigProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

/** 사용자가 지도를 끌고 확대한 뒤의 시점. */
const movedView = { center: '37.6012,127.0345', level: '2' };

const expectMovedView = async () => {
  await waitFor(() => expect(screen.getByLabelText('지도 가운데')).toHaveTextContent(movedView.center));
  expect(screen.getByLabelText('지도 확대 단계')).toHaveTextContent(movedView.level);
};

const moveMap = async (user: ReturnType<typeof userEvent.setup>) => {
  // 기록을 받으면 지도가 첫 기록 자리로 한 번 옮겨 간다. 그 뒤에 사용자가 지도를 움직인다.
  // 첫 화면은 지연 로딩 화면 코드를 받아야 해서 병렬 실행 부하에서 오래 걸릴 수 있다.
  await waitFor(() => expect(screen.getByLabelText('지도 가운데')).toHaveTextContent('37.5551234,126.9101234'), {
    timeout: 15_000,
  });
  await user.click(await screen.findByRole('button', { name: '지도 끌기' }));
  await user.click(screen.getByRole('button', { name: '지도 가까이' }));
  await expectMovedView();
};

beforeEach(() => {
  lifetime.mounts = 0;
});

afterEach(() => vi.restoreAllMocks());

/** 지금 지도에 올린 마커 id. 내 기록은 매물 id(10, 11), 동네 찾기는 `my-property:`, 저렴한 한 끼는 `record-property:`와 가게 id다. */
const mapMarkers = () => (screen.getByLabelText('지도 마커').textContent ?? '').split(' ').filter(Boolean);
const expectRecordsLayer = async () => {
  await waitFor(() => expect(mapMarkers().sort()).toEqual(['10', '11']));
  expect(screen.getByLabelText('지도 반경 원')).toHaveTextContent('0');
};

it('데스크탑에서 동네 찾기, 체크리스트, 저렴한 한 끼 탭을 오가도 지도를 새로 만들지 않고, 이전 탭 표현은 내리고 돌아오면 다시 그리며 보던 가운데와 확대 단계를 그대로 둔다', async () => {
  setViewport(true);
  const user = userEvent.setup();
  await renderApp();
  await moveMap(user);
  await expectRecordsLayer();
  const rail = () => within(screen.getByRole('navigation', { name: '화면 이동' }));

  await user.click(rail().getByRole('button', { name: '동네 찾기' }));
  // 동네 찾기는 내 기록 마커 대신 자기 표현(내 매물 후보 마커)만 올린다.
  await waitFor(() => expect(mapMarkers().sort()).toEqual(['my-property:10', 'my-property:11']));
  await expectMovedView();

  await user.click(rail().getByRole('button', { name: '내 기록' }));
  await expectRecordsLayer();
  await expectMovedView();

  await user.click(rail().getByRole('button', { name: '체크리스트' }));
  expect(await screen.findByRole('heading', { name: '체크리스트' })).toBeInTheDocument();
  // 체크리스트는 왼쪽 칸만 바꾸고 지도는 내 기록 그대로다.
  await expectRecordsLayer();
  await expectMovedView();

  await user.click(rail().getByRole('button', { name: '저렴한 한 끼' }));
  expect(await screen.findByRole('tab', { name: '식당' })).toBeInTheDocument();
  // 저렴한 한 끼는 기준 반경 원과 가게 마커를 올리고, 내 기록 마커는 내린다(기록 매물은 기준 고르기용 마커로 바뀐다).
  await waitFor(() => expect(screen.getByLabelText('지도 반경 원')).toHaveTextContent('1'));
  await waitFor(() => expect(mapMarkers().some((id) => /^\d+$/.test(id) && !['10', '11'].includes(id))).toBe(true));
  expect(mapMarkers()).not.toContain('10');
  await expectMovedView();

  await user.click(rail().getByRole('button', { name: '내 기록' }));
  // 돌아오면 가게 마커와 반경 원은 내려가고 내 기록 마커를 다시 올린다.
  await expectRecordsLayer();
  await expectMovedView();
  expect(lifetime.mounts).toBe(1);
}, 40_000);

it('휴대폰에서 지도 밖 체크리스트 화면에 다녀오거나 동네 찾기, 저렴한 한 끼로 가도 이전 탭 표현은 내리고 보던 가운데와 확대 단계로 돌아온다', async () => {
  setViewport(false);
  const user = userEvent.setup();
  await renderApp();
  await moveMap(user);

  navigateTo('/checklists');
  expect(await screen.findByRole('heading', { name: '체크리스트 관리' })).toBeInTheDocument();
  expect(screen.queryByLabelText('지도')).not.toBeInTheDocument();

  navigateTo('/');
  await expectMovedView();
  await expectRecordsLayer();
  // 휴대폰 체크리스트는 지도 없는 전체 화면이라 지도를 내렸다가 다시 만든다. 다시 만든 지도도 보던 시점에서 시작한다.
  expect(lifetime.mounts).toBe(2);

  navigateTo('/neighborhoods');
  await waitFor(() => expect(mapMarkers().sort()).toEqual(['my-property:10', 'my-property:11']));
  await expectMovedView();

  navigateTo('/');
  await expectRecordsLayer();
  await expectMovedView();

  navigateTo('/cheap-meals/restaurant');
  expect(await screen.findByRole('tab', { name: '식당' })).toBeInTheDocument();
  await expectMovedView();

  navigateTo('/');
  await expectRecordsLayer();
  await expectMovedView();
  // 지도 화면끼리(내 기록, 동네 찾기, 저렴한 한 끼)는 지도를 다시 만들지 않는다.
  expect(lifetime.mounts).toBe(2);
}, 40_000);
