import { css } from '@emotion/css';
import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

type PageHeadingProps = {
  title: string;
  description?: string;
  backTo?: string;
  backLabel?: string;
  focusOnMount?: boolean;
};

const PageHeading = ({ title, description, backTo, backLabel = '뒤로', focusOnMount = false }: PageHeadingProps) => {
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
      <h1 ref={headingRef} tabIndex={-1}>
        {title}
      </h1>
      {description !== undefined && <p>{description}</p>}
    </header>
  );
};

const styles = {
  heading: css`
    label: upcoming-feature-PageHeading-heading;
    margin-bottom: 1.2rem;

    & h1 {
      margin: 0.4rem 0 0;
      overflow-wrap: anywhere;
      font-size: clamp(1.65rem, 7vw, 2.4rem);
      letter-spacing: -0.05em;
      line-height: 1.15;
    }

    & p {
      margin: 0.55rem 0 0;
      color: var(--color-ink-soft);
      line-height: 1.55;
    }
  `,

  backLink: css`
    label: upcoming-feature-PageHeading-backLink;
    display: inline-flex;
    min-height: 2.75rem;
    align-items: center;
    color: var(--color-primary-dark);
    font-weight: 750;
    text-decoration: none;
  `,
};

export default PageHeading;
