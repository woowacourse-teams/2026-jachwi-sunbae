import { css } from '@emotion/css';

export const notice = css`
  label: InlineNotice-notice;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: start;
  gap: 0.55rem;
  padding: 0.8rem 0.9rem;
  border-radius: var(--radius-sm);
  font-size: 0.76rem;
  line-height: 1.5;

  & svg {
    margin-top: 0.05rem;
  }
`;

export const info = css`
  label: InlineNotice-info;
  background: var(--color-surface-muted);
  color: var(--color-ink-soft);
`;

export const warning = css`
  label: InlineNotice-warning;
  background: var(--color-warning-surface);
  color: var(--color-warning-ink);
`;

export const error = css`
  label: InlineNotice-error;
  background: var(--color-error-surface);
  color: var(--color-error);
`;
