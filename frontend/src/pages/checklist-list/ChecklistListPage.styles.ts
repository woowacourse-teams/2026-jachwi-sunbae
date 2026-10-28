import { css } from '@emotion/css';

export const page = css`
  label: ChecklistListPage-page;
  min-height: 100%;
  background: var(--color-canvas);
`;

export const container = css`
  label: ChecklistListPage-container;
  padding: 0 0 1.5rem;

  & > .content-state,
  & > .load-more {
    margin-right: 1rem;
    margin-left: 1rem;
  }
`;

export const navigationArea = css`
  label: ChecklistListPage-navigationArea;
  padding: 0 1rem;
  background: var(--color-canvas);

  & > [data-full-bleed='true'] {
    width: 100%;
    margin-left: 0;
  }
`;

export const topNavigation = css`
  label: ChecklistListPage-topNavigation;
  margin-bottom: 0;
  border-bottom: 0;
`;

export const description = css`
  label: ChecklistListPage-description;
  margin: 0.65rem 0 0;
  color: var(--color-muted);
  font-size: 0.68rem;
  line-height: 1.5;
`;
