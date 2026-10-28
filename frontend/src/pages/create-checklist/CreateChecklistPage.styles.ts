import { css } from '@emotion/css';

export const page = css`
  label: CreateChecklistPage-page;
  background: var(--color-canvas);
`;

export const topNavigation = css`
  label: CreateChecklistPage-topNavigation;
  margin-bottom: 0;
`;

export const container = css`
  label: CreateChecklistPage-container;

  & > [data-full-bleed='true'] {
    margin-top: -0.15rem;
  }
`;
