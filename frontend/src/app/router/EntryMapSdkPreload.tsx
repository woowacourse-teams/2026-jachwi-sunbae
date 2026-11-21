import { useState } from 'react';
import { useLocation } from 'react-router-dom';

import usePreloadMapSdk from '@/features/map/hooks/usePreloadMapSdk';
import useIsDesktop from '@/shared/lib/hooks/useIsDesktop';

import { drawsMapOnEntry } from './mapEntryPaths';

/**
 * 지도 화면으로 처음 들어왔으면 화면 청크를 받는 동안 네이버 지도 SDK도 같이 받기 시작한다.
 * 지도 화면은 지연 로딩 청크라, 화면 안에서 미리 받기를 걸면 청크가 다 온 뒤에야 SDK가 출발한다
 * (Slow 4G에서 첫 번들은 1.9초에 오는데 SDK는 5.1초에 출발했다).
 * 처음 들어온 주소만 본다. 앱 안에서 지도 화면으로 옮길 때는 각 화면이 필요한 때 받는다.
 */
const EntryMapSdkPreload = () => {
  const { pathname, search } = useLocation();
  const isDesktop = useIsDesktop();
  const [drawsMap] = useState(() => drawsMapOnEntry(pathname, search, isDesktop));
  usePreloadMapSdk(drawsMap);
  return null;
};

export default EntryMapSdkPreload;
