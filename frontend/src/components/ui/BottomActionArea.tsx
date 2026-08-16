import type { ReactNode } from 'react';
import styles from './BottomActionArea.module.css';

type BottomActionAreaProps = {
  children: ReactNode;
  sticky?: boolean;
};

const BottomActionArea = ({ children, sticky = true }: BottomActionAreaProps) => (
  <div className={`${styles.actions} ${sticky ? styles.sticky : ''}`}>{children}</div>
);

export default BottomActionArea;
