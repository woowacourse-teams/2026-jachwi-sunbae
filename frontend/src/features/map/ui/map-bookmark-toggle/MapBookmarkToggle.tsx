import type { MapCanvasProps } from '../../model/MapCanvas';
import MapControlToggle from '../map-control-toggle/MapControlToggle';

const MapBookmarkToggle = ({
  count,
  isOn,
  isDisabled = false,
  onToggle,
}: NonNullable<MapCanvasProps['bookmarkControl']>) => (
  <MapControlToggle
    label={count === 0 ? '찜한 동네가 없어요' : `찜한 동네 ${isOn ? '숨기기' : '보기'}, ${count}곳`}
    isOn={isOn}
    isDisabled={isDisabled}
    onToggle={onToggle}
    text="찜"
    badge={count}
    icon={
      <svg aria-hidden="true" focusable="false" width="20" height="20" viewBox="0 0 24 24">
        <path
          d="M2.8 8.1 8 5.5 11.1 2.8 15.2 4.9 20.4 5.2 21.3 10.1 18.6 12.7 19.1 17.4 14.2 20.8 9.9 19.5 5.1 21 4.8 16.5 2.6 13.3Z"
          fill="currentColor"
          fillOpacity={isOn ? 0.32 : 0.12}
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <path d="m8 5.5 2.4 4.6-1.2 5.2 0.7 4.2m0.5-9.4 8.2 2.6" fill="none" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    }
  />
);

export default MapBookmarkToggle;
