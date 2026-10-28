import { css } from '@emotion/css';

export const heading = css`
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
`;

export const backLink = css`
  label: upcoming-feature-PageHeading-backLink;
  display: inline-flex;
  min-height: 2.75rem;
  align-items: center;
  color: var(--color-primary-dark);
  font-weight: 750;
  text-decoration: none;
`;
