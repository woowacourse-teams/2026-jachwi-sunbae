import Icon from '@/shared/ui/icon/Icon';

import styles from './LocationMapControls.module.css';

type LocationMapControlsProps = {
  isLocating: boolean;
  onOpenSearch: () => void;
  onMoveToCurrentLocation: () => void;
};

const LocationMapControls = ({ isLocating, onOpenSearch, onMoveToCurrentLocation }: LocationMapControlsProps) => (
  <div className={styles.controls}>
    <button type="button" aria-label="주소 검색 열기" onClick={onOpenSearch}>
      <Icon name="search" size={20} />
    </button>
    <button type="button" aria-label="내 현재 위치로 이동" disabled={isLocating} onClick={onMoveToCurrentLocation}>
      <Icon name="target" size={22} />
    </button>
  </div>
);

export default LocationMapControls;
