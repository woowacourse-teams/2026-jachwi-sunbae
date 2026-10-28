import { css } from '@emotion/css';

export const root = css`
  label: PhotoUploadPanel-root;
  display: contents;
`;

export const tile = css`
  label: PhotoUploadPanel-tile;
  display: grid;
  aspect-ratio: 1;
  align-content: center;
  justify-items: center;
  gap: 0.25rem;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-sm);
  background: var(--color-surface-neutral);
  color: var(--color-muted);
  cursor: pointer;
  transition: background-color 160ms ease;

  &:hover:not([data-disabled='true']) {
    background: var(--color-search-surface);
  }

  & strong {
    font-size: 0.78rem;
  }

  & small {
    color: var(--color-muted);
    font-size: 0.64rem;
  }

  &[data-disabled='true'] {
    cursor: not-allowed;
    opacity: 0.55;
  }
`;

export const feedback = css`
  label: PhotoUploadPanel-feedback;
  grid-column: 1 / -1;
`;

export const errorList = css`
  label: PhotoUploadPanel-errorList;
  color: var(--color-error);
  font-size: 0.7rem;
  line-height: 1.45;

  & p {
    margin: 0;
  }

  & p + p {
    margin-top: 0.2rem;
  }
`;
