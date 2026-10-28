import { css } from '@emotion/css';

export const description = css`
  label: PropertyActiveChecklistPage-description;
  margin: 0.9rem 0 0.75rem;
  padding: 0;
  color: var(--color-muted);
  font-size: 0.82rem;
  line-height: 1.5;
`;

export const loadMore = css`
  label: PropertyActiveChecklistPage-loadMore;
  display: grid;
  gap: 0.45rem;
  margin-top: 0.75rem;
`;

export const bottomAction = css`
  label: PropertyActiveChecklistPage-bottomAction;

  & > div {
    margin-right: -1rem;
    margin-left: -1rem;
  }
`;
