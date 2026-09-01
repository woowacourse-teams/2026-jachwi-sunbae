import type { ReactNode } from 'react';
import styles from './BottomActionArea.module.css';

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

const BottomActionArea = ({
  children,
  placement = 'sticky',
  divider = true,
  className,
}: BottomActionAreaProps) => (
  <div
    className={`${styles.actions} ${styles[placement]} ${className ?? ''}`.trim()}
    data-divider={divider ? 'true' : 'false'}
  >
    {children}
  </div>
);

export default BottomActionArea;
