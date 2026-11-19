import { css, cx } from '@emotion/css';
import type { ReactNode } from 'react';
import { useLayoutEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useOutlet } from 'react-router-dom';

import { useRecordsMapController } from '@/pages/design-records/RecordsMapProvider';
import MapCanvas from '@/features/map/ui/map-canvas/MapCanvas';
import MapZoomControl from '@/features/map/ui/map-zoom-control/MapZoomControl';
import useIsDesktop from '@/shared/lib/hooks/useIsDesktop';
import { CHECKLIST_CREATE_PATH, CHECKLISTS_PATH } from '@/shared/lib/navigation/appPaths';
import ListDetailLayout from '@/shared/ui/list-detail-layout/ListDetailLayout';

import ChecklistDefaultIntro from './ui/ChecklistDefaultIntro';
import ChecklistManagement from './ui/ChecklistManagement';

const ChecklistListPage = () => {
  const isDesktop = useIsDesktop();
  const editor = useOutlet();
  if (!isDesktop) return editor ?? <ChecklistManagement />;
  return <ChecklistDesktop editor={editor} />;
};

/**
 * 데스크탑 체크리스트. 내 기록처럼 왼쪽에 목록 칸, 그 옆에 편집 칸을 지도 왼쪽 위에 얹는다.
 * 뒤 지도는 내 기록 지도(매물, 찜한 동네)를 배경으로 그대로 보여 주고, 마커를 눌러 고르는 동작은 두지 않는다.
 * 처음 열면 편집 칸 자리에 기본 체크리스트 안내를 두고, 목록에서 하나를 고르면 그 체크리스트 편집이 열린다.
 */
const ChecklistDesktop = ({ editor }: { editor: ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const map = useRecordsMapController()?.layers.canvasProps;
  const [isIntroClosed, setIsIntroClosed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const panelKey = `${location.pathname}${location.search}`;
  useLayoutEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [panelKey]);
  const isEditing = editor !== null;
  // 만들기는 기본 항목 고르기와 선택 목록을 두 칸으로 나란히 두므로 편집 칸을 넓게 연다.
  const isCreating = location.pathname === CHECKLIST_CREATE_PATH;
  const panel = isEditing ? editor : isIntroClosed ? null : <ChecklistDefaultIntro />;
  return (
    <ListDetailLayout
      className={cx(styles.layout, isCreating && styles.wide)}
      list={
        <div className={cx(styles.surface, styles.list)}>
          <ChecklistManagement />
        </div>
      }
      detail={
        panel && (
          <section className={cx(styles.surface, styles.panel)} aria-label="체크리스트 편집 패널">
            <div className={styles.scroll} ref={scrollRef}>
              {panel}
            </div>
          </section>
        )
      }
      onCloseDetail={isEditing ? () => navigate(CHECKLISTS_PATH) : () => setIsIntroClosed(true)}
      closeLabel={isEditing ? '체크리스트 편집 칸 닫기' : '체크리스트 안내 칸 닫기'}
    >
      <div className={styles.map}>
        {map && (
          <MapCanvas
            shared
            onRetry={() => window.location.reload()}
            interactive
            center={map.center}
            level={map.level}
            markers={map.markers}
            regions={map.regions}
            onCenterChange={map.onCenterChange}
            onLevelChange={map.onLevelChange}
          />
        )}
        {map && <MapZoomControl className={styles.zoom} level={map.level} onChange={map.onLevelChange} />}
      </div>
    </ListDetailLayout>
  );
};

const styles = {
  layout: css`
    label: ChecklistDesktop-layout;
    height: 100%;
  `,
  /* 기본 항목과 선택 목록 두 칸이 나란히 들어가도록 편집 칸을 넓힌다. 지도는 그 오른쪽에 계속 보인다. */
  wide: css`
    label: ChecklistDesktop-wide;
    && {
      --list-detail-detail-width: clamp(36rem, 64%, 52rem);
    }
  `,
  /* 앱 화면 셸이 체크리스트에 주던 표면 색과 모서리를 이 칸들 안에서도 같게 둔다. */
  surface: css`
    label: ChecklistDesktop-surface;
    --color-surface: #f1f2f4;
    --color-border: transparent;
    --radius-md: 1rem;
    --radius-lg: 1.15rem;
    --bottom-navigation-height: 0px;
    background: var(--color-canvas);
  `,
  list: css`
    label: ChecklistDesktop-list;
    overflow-y: auto;
    padding: 0 1rem;
  `,
  /*
   * 편집 화면의 저장 버튼 줄은 화면 맨 아래 고정(position: fixed)이다. 칸에 transform을 걸어 그 줄이 이 칸 아래에 붙게 하고,
   * 스크롤은 안쪽 칸이 맡아 줄이 내용과 함께 밀려 올라가지 않게 한다.
   */
  panel: css`
    label: ChecklistDesktop-panel;
    --app-max-width: 100%;
    position: relative;
    overflow: hidden;
    transform: translateZ(0);
  `,
  scroll: css`
    label: ChecklistDesktop-scroll;
    height: 100%;
    overflow-y: auto;
    overscroll-behavior: contain;
  `,
  map: css`
    label: ChecklistDesktop-map;
    position: relative;
    height: 100%;
  `,
  zoom: css`
    label: ChecklistDesktop-zoom;
    top: 4.75rem;
    right: 1.15rem;
  `,
};

export default ChecklistListPage;
