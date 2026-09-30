import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { hasNativeAppFeature, postNativeAppMessage } from '@/shared/lib/native-app/nativeApp';

import { findActiveTab, findMainTab } from './mainTabs';

declare global {
  interface Window {
    __JACHWI_BRIDGE__?: { selectTab: (key: string) => void };
  }
}

/**
 * 앱이 네이티브 탭바를 지원하면 웹 하단바 대신 앱 탭바와 라우트를 맞춘다.
 * - 앱 → 웹: `__JACHWI_BRIDGE__.selectTab(key)`로 탭을 고르면 웹 라우터로만 이동해 조회 캐시를 유지한다.
 * - 웹 → 앱: 라우트가 바뀔 때마다 현재 탭과 탭바 표시 여부를 알린다.
 */
const useNativeTabBar = (isTabBarVisible: boolean): boolean => {
  const isEnabled = hasNativeAppFeature('tab-bar');
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    if (!isEnabled) return;
    window.__JACHWI_BRIDGE__ = {
      selectTab: (key) => {
        const tab = findMainTab(key);
        if (tab !== undefined) navigate(tab.path);
      },
    };
    return () => {
      delete window.__JACHWI_BRIDGE__;
      // 로그인 화면처럼 앱 셸 밖으로 나가면 탭바를 숨긴다.
      postNativeAppMessage({ type: 'route', path: null, activeTab: null, isTabBarVisible: false });
    };
  }, [isEnabled, navigate]);

  useEffect(() => {
    if (!isEnabled) return;
    postNativeAppMessage({ type: 'route', path: pathname, activeTab: findActiveTab(pathname), isTabBarVisible });
  }, [isEnabled, isTabBarVisible, pathname]);

  return isEnabled;
};

export default useNativeTabBar;
