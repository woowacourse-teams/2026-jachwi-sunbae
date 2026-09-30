import { act, render, screen } from '@testing-library/react';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import PropertyAppLayout from '@/app/layouts/property-app-layout/PropertyAppLayout';

const renderLayout = (path = '/properties') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<Outlet context={{ memberId: 1, displayName: '이자취', passwordProtected: false }} />}>
          <Route element={<PropertyAppLayout />}>
            <Route path="/properties" element={<h1>매물 목록</h1>} />
            <Route path="/map" element={<h1>지도</h1>} />
            <Route path="/properties/new" element={<h1>새 매물</h1>} />
          </Route>
        </Route>
      </Routes>
    </MemoryRouter>,
  );

afterEach(() => {
  delete window.__JACHWI_NATIVE_APP__;
  delete window.ReactNativeWebView;
});

describe('모바일 앱 셸', () => {
  it('현재 화면과 주요 메뉴 네 개를 함께 표시한다', () => {
    render(
      <MemoryRouter initialEntries={['/properties']}>
        <Routes>
          <Route element={<Outlet context={{ memberId: 1, displayName: '이자취', passwordProtected: false }} />}>
            <Route element={<PropertyAppLayout />}>
              <Route path="/properties" element={<h1>매물 목록</h1>} />
            </Route>
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: '매물 목록' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '홈' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: '체크리스트' })).toHaveAttribute('href', '/checklists');
    expect(screen.getByRole('link', { name: '마이' })).toHaveAttribute('href', '/me');
  });

  describe('네이티브 탭바를 지원하는 앱', () => {
    const setUpNativeApp = () => {
      const postMessage = vi.fn();
      window.__JACHWI_NATIVE_APP__ = { platform: 'ios', version: 2, features: ['tab-bar'] };
      window.ReactNativeWebView = { postMessage };
      const messages = () => postMessage.mock.calls.map(([message]) => JSON.parse(message as string));
      return { messages };
    };

    it('웹 하단바를 숨기고 현재 탭을 앱에 알린다', () => {
      const { messages } = setUpNativeApp();
      renderLayout('/properties');

      expect(screen.queryByRole('navigation', { name: '주요 메뉴' })).not.toBeInTheDocument();
      expect(messages().at(-1)).toEqual({
        type: 'route',
        path: '/properties',
        activeTab: 'home',
        isTabBarVisible: true,
      });
    });

    it('앱에서 탭을 고르면 페이지를 새로 불러오지 않고 라우트만 바꾼다', () => {
      const { messages } = setUpNativeApp();
      renderLayout('/properties');

      act(() => window.__JACHWI_BRIDGE__?.selectTab('map'));

      expect(screen.getByRole('heading', { name: '지도' })).toBeInTheDocument();
      expect(messages().at(-1)).toMatchObject({ path: '/map', activeTab: 'map', isTabBarVisible: true });
    });

    it('전체 화면 페이지에서는 탭바를 숨기라고 알린다', () => {
      const { messages } = setUpNativeApp();
      renderLayout('/properties/new');

      expect(messages().at(-1)).toMatchObject({ activeTab: 'home', isTabBarVisible: false });
    });

    it('앱 셸을 벗어나면 탭바를 숨기고 브리지를 치운다', () => {
      const { messages } = setUpNativeApp();
      const { unmount } = renderLayout('/properties');

      unmount();

      expect(window.__JACHWI_BRIDGE__).toBeUndefined();
      expect(messages().at(-1)).toMatchObject({ isTabBarVisible: false });
    });
  });

  it('탭바 기능이 없는 구버전 앱은 웹 하단바를 계속 쓴다', () => {
    window.__JACHWI_NATIVE_APP__ = { platform: 'ios', version: 1 };
    renderLayout('/properties');

    expect(screen.getByRole('navigation', { name: '주요 메뉴' })).toBeInTheDocument();
  });
});
