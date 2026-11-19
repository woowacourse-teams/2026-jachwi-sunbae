import { css } from '@emotion/css';
import { useEffect } from 'react';

import MapHeaderWeather from '@/features/weather/ui/map-header-weather/MapHeaderWeather';
import { Button } from '@/shared/ui/button/Button';
import MobileMapHeader, { MapHomeLink } from '@/shared/ui/mobile-map-header/MobileMapHeader';

import type { RecordsView } from '../model/recordsView';

type Props = {
  view: RecordsView;
  onRecord: () => void;
  searchTo?: string;
};
/**
 * 휴대폰 기록 헤더. 왼쪽에 로고, 오른쪽에 검색(지도 보기)과 마이 링크를 둔다. 동네 찾기로 가는 버튼은 지도 아래 가운데에 있다.
 */
const RecordsMobileHeader = ({ view, searchTo, onRecord }: Props) => {
  // 검색 아이콘을 누르면 바로 열리도록, 주소 검색 화면 코드를 미리 받아 둔다.
  useEffect(() => {
    void import('@/pages/address-search/AddressSearchPage');
  }, []);
  return (
    <div className={styles.header}>
      <MobileMapHeader
        searchTo={searchTo}
        hideSearch={view === 'list'}
        trailing={
          view === 'list' && (
            <Button className={styles.record} onClick={onRecord}>
              매물 기록하기
            </Button>
          )
        }
        center={view === 'list' ? <MapHeaderWeather /> : undefined}
        leading={<MapHomeLink />}
      />
    </div>
  );
};
const styles = {
  record: css`
    min-height: 2.75rem;
    white-space: nowrap;
  `,
  header: css`
    label: RecordsMobileHeader-root;
    padding: calc(env(safe-area-inset-top) + 0.75rem) 0.85rem 0.5rem;
  `,
};
export default RecordsMobileHeader;
