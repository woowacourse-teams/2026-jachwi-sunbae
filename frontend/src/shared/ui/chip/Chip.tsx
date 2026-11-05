import { css } from '@emotion/css';
import type { ReactNode } from 'react';

type ChipProps = {
  children: ReactNode;
  /** 조건처럼 결과에서 바꿀 수 없는 값은 흐리게 그린다. */
  disabled?: boolean;
  /** 지도 위에 띄울 때 켠다. 바탕과 떨어져 보이게 그림자를 둔다. */
  floating?: boolean;
  className?: string;
};

/**
 * 짧은 값 하나를 알약 모양으로 보여 주는 칩. 저렴한 한 끼 업종 칩과 같은 높이, 테두리, 글자 크기를 디자인 토큰으로 쓴다.
 * 누르는 동작은 두지 않는다. 고르는 칩은 화면이 버튼으로 따로 둔다.
 */
const Chip = ({ children, disabled = false, floating = false, className }: ChipProps) => (
  <span
    className={className ? `${styles.chip} ${className}` : styles.chip}
    aria-disabled={disabled || undefined}
    data-floating={floating || undefined}
  >
    {children}
  </span>
);

const styles = {
  chip: css`
    label: Chip-chip;
    display: inline-flex;
    flex: none;
    align-items: center;
    gap: 0.25rem;
    min-height: 2.25rem;
    padding: 0 0.8rem;
    border: 1px solid var(--color-border);
    border-radius: 99px;
    background: var(--color-surface);
    color: var(--color-ink);
    font-size: 0.78rem;
    font-weight: 600;
    white-space: nowrap;

    &[aria-disabled='true'] {
      color: var(--color-ink-soft);
      background: var(--color-surface-muted);
    }

    &[data-floating] {
      box-shadow: var(--shadow-floating);
    }

    @media (max-width: 370px) {
      padding: 0 0.55rem;
      font-size: 0.7rem;
    }
  `,
};

export default Chip;
