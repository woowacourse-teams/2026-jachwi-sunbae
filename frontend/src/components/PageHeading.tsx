import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import styles from './PageHeading.module.css';

type PageHeadingProps = {
  title: string;
  description?: string;
  backTo?: string;
  backLabel?: string;
  focusOnMount?: boolean;
  action?: ReactNode;
};

const PageHeading = ({
  title,
  description,
  backTo,
  backLabel = '뒤로',
  focusOnMount = false,
  action,
}: PageHeadingProps) => {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (focusOnMount) headingRef.current?.focus();
  }, [focusOnMount]);

  return (
    <header className={styles.heading}>
      {backTo !== undefined && (
        <Link className={styles.backLink} to={backTo}>
          ← {backLabel}
        </Link>
      )}
      <div className={styles.row}>
        <div>
          <h1 ref={headingRef} tabIndex={-1}>
            {title}
          </h1>
          {description !== undefined && <p>{description}</p>}
        </div>
        {action !== undefined && <div className={styles.action}>{action}</div>}
      </div>
    </header>
  );
};

export default PageHeading;
