import { css } from '@emotion/css';

import { WHY_REASONS } from '../model/landingContent';

/** 왜 만들었는지 세 가지. 데스크탑은 가로 세 칸, 휴대폰은 위아래로 쌓는다. */
const LandingWhy = ({ layout }: { layout: 'row' | 'stack' }) => (
  <ul className={layout === 'row' ? styles.row : styles.stack}>
    {WHY_REASONS.map((reason) => (
      <li key={reason.title} className={styles.card}>
        <strong>{reason.title}</strong>
        <p>{reason.description}</p>
      </li>
    ))}
  </ul>
);

const styles = {
  row: css`
    label: LandingWhy-row;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.75rem;
    margin: 0;
    padding: 0;
    list-style: none;
  `,

  stack: css`
    label: LandingWhy-stack;
    display: grid;
    gap: 0.75rem;
    margin: 0;
    padding: 0;
    list-style: none;
  `,

  card: css`
    label: LandingWhy-card;
    display: grid;
    align-content: start;
    gap: 0.375rem;
    padding: 1.25rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    background: var(--color-surface);

    & strong {
      font-size: 1rem;
      font-weight: 800;
      word-break: keep-all;
    }

    & p {
      margin: 0;
      color: var(--color-ink-soft);
      font-size: 0.9rem;
      line-height: 1.55;
      word-break: keep-all;
    }
  `,
};

export default LandingWhy;
