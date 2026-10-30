import { css } from '@emotion/css';

import type { RecordsMapLayers } from '../../hooks/useRecordsMapLayers';

type Props = {
  destination: RecordsMapLayers['destination'];
  className?: string;
};

/**
 * 지도 레일의 `통근`을 눌렀을 때 지도 위에 띄우는 안내. 목적지 모드에서는 지도를 눌러 정하라고 알리고 `취소`를 두며,
 * 거리를 보여 주는 동안은 어디까지의 거리인지 알리는 줄과 `바꾸기`를 둔다.
 */
const RecordDestinationControl = ({ destination, className }: Props) => {
  if (destination.isPicking)
    return (
      <p className={`${styles.chip} ${className ?? ''}`.trim()} role="status">
        <span>{destination.isResolving ? '통근 장소 주소를 찾고 있어요' : '지도에서 통근 장소를 눌러 주세요'}</span>
        <button type="button" onClick={destination.cancel}>
          취소
        </button>
      </p>
    );
  if (!destination.isShown || destination.name === null) return null;
  return (
    <p className={`${styles.chip} ${className ?? ''}`.trim()}>
      <span>{destination.name}까지 통근거리</span>
      <button type="button" onClick={destination.change}>
        바꾸기
      </button>
    </p>
  );
};

const styles = {
  chip: css`
    label: RecordDestinationControl-chip;
    position: absolute;
    z-index: 12;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: max-content;
    margin: 0;
    padding: 0.45rem 0.5rem 0.45rem 0.8rem;
    border-radius: 2rem;
    background: #ffffffed;
    box-shadow: 0 2px 10px #00000016;
    color: var(--color-ink, #25282d);
    font-size: 0.78rem;
    font-weight: 600;

    & > span {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    & > button {
      flex: none;
      padding: 0.2rem 0.55rem;
      border: 0;
      border-radius: 1rem;
      background: #eef3ff;
      color: #3d6fe8;
      font: inherit;
      cursor: pointer;
    }
  `,
};

export default RecordDestinationControl;
