import { css } from '@emotion/css';

export const root = css`
  label: PropertyPhotoManager-root;
  scroll-margin-top: 1rem;
`;

export const heading = css`
  label: PropertyPhotoManager-heading;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.65rem;

  & h2 {
    margin: 0;
    color: var(--color-ink);
    font-size: 0.9rem;
  }
`;

export const grid = css`
  label: PropertyPhotoManager-grid;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.45rem;

  & .photo-grid__item {
    aspect-ratio: 1;
  }

  & .photo-grid__item .authenticated-photo,
  & .photo-grid__item > .authenticated-photo__image {
    width: 100%;
    height: 100%;
    aspect-ratio: 1;
    border-radius: var(--radius-sm);
  }

  & .photo-delete-button {
    display: grid;
    min-width: 2rem;
    min-height: 2rem;
    animation: none;
    font-size: 0;
    place-items: center;
  }

  & .photo-delete-button::before,
  & .photo-delete-button::after {
    position: absolute;
    width: 0.75rem;
    height: 1px;
    background: currentColor;
    content: '';
  }

  & .photo-delete-button::before {
    transform: rotate(45deg);
  }

  & .photo-delete-button::after {
    transform: rotate(-45deg);
  }
`;

export const photoList = css`
  label: PropertyPhotoManager-photoList;
  display: contents;
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const empty = css`
  label: PropertyPhotoManager-empty;
  display: grid;
  grid-column: span 3;
  align-content: center;
  gap: 0.25rem;
  min-height: 4.5rem;
  padding: 0.75rem;
  border: 0;
  color: var(--color-muted);
  font-size: 0.7rem;

  & strong {
    color: var(--color-ink);
    font-size: 0.78rem;
  }
`;

export const loadMore = css`
  label: PropertyPhotoManager-loadMore;
  width: 100%;
  min-height: 2.75rem;
  margin-top: 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-ink);
  font-weight: 750;
`;

export const state = css`
  label: PropertyPhotoManager-state;
  display: flex;
  min-height: 5rem;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: var(--color-muted);
  font-size: 0.75rem;

  & button {
    border: 0;
    background: transparent;
    color: var(--color-primary-dark);
    font: inherit;
    font-weight: 800;
    cursor: pointer;
  }
`;
