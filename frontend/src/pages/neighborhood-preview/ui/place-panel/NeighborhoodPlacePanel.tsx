import Icon from '@/shared/ui/icon/Icon';

import { type NeighborhoodPlace, placeTitle } from '../../hooks/useNeighborhoodPlaces';
import type { NeighborhoodPreviewContext } from '../../hooks/useNeighborhoodPreview';
import PlaceDetails from './PlaceDetails';

import * as styles from './NeighborhoodPlacePanel.styles';

/** 같은 동네의 출발 정류장을 앞뒤로 넘기는 버튼. index는 0부터 센다. */
export type StationNav = { index: number; total: number; onPrevious: () => void; onNext: () => void };

type Props = {
  place: NeighborhoodPlace;
  preview: Pick<NeighborhoodPreviewContext, 'destination' | 'maxMinutes' | 'maxTransfers'>;
  stationNav?: StationNav;
};

/**
 * 데스크탑에서 지도의 정류장·부동산을 고르면 랭킹 옆 칸에 바로 여는 정보. 칸이 넓어 요약 단계 없이 경로까지 보여준다.
 * 동네의 출발 정류장이면 위에 `<` `>`를 두어 같은 동네의 다른 출발 정류장으로 넘긴다.
 */
const NeighborhoodPlacePanel = ({ place, preview, stationNav }: Props) => {
  const title = placeTitle(place);
  return (
    <section className={styles.panel} aria-label={`${title} 정보`}>
      {stationNav && (
        <nav className={styles.stationNav} aria-label="출발 정류장 넘기기">
          <button
            type="button"
            aria-label="이전 정류장"
            disabled={stationNav.index === 0}
            onClick={stationNav.onPrevious}
          >
            <Icon name="chevron-left" size={18} />
          </button>
          <span>
            {stationNav.index + 1} / {stationNav.total}
          </span>
          <button
            type="button"
            aria-label="다음 정류장"
            disabled={stationNav.index === stationNav.total - 1}
            onClick={stationNav.onNext}
          >
            <Icon name="chevron-right" size={18} />
          </button>
        </nav>
      )}
      <h1 className={styles.title}>{title}</h1>
      <PlaceDetails place={place} preview={preview} phoneAction="copy" />
    </section>
  );
};

export default NeighborhoodPlacePanel;
