import { css } from '@emotion/css';

type PageHeadingProps = {
  title: string;
  variant?: 'default' | 'overlap';
};

const PageHeading = ({ title, variant = 'default' }: PageHeadingProps) => (
  <h1 className={`${styles.heading} ${variant === 'overlap' ? styles.overlap : ''}`}>{title}</h1>
);

const styles = {
  heading: css`
    label: ui-PageHeading-heading;
    margin: 0.85rem 0 0.5rem;
    color: var(--color-ink, #212124);
    font-size: 1.35rem;
    font-weight: 800;
    letter-spacing: -0.04em;
  `,

  overlap: css`
    label: ui-PageHeading-overlap;
    position: relative;
    margin: -1rem -1rem 0.5rem;
    padding: 1.25rem 1rem 0.8rem;
    border-radius: var(--radius-lg, 1.25rem) var(--radius-lg, 1.25rem) 0 0;
    background: var(--color-surface);
  `,
};

export default PageHeading;
