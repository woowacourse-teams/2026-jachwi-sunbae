import { css } from '@emotion/css';

export const card = css`
  label: AreaActionCard-card;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.7rem 0.9rem;
  border: 1px solid var(--color-border-strong);
  border-radius: 1rem;
  background: var(--color-surface);
  color: var(--color-ink);
  text-decoration: none;

  &:hover {
    background: var(--color-surface-muted);
  }
`;

export const icon = css`
  label: AreaActionCard-icon;
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  overflow: hidden;
  border-radius: 0.75rem;
  background: var(--color-surface-muted);
  color: var(--color-primary);

  & img {
    width: 100%;
    height: 100%;
  }
`;

export const text = css`
  label: AreaActionCard-text;
  display: grid;
  flex: 1;
  min-width: 0;
  gap: 0.15rem;
  text-align: left;

  & strong {
    font-size: 0.9rem;
    font-weight: 700;
    line-height: 1.3;
  }

  & small {
    font-size: 0.72rem;
    line-height: 1.3;
    color: var(--color-ink-soft);
  }
`;

export const trailing = css`
  label: AreaActionCard-trailing;
  display: inline-flex;
  flex-shrink: 0;
  color: var(--color-ink-soft);
`;
