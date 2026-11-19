import { css } from '@emotion/css';
import { useState } from 'react';
import { Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';

import DesignRecordsPage from '@/pages/design-records/DesignRecordsPage';
import useRecordsView from '@/pages/design-records/hooks/useRecordsView';
import { RecordsMapProvider } from '@/pages/design-records/RecordsMapProvider';
import NeighborhoodPreviewPage from '@/pages/neighborhood-preview/NeighborhoodPreviewPage';
import { FacilityFocusProvider } from '@/features/map/hooks/useFacilityFocus';
import { MapCanvasMode, SharedMapCanvasProvider } from '@/features/map/ui/map-canvas/SharedMapCanvas';
import useIsDesktop from '@/shared/lib/hooks/useIsDesktop';
import { CHEAP_MEALS_PATH, MY_PATH, NEIGHBORHOODS_PATH, RECORDS_PATH } from '@/shared/lib/navigation/appPaths';
import { MapPanelProvider } from '@/shared/ui/map-list-header/MapPanelContext';
import { MapModeProvider, type MapModeSwitch } from '@/shared/ui/map-mode-switch/MapModeContext';

import MyMapPanel from './ui/MyMapPanel';

const UnifiedMapPage = () => {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const [recordsView] = useRecordsView();
  const params = useParams();
  const isMy = pathname === MY_PATH;
  const [lastFinding, setLastFinding] = useState(pathname.startsWith(NEIGHBORHOODS_PATH));
  // 저렴한 한 끼도 이 화면 안에서 그린다. 지도 인스턴스와 줌, 중심이 내 기록, 동네 찾기와 이어진다.
  const isMeals = pathname.startsWith(CHEAP_MEALS_PATH);
  const isFinding = isMy ? lastFinding : pathname.startsWith(NEIGHBORHOODS_PATH);
  if (!isMy && lastFinding !== isFinding) setLastFinding(isFinding);
  const [recordsUrl, setRecordsUrl] = useState(RECORDS_PATH);
  const [findingUrl, setFindingUrl] = useState(NEIGHBORHOODS_PATH);
  const currentUrl = pathname + search;
  if (!isMy && isFinding && findingUrl !== currentUrl) setFindingUrl(currentUrl);
  if (!isMy && !isFinding && !isMeals && recordsUrl !== currentUrl) setRecordsUrl(currentUrl);
  const isMobileDetail = !isDesktop && !isFinding && params.propertyId !== undefined;
  const closeMy = () => navigate(isFinding ? findingUrl : recordsUrl);
  // 동네 찾기로 넘어갈 때는 지난 검색(목적지, 조건, 결과)이 있으면 그 화면으로, 처음이면 동네 찾기 지도로 바로 간다.
  // 따로 검색 화면을 거치지 않고, 지도에서 출퇴근 장소를 고르거나 검색하게 한다.
  const toFinding: MapModeSwitch = {
    target: 'neighborhoods',
    onSwitch: () => navigate(findingUrl),
  };
  const toRecords: MapModeSwitch = { target: 'records', onSwitch: () => navigate(recordsUrl) };
  const panel = isMy ? { content: <MyMapPanel onClose={closeMy} />, close: closeMy } : null;
  return (
    <FacilityFocusProvider>
      <RecordsMapProvider>
        <SharedMapCanvasProvider
          preserveZoomOnModeChange
          infrastructure={{
            open: !isFinding && !isMeals && (isDesktop || recordsView === 'map'),
            onClose: () => undefined,
          }}
        >
          <div className={styles.page} data-desktop={isDesktop}>
            <div className={styles.content}>
              <div
                hidden={isFinding || isMobileDetail || isMeals}
                className={styles.screen}
                data-mobile={!isDesktop || undefined}
              >
                <MapCanvasMode active={!isFinding && !isMobileDetail && !isMeals}>
                  <MapPanelProvider value={isMy && !isFinding ? panel : null}>
                    <MapModeProvider value={toFinding}>
                      <DesignRecordsPage />
                    </MapModeProvider>
                  </MapPanelProvider>
                </MapCanvasMode>
              </div>
              <div hidden={!isFinding || isMeals} className={styles.screen} data-mobile={!isDesktop || undefined}>
                <MapCanvasMode active={isFinding}>
                  <MapPanelProvider value={isMy && isFinding ? panel : null}>
                    <MapModeProvider value={toRecords}>
                      <NeighborhoodPreviewPage />
                    </MapModeProvider>
                  </MapPanelProvider>
                </MapCanvasMode>
              </div>
              {isMeals && (
                <div className={styles.screen} data-mobile={!isDesktop || undefined}>
                  <MapCanvasMode active>
                    <Outlet />
                  </MapCanvasMode>
                </div>
              )}
              {isMobileDetail && (
                <div className={styles.detail}>
                  <Outlet />
                </div>
              )}
            </div>
          </div>
        </SharedMapCanvasProvider>
      </RecordsMapProvider>
    </FacilityFocusProvider>
  );
};
const styles = {
  detail: css`
    label: UnifiedMapPage-detail;
    height: 100%;
    overflow-y: auto;
  `,
  page: css`
    label: UnifiedMapPage-page;
    position: relative;
    height: 100dvh;
    overflow: hidden;
  `,
  content: css`
    label: UnifiedMapPage-content;
    position: relative;
    min-width: 0;
    height: 100%;
  `,
  screen: css`
    label: UnifiedMapPage-screen;
    height: 100%;
    box-sizing: border-box;

    &[hidden] {
      display: none;
    }
  `,
};
export default UnifiedMapPage;
