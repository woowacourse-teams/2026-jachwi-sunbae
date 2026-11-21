import { parseRecordsView, readLastRecordsView } from '@/pages/design-records/model/recordsView';
import { EXPLORE_PATH, NEIGHBORHOODS_PATH, RECORDS_PATH, RECORDS_VIEW_PARAM } from '@/shared/lib/navigation/appPaths';

const isNeighborhoodMap = (path: string, base: string) => path === base || path.startsWith(`${base}/areas/`);

/**
 * 이 주소로 처음 들어오면 화면이 뜨자마자 지도를 그리는지.
 * 홈(본 방 기록)은 데스크탑이면 늘 지도를 그리고, 휴대폰은 리스트 보기로 열 때만 그리지 않는다.
 * 여기에 없는 화면은 지도가 없거나 나중에 붙으므로 미리 받지 않는다.
 */
export const drawsMapOnEntry = (pathname: string, search: string, isDesktop: boolean): boolean => {
  const path = pathname.replace(/\/+$/, '') || '/';
  if (path === RECORDS_PATH) {
    if (isDesktop) return true;
    const view = parseRecordsView(new URLSearchParams(search).get(RECORDS_VIEW_PARAM)) ?? readLastRecordsView();
    return view === 'map';
  }
  return isNeighborhoodMap(path, NEIGHBORHOODS_PATH) || isNeighborhoodMap(path, EXPLORE_PATH);
};
