import { css } from '@emotion/css';

import type { MapAddress } from '@/features/map/model/Map';
import MapHeaderWeather from '@/features/weather/ui/map-header-weather/MapHeaderWeather';
import MobileMapHeader from '@/shared/ui/mobile-map-header/MobileMapHeader';

import type { RecordsView } from '../model/recordsView';
import MobileHeaderSearch from '../ui/record-address-search/MobileHeaderSearch';

type Props = {
  view: RecordsView;
  /** 머리 검색창에서 고른 주소로 지도를 옮긴다. 없으면(화면 코드를 받는 동안의 뼈대) 고르기만 하고 아무것도 하지 않는다. */
  onSearch?: (address: MapAddress) => void;
};
/**
 * 휴대폰 기록 헤더. 지도 보기에서는 왼쪽 끝부터 마이 링크 앞까지 길쭉한 검색창을, 리스트 보기에서는 날씨 안내를 둔다.
 * 왼쪽 위 로고 자리는 비워 두었다. 동네 찾기로 가는 버튼은 지도 아래 가운데에, 매물 기록하기는 리스트 아래 오른쪽 원형 버튼에 있다.
 */
const RecordsMobileHeader = ({ view, onSearch }: Props) => (
  <div className={styles.header}>
    <MobileMapHeader
      center={view === 'list' ? <MapHeaderWeather /> : <MobileHeaderSearch onSelect={onSearch ?? (() => undefined)} />}
    />
  </div>
);
const styles = {
  header: css`
    label: RecordsMobileHeader-root;
    padding: calc(env(safe-area-inset-top) + 0.75rem) 0.85rem 0.5rem;
  `,
};
export default RecordsMobileHeader;
