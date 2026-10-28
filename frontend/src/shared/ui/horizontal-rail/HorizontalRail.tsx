import { css } from '@emotion/css';
import type { ReactNode } from 'react';

import useHorizontalDrag from '@/shared/lib/hooks/useHorizontalDrag';

type HorizontalRailProps = {
  /** 가로로 넘기는 카드들. 카드 너비는 각 카드가 정한다. */
  children: ReactNode;
  'aria-label'?: string;
  className?: string;
};

/**
 * 동네 TOP5·최근 기록처럼 카드를 가로로 넘겨 보는 레일. 마우스는 끌어서, 터치는 밀어서 넘긴다.
 * `className`에서 `--horizontal-rail-bleed`를 부모의 좌우 패딩과 같게 주면 첫 카드는 본문과 줄을 맞추고,
 * 넘기는 카드는 패딩을 넘어 화면 끝에서 잘린다. 카드 간격은 `--horizontal-rail-gap`으로 바꾼다.
 */
const HorizontalRail = ({ children, 'aria-label': ariaLabel, className }: HorizontalRailProps) => {
  const drag = useHorizontalDrag();
  return (
    <div className={`${styles.rail} ${className ?? ''}`.trim()} aria-label={ariaLabel} {...drag}>
      {children}
    </div>
  );
};

const styles = {
  rail: css`
    label: HorizontalRail-rail;
    display: flex;
    gap: var(--horizontal-rail-gap, 0.55rem);
    margin-inline: calc(-1 * var(--horizontal-rail-bleed, 0px));
    padding-inline: var(--horizontal-rail-bleed, 0px);
    overflow-x: auto;
    scroll-snap-type: x proximity;
    scroll-padding-inline: var(--horizontal-rail-bleed, 0px);
    scrollbar-width: none;
    cursor: grab;
    user-select: none;
    touch-action: pan-x pan-y;

    &::-webkit-scrollbar {
      display: none;
    }

    & > * {
      flex-shrink: 0;
      scroll-snap-align: start;
    }

    &[data-dragging='true'] {
      cursor: grabbing;
      scroll-snap-type: none;
    }

    &[data-dragging='true'] > * {
      cursor: grabbing;
    }
  `,
};

export default HorizontalRail;
