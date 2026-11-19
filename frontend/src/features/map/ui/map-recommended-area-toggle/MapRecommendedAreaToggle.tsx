import { css } from '@emotion/css';

import Icon from '@/shared/ui/icon/Icon';

import type { MapCanvasProps } from '../../model/MapCanvas';
import MapControlToggle from '../map-control-toggle/MapControlToggle';

/**
 * 동네 찾기 결과로 칠한 추천 동네(행정동 면과 경계선, 동 이름표)를 켜고 끄는 버튼. 찜한 동네 버튼과는 따로 동작한다.
 * 찜한 동네 버튼 바로 아래 칸에 같은 모양으로 둔다. 끄면 점선 회색과 사선 그림으로 그려, 지도가 비어 보이는 까닭을 알 수 있게 한다.
 */
const MapRecommendedAreaToggle = ({ isOn, onToggle }: NonNullable<MapCanvasProps['recommendedAreaControl']>) => (
  <MapControlToggle
    label={isOn ? '추천 동네 숨기기' : '추천 동네 보기'}
    isOn={isOn}
    onToggle={onToggle}
    text="추천"
    slot={1}
    marksOff
    icon={
      <span className={styles.icon} data-off={!isOn || undefined}>
        <Icon name="map" size={18} />
      </span>
    }
  />
);

/* 끄면 지도 그림 위에 사선을 그어 숨김 상태를 그림으로도 알린다. */
const styles = {
  icon: css`
    label: MapRecommendedAreaToggle-icon;
    position: relative;
    display: grid;
    place-items: center;

    &[data-off]::after {
      position: absolute;
      width: 1.45rem;
      height: 2px;
      border-radius: 1px;
      background: currentColor;
      content: '';
      transform: rotate(-45deg);
    }
  `,
};

export default MapRecommendedAreaToggle;
