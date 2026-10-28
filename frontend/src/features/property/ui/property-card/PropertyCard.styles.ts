import { css } from '@emotion/css';

export const listItem = css`
  label: PropertyCard-listItem;
  display: flex;
  min-width: 0;
  align-items: stretch;
  gap: 0.875rem;
  padding: 0.425rem 0;
  border-bottom: 0;
  background: var(--color-canvas, #fff);
  color: inherit;
`;

export const visual = css`
  label: PropertyCard-visual;
  width: 6.7rem;
  min-height: 8.5rem;
  flex: 0 0 6.7rem;
  overflow: hidden;
  border-radius: var(--radius-sm, 0.65rem);
  background: var(--color-surface-muted, #f7f7f7);
`;

export const photo = css`
  label: PropertyCard-photo;
  border: 0;
  padding: 0;
  display: grid;
  width: 100%;
  height: 100%;
  place-items: center;
  background: var(--color-surface-muted, #f7f7f7);
  color: var(--color-muted, #868b94);
  cursor: pointer;

  & img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

export const emptyPhoto = css`
  label: PropertyCard-emptyPhoto;
  display: grid;
  width: 100%;
  height: 100%;
  place-items: center;
  color: var(--color-muted, #868b94);

  & img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

export const actions = css`
  label: PropertyCard-actions;
  position: relative;
  flex: none;
  align-self: flex-start;
`;

export const mainLink = css`
  label: PropertyCard-mainLink;
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  justify-content: center;
  gap: 0.35rem;
  color: inherit;
  text-decoration: none;
`;

export const details = css`
  label: PropertyCard-details;
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 0.25rem;
`;

export const title = css`
  label: PropertyCard-title;
  overflow: hidden;
  color: var(--color-ink, #212124);
  font-size: 1rem;
  font-weight: 400;
  line-height: 1.3;
  letter-spacing: -0.03em;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const price = css`
  label: PropertyCard-price;
  margin: 0;
  color: var(--color-ink, #212124);
  font-size: 0.8rem;
  font-weight: 400;
`;

export const address = css`
  label: PropertyCard-address;
  margin: 0;
  overflow: hidden;
  color: var(--color-muted, #868b94);
  font-size: 0.76rem;
  font-weight: 400;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const stageProgress = css`
  label: PropertyCard-stageProgress;
  display: grid;
  gap: 0.3rem;
  margin-top: 0.2rem;
  padding-top: 0.1rem;
`;

export const stageStartHint = css`
  label: PropertyCard-stageStartHint;
  display: flex;
  justify-content: flex-end;
  color: var(--color-ink, #212124);
  font-size: 0.74rem;
  font-weight: 500;

  /* strong 기본 굵기가 카드에서 제일 무거워지지 않게 맞춘다. */
  & strong {
    font-weight: inherit;
  }
`;

export const inactiveBar = css`
  label: PropertyCard-inactiveBar;
  display: block;
  width: 100%;
  height: 0.3rem;
  margin-top: 0.2rem;
  border-radius: 999px;
  background: var(--color-border, #eaebed);
`;
