import { css } from '@emotion/css';
import type { ReactNode } from 'react';

type Props = {
  /** 읽는 프로그램과 툴팁에 쓰는 이름. 켜고 끈 상태에 따라 `보기`와 `숨기기`를 바꿔 넘긴다. */
  label: string;
  isOn: boolean;
  isDisabled?: boolean;
  onToggle: () => void;
  /** 그림 아래에 적는 짧은 글자. */
  text: string;
  /** 그림. 색은 `currentColor`를 따른다. */
  icon: ReactNode;
  /** 오른쪽 위 개수 뱃지. 0이거나 없으면 두지 않는다. */
  badge?: number;
  /** 지도 오른쪽 컨트롤 묶음에서 몇 번째 칸인지. 0이 찜한 동네 자리이고 1은 그 바로 아래다. */
  slot?: 0 | 1;
  /** 꺼 둔 상태가 드문 버튼(평소 켜 두는 층)은 끄면 점선 테두리와 회색 바탕으로 그려 꺼져 있음을 분명히 한다. */
  marksOff?: boolean;
};

/**
 * 지도 오른쪽 컨트롤 묶음의 켜고 끄는 네모 버튼. 찜한 동네와 추천 동네 보기가 같은 모양으로 쓴다.
 * 켜면 파란 테두리와 글자, 끄면 회색으로 그려 지금 상태를 바로 알 수 있게 한다.
 */
const MapControlToggle = ({
  label,
  isOn,
  isDisabled = false,
  onToggle,
  text,
  icon,
  badge,
  slot = 0,
  marksOff = false,
}: Props) => (
  <button
    className={styles.button}
    data-slot={slot}
    data-marks-off={marksOff || undefined}
    type="button"
    aria-pressed={isOn}
    disabled={isDisabled}
    aria-label={label}
    title={label}
    onClick={onToggle}
  >
    {icon}
    <span aria-hidden="true">{text}</span>
    {badge !== undefined && badge > 0 && (
      <span className={styles.count} aria-hidden="true">
        {badge}
      </span>
    )}
  </button>
);

const styles = {
  button: css`
    position: fixed;
    z-index: 32;
    top: 13.7rem;
    right: 1.15rem;
    display: grid;
    place-content: center;
    justify-items: center;
    width: 2.65rem;
    height: 2.65rem;
    gap: 0.05rem;
    padding: 0;
    border: 1px solid var(--color-border);
    border-radius: 0.75rem;
    background: var(--color-canvas);
    color: var(--color-ink-soft);
    box-shadow: var(--shadow-floating);
    font: inherit;
    font-size: 0.68rem;
    font-weight: 800;
    line-height: 1;
    cursor: pointer;

    &[aria-pressed='true'] {
      border-color: var(--color-brand-blue-ink);
      color: var(--color-brand-blue-ink);
    }

    &[data-marks-off][aria-pressed='false'] {
      border: 1px dashed var(--color-border-strong);
      background: var(--color-surface-disabled);
      color: var(--color-muted);
    }

    &:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }

    &:focus-visible {
      outline: 2px solid var(--color-focus);
      outline-offset: 2px;
    }

    @media (max-width: 1023px) {
      top: calc(max(0.85rem, env(safe-area-inset-top)) + 16.95rem);
      right: 0.95rem;
    }

    /* 두 번째 칸은 첫 칸(높이 2.65rem) 아래로 0.45rem 띄운다. */
    &[data-slot='1'] {
      top: calc(13.7rem + 3.1rem);
    }

    @media (max-width: 1023px) {
      &[data-slot='1'] {
        top: calc(max(0.85rem, env(safe-area-inset-top)) + 16.95rem + 3.1rem);
      }
    }
  `,
  count: css`
    position: absolute;
    top: -0.25rem;
    right: -0.25rem;
    min-width: 1.1rem;
    padding: 0.2rem;
    border-radius: 999px;
    background: var(--color-brand-blue-ink);
    color: white;
    font-size: 0.65rem;
  `,
};

export default MapControlToggle;
