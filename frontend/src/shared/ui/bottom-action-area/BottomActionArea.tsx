import { css } from '@emotion/css';
import type { ReactNode } from 'react';

/**
 * `inline` 문서 흐름 그대로 · `sticky` 스크롤 컨테이너 아래 · `screen` 화면 맨 아래 고정.
 * 화면을 벗어나면 안 되는 주요 액션은 `screen`을 쓴다.
 */
type ActionPlacement = 'inline' | 'sticky' | 'screen';

type BottomActionAreaProps = {
  children: ReactNode;
  placement?: ActionPlacement;
  divider?: boolean;
  className?: string;
};

const BottomActionArea = ({ children, placement = 'sticky', divider = true, className }: BottomActionAreaProps) => (
  <div
    className={`${styles.actions} ${styles[placement]} ${className ?? ''}`.trim()}
    data-divider={divider ? 'true' : 'false'}
  >
    {children}
  </div>
);

const styles = {
  actions: css`
    label: BottomActionArea-actions;
    display: grid;
    grid-auto-columns: minmax(0, 1fr);
    grid-auto-flow: column;
    gap: 0.55rem;
    padding: 0.6rem 0;
    background: var(--color-canvas);
  `,

  inline: css`
    label: BottomActionArea-inline;
    margin-top: 0.75rem;
  `,

  /* 화면 맨 아래 고정. 폼을 길게 내려도 주요 액션이 늘 같은 자리에 있다. */
  screen: css`
    label: BottomActionArea-screen;
    position: fixed;
    right: 0;
    bottom: 0;
    left: 50%;
    z-index: 100;
    box-sizing: border-box;
    width: min(100%, var(--app-max-width));
    margin: 0;
    padding: 0.5rem 1rem calc(0.75rem + env(safe-area-inset-bottom));
    border-top: 1px solid var(--color-border);
    background: color-mix(in srgb, var(--color-canvas) 96%, transparent);
    box-shadow: 0 -0.35rem 1rem rgb(59 52 36 / 8%);
    transform: translateX(-50%);

    &[data-divider='false'] {
      border-top: 0;
    }
  `,

  sticky: css`
    label: BottomActionArea-sticky;
    position: sticky;
    z-index: 15;
    bottom: 0;
    margin: 0 -1rem -1rem;
    padding: 0.75rem 1rem;
    background: color-mix(in srgb, var(--color-canvas) 94%, transparent);
    backdrop-filter: blur(12px);

    &[data-divider='true'] {
      border-top: 1px solid var(--color-border);
    }
  `,
};

export default BottomActionArea;
