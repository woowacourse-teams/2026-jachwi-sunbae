import { css } from '@emotion/css';
import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';

import DesignRecordsPage from '@/pages/design-records/DesignRecordsPage';
import NeighborhoodPreviewPage from '@/pages/neighborhood-preview/NeighborhoodPreviewPage';
import { MapCanvasMode, SharedMapCanvasProvider } from '@/features/map/ui/map-canvas/SharedMapCanvas';
import useIsDesktop from '@/shared/lib/hooks/useIsDesktop';
import { HOME_PATH, MY_PATH, NEIGHBORHOODS_PATH, RECORDS_PATH } from '@/shared/lib/navigation/appPaths';

const UnifiedMapPage = () => {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const params = useParams();
  const isFinding = pathname.startsWith(NEIGHBORHOODS_PATH);
  const [recordsUrl, setRecordsUrl] = useState(RECORDS_PATH);
  const [findingUrl, setFindingUrl] = useState(NEIGHBORHOODS_PATH);
  const currentUrl = pathname + search;
  if (isFinding && findingUrl !== currentUrl) setFindingUrl(currentUrl);
  if (!isFinding && recordsUrl !== currentUrl) setRecordsUrl(currentUrl);
  const isMobileDetail = !isDesktop && !isFinding && params.propertyId !== undefined;
  return (
    <SharedMapCanvasProvider>
      <div className={styles.page} data-desktop={isDesktop || undefined}>
        <nav
          hidden={isMobileDetail || (!isDesktop && pathname.endsWith('/details'))}
          className={styles.controls}
          aria-label="지도 모드"
        >
          <button type="button" onClick={() => navigate(isFinding ? recordsUrl : findingUrl)}>
            {isFinding ? '기록으로 전환' : '동네 찾기'}
          </button>
          {!isDesktop && <Link to={HOME_PATH}>홈</Link>}
          <Link to={MY_PATH}>마이</Link>
        </nav>
        <div hidden={isFinding || isMobileDetail} className={styles.screen} data-mobile={!isDesktop || undefined}>
          <MapCanvasMode active={!isFinding && !isMobileDetail}>
            <DesignRecordsPage />
          </MapCanvasMode>
        </div>
        <div hidden={!isFinding} className={styles.screen} data-mobile={!isDesktop || undefined}>
          <MapCanvasMode active={isFinding}>
            <NeighborhoodPreviewPage />
          </MapCanvasMode>
        </div>
        {isMobileDetail && (
          <div className={styles.detail}>
            <Outlet />
          </div>
        )}
      </div>
    </SharedMapCanvasProvider>
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
    &[data-desktop='true'] {
      --unified-panel-top: 1rem;
    }
  `,
  screen: css`
    label: UnifiedMapPage-screen;
    height: 100%;
    box-sizing: border-box;
    &[data-mobile='true'] {
      padding-top: calc(max(0.75rem, env(safe-area-inset-top)) + 3.5rem);
    }
    &[hidden] {
      display: none;
    }
  `,
  controls: css`
    label: UnifiedMapPage-controls;
    &[hidden] {
      display: none;
    }
    position: absolute;
    z-index: 80;
    top: max(0.75rem, env(safe-area-inset-top));
    left: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    & > * {
      padding: 0.65rem 0.9rem;
      border: 1px solid var(--color-border);
      border-radius: 0.75rem;
      background: white;
      color: var(--color-ink);
      box-shadow: var(--shadow-floating);
      font: inherit;
      text-decoration: none;
      cursor: pointer;
    }
    [data-desktop='true'] & {
      top: 1.75rem;
      left: 2rem;
    }
    [data-desktop='true'] & > :last-child {
      position: fixed;
      top: 0.75rem;
      right: 1.25rem;
    }
    [data-desktop='true'] & > :not(:last-child) {
      padding: 0.5rem 0.7rem;
      box-shadow: none;
    }
  `,
};
export default UnifiedMapPage;
