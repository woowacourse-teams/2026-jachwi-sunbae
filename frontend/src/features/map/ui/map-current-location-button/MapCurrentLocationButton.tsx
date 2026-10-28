import { css } from '@emotion/css';

import Icon from '@/shared/ui/icon/Icon';

type MapCurrentLocationButtonProps = {
  isLocating?: boolean;
  onClick: () => void;
  className?: string;
};

const MapCurrentLocationButton = ({ isLocating = false, onClick, className }: MapCurrentLocationButtonProps) => (
  <button
    type="button"
    className={`${styles.button} ${className ?? ''}`.trim()}
    aria-label="내 현재 위치로 이동"
    disabled={isLocating}
    aria-busy={isLocating || undefined}
    onClick={onClick}
  >
    <Icon name="target" size={22} />
  </button>
);

const styles = {
  button: css`
    label: MapCurrentLocationButton-button;
    display: grid;
    width: 2.5rem;
    height: 2.5rem;
    padding: 0;
    border: 1px solid rgb(221 220 212 / 88%);
    border-radius: 50%;
    background: rgb(255 255 255 / 96%);
    box-shadow: 0 0.35rem 1rem rgb(42 48 35 / 18%);
    color: #30342e;
    cursor: pointer;
    place-items: center;

    &:disabled {
      cursor: wait;
      opacity: 0.62;
    }
  `,
};

export default MapCurrentLocationButton;
