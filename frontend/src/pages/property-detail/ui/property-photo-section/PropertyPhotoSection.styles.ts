import { css } from '@emotion/css';

export const grid = css`
  label: PropertyPhotoSection-grid;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.35rem;
`;

export const thumbnailButton = css`
  label: PropertyPhotoSection-thumbnailButton;
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  padding: 0;
  border: 0;
  border-radius: var(--radius-sm);
  background: var(--color-surface-disabled);
  cursor: pointer;
`;

export const thumbnail = css`
  label: PropertyPhotoSection-thumbnail;
  width: 100%;
  height: 100%;
  padding: 0;
  border-radius: 0;
  object-fit: cover;
`;

export const moreOverlay = css`
  label: PropertyPhotoSection-moreOverlay;
  position: absolute;
  inset: 0;
  display: grid;
  background: var(--color-overlay);
  color: white;
  font-size: 0.75rem;
  font-weight: 800;
  place-items: center;
`;

export const emptyLink = css`
  label: PropertyPhotoSection-emptyLink;
  display: flex;
  min-height: 2.75rem;
  align-items: center;
  justify-content: center;
  border: 1px dashed var(--color-border-strong);
  border-radius: var(--radius-sm);
  color: var(--color-muted);
  font-size: 0.72rem;
  text-decoration: none;
`;
