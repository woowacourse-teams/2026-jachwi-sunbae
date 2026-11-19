import { css } from '@emotion/css';

import type { MapAddress } from '@/features/map/model/Map';

import RecordAddressSearch from './RecordAddressSearch';

type Props = { onSelect: (address: MapAddress) => void };

/**
 * 휴대폰 지도 머리의 길쭉한 검색창. 데스크탑 목록 머리와 같은 주소 검색(`RecordAddressSearch`)을 그 자리에서 바로 쓰고,
 * 결과는 머리 바로 아래 드롭다운으로 연다. 높이는 옆의 마이 아이콘에 맞춘다.
 */
const MobileHeaderSearch = ({ onSelect }: Props) => (
  <RecordAddressSearch
    onSelect={onSelect}
    label="장소나 주소 검색"
    placeholder="장소나 주소 검색"
    fieldClassName={styles.field}
  />
);

const styles = {
  field: css`
    label: MobileHeaderSearch-field;
    height: 2.25rem;
    box-shadow: var(--shadow-floating);
  `,
};

export default MobileHeaderSearch;
