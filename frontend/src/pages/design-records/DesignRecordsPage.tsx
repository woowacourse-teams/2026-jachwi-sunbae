import { css } from '@emotion/css';
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { centerWithInsets } from '@/features/map/lib/mapCamera';
import type { MapAddress } from '@/features/map/model/Map';
import useIsDesktop from '@/shared/lib/hooks/useIsDesktop';
import { RECORDS_PATH } from '@/shared/lib/navigation/appPaths';

import RecordsDesktopPage from './desktop/RecordsDesktopPage';
import useQuickCreateProperty from './hooks/useQuickCreateProperty';
import useRecords from './hooks/useRecords';
import useRecordsMapLayers from './hooks/useRecordsMapLayers';
import useRecordsView from './hooks/useRecordsView';
import RecordsMobilePage from './mobile/RecordsMobilePage';

const DesignRecordsPage = () => {
  const isDesktop = useIsDesktop();
  const pageRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const params = useParams();
  const { pathname } = useLocation();
  const [view] = useRecordsView();
  const [isPlacing, setIsPlacing] = useState(false);
  const [lastPropertyId, setLastPropertyId] = useState<string | null>(params.propertyId ?? null);
  const [lastRecordPath, setLastRecordPath] = useState(pathname);
  if (pathname.startsWith(RECORDS_PATH) && pathname !== lastRecordPath) {
    setLastRecordPath(pathname);
    setLastPropertyId(params.propertyId ?? null);
  }
  const records = useRecords({
    selectedId: lastPropertyId,
    focusCenter: (point, level, opensDetail) => {
      const layout = pageRef.current?.querySelector('[data-floating="true"]');
      const rect = layout?.getBoundingClientRect();
      const list = layout?.firstElementChild?.getBoundingClientRect();
      if (!isDesktop || !rect?.width || !list) return point;
      const detailWidth = opensDetail ? Math.max(352, Math.min(416, rect.width * 0.28)) : 0;
      return centerWithInsets(point, level, {
        left: list.right - rect.left + detailWidth + 24,
        right: 80,
        top: 100,
        bottom: 60,
      });
    },
    setSelectedId: (id) => {
      setLastPropertyId(id);
      if (isDesktop) navigate(id === null ? RECORDS_PATH : `${RECORDS_PATH}/${id}`);
    },
  });
  const [creatingAt, setCreatingAt] = useState<MapAddress | null>(null);
  const quickCreate = useQuickCreateProperty({
    onCreated: (id, location) => {
      setCreatingAt(null);
      records.revealCreated(String(id), location);
      records.setNotice('매물을 기록했어요. 항목을 눌러 정보를 채워 주세요.');
    },
    onError: () => {
      setCreatingAt(null);
      records.setNotice('매물을 만들지 못했어요. 다시 시도해 주세요.');
    },
  });
  const layers = useRecordsMapLayers(records, {
    registeringAt: creatingAt,
    canSelectLocation: isPlacing,
    groupAction: isDesktop ? 'list' : undefined,
    keepSelectionOnMapTap: isDesktop,
    memoLevelBoost: isDesktop ? 1 : 0,
    onRegister: (location) => {
      if (quickCreate.isCreating) return;
      setCreatingAt(location);
      quickCreate.create(location);
    },
  });
  useEffect(() => {
    const cancel = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsPlacing(false);
        layers.cancelPlacement();
      }
    };
    window.addEventListener('keydown', cancel);
    return () => window.removeEventListener('keydown', cancel);
  }, [layers]);
  return (
    <div ref={pageRef} className={styles.page}>
      {isDesktop ? (
        <RecordsDesktopPage records={records} layers={layers} />
      ) : (
        <RecordsMobilePage records={records} layers={layers} />
      )}
      <button
        hidden={
          !isDesktop &&
          (view !== 'map' ||
            records.selected !== undefined ||
            layers.memo.mode !== null ||
            layers.groupRecords.length > 0)
        }
        className={styles.placement}
        type="button"
        aria-pressed={isPlacing}
        onClick={() => {
          setIsPlacing(!isPlacing);
          layers.cancelPlacement();
        }}
      >
        {isPlacing ? '위치 선택 취소' : '기록 위치 선택'}
      </button>
    </div>
  );
};
const styles = {
  page: css`
    label: DesignRecordsPage-page;
    position: relative;
    height: 100%;
    & > main {
      height: 100%;
    }
  `,
  placement: css`
    label: DesignRecordsPage-placement;
    position: absolute;
    right: 1rem;
    bottom: calc(env(safe-area-inset-bottom) + 1rem);
    z-index: 60;
    padding: 0.75rem 1rem;
    border: 1px solid var(--color-border);
    border-radius: 1rem;
    color: var(--color-ink);
    background: white;
    box-shadow: var(--shadow-floating);
    cursor: pointer;
    &[aria-pressed='true'] {
      background: var(--color-brand-blue-ink);
      color: white;
    }
  `,
};
export default DesignRecordsPage;
