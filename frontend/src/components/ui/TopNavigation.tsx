import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import Icon from './Icon';
import styles from './TopNavigation.module.css';

type TopNavigationProps = {
  title: string;
  meta?: ReactNode;
  backTo?: string;
  backLabel?: string;
  endSlot?: ReactNode;
  className?: string;
};

const TopNavigation = ({ title, meta, backTo, backLabel = '뒤로 가기', endSlot, className }: TopNavigationProps) => (
  <header className={`${styles.root} ${className ?? ''}`}>
    <div className={styles.leading}>
      {backTo !== undefined && (
        <Link className={styles.backLink} to={backTo} aria-label={backLabel}>
          <Icon name="arrow-left" size={21} />
        </Link>
      )}
      <strong className={styles.title}>{title}</strong>
    </div>
    {(meta !== undefined || endSlot !== undefined) && (
      <div className={styles.endSlot}>
        {meta !== undefined && <span className={styles.meta}>{meta}</span>}
        {endSlot}
      </div>
    )}
  </header>
);

export default TopNavigation;
