import { css } from '@emotion/css';

export const rent = css`
  label: RouteDetailBody-rent;
  display: grid;
  gap: 0.25rem;
  margin-bottom: 1rem;
  padding: 0.9rem 1rem;
  border-radius: 0.75rem;
  background: var(--color-surface-muted);

  & > span,
  & > small {
    color: var(--color-muted);
    font-size: 0.8rem;
  }

  & > strong {
    font-size: 1rem;
  }
`;

export const notice = css`
  label: RouteDetailBody-notice;
  color: var(--color-muted);
  line-height: 1.6;
  font-size: 0.8rem;
  margin-top: 1.5rem;
`;

export const actions = css`
  label: RouteDetailBody-actions;
  display: grid;
  gap: 0.5rem;
  margin-top: 1rem;
`;
