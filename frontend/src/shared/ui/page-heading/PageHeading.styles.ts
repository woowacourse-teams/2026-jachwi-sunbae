import { css } from '@emotion/css';

export const heading = css`
  label: ui-PageHeading-heading;
  margin: 0.85rem 0 0.5rem;
  color: var(--color-ink, #212124);
  font-size: 1.35rem;
  font-weight: 800;
  letter-spacing: -0.04em;
`;

export const overlap = css`
  label: ui-PageHeading-overlap;
  position: relative;
  margin: -1rem -1rem 0.5rem;
  padding: 1.25rem 1rem 0.8rem;
  border-radius: var(--radius-lg, 1.25rem) var(--radius-lg, 1.25rem) 0 0;
  background: var(--color-surface);
`;
