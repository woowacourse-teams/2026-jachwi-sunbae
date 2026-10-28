import { css } from '@emotion/css';

export const item = css`
  label: PropertyPhotoCard-item;
  position: relative;
  min-width: 0;

  & > .authenticated-photo,
  & > .authenticated-photo__image {
    aspect-ratio: 1;
  }
`;

export const deleteButton = css`
  label: PropertyPhotoCard-deleteButton;
  position: absolute;
  z-index: 2;
  top: 0.35rem;
  right: 0.35rem;
  display: grid;
  width: 1.65rem;
  min-width: 1.65rem;
  min-height: 1.65rem;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: var(--color-overlay-strong);
  color: var(--color-on-primary);
  font-size: 0;
  cursor: pointer;
  place-items: center;

  &::before,
  &::after {
    position: absolute;
    width: 0.7rem;
    height: 1px;
    background: currentColor;
    content: '';
  }

  &::before {
    transform: rotate(45deg);
  }

  &::after {
    transform: rotate(-45deg);
  }
`;

export const representativeButton = css`
  label: PropertyPhotoCard-representativeButton;
  position: absolute;
  z-index: 2;
  top: 0.35rem;
  left: 0.35rem;
  display: inline-flex;
  min-height: 1.65rem;
  align-items: center;
  gap: 0.2rem;
  padding: 0.2rem 0.3rem;
  border: 0;
  border-radius: 999px;
  background: var(--color-overlay-strong);
  color: var(--color-on-primary);
  font: inherit;
  font-size: 0.52rem;
  font-weight: 800;
  cursor: pointer;

  &:disabled {
    cursor: default;
  }
`;

export const isRepresentative = css`
  label: PropertyPhotoCard-isRepresentative;
  background: var(--color-primary-dark);
`;

export const representativeError = css`
  label: PropertyPhotoCard-representativeError;
  position: absolute;
  right: 0.2rem;
  bottom: 0.2rem;
  left: 0.2rem;
  z-index: 2;
  margin: 0;
  padding: 0.18rem;
  border-radius: 0.25rem;
  background: var(--color-error-surface);
  color: var(--color-error);
  font-size: 0.52rem;
  font-weight: 700;
  text-align: center;
`;
