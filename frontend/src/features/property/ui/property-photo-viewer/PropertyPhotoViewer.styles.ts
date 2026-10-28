import { css, cx } from '@emotion/css';

export const backdrop = css`
  label: PropertyPhotoViewer-backdrop;
  position: fixed;
  z-index: 100;
  inset: 0;
  display: grid;
  box-sizing: border-box;
  overflow: hidden;
  padding: max(env(safe-area-inset-top), 0.5rem) 0 max(env(safe-area-inset-bottom), 0.5rem);
  background: rgb(14 17 15 / 94%);
  place-items: start center;
`;

export const viewer = css`
  label: PropertyPhotoViewer-viewer;
  display: grid;
  width: min(100%, var(--app-max-width));
  max-height: 100%;
  overflow: hidden;
  grid-template-rows: auto minmax(0, 1fr) auto;
  color: var(--color-on-primary);
`;

// 다른 요소의 선택자에서 `.PropertyPhotoViewer-header`로 가리킨다.
export const header = cx(
  css`
    label: PropertyPhotoViewer-header;
    display: grid;
    min-height: var(--app-bar-height);
    grid-template-columns: minmax(0, 1fr) auto 2.75rem;
    align-items: center;
    gap: 0.75rem;
    padding: 0 0.75rem 0 1rem;

    & strong {
      overflow: hidden;
      font-size: 0.9rem;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    & span {
      color: rgb(255 255 255 / 70%);
      font-size: 0.75rem;
      font-weight: 750;
    }

    & button {
      display: grid;
      border: 0;
      border-radius: 999px;
      background: rgb(255 255 255 / 12%);
      color: inherit;
      cursor: pointer;
      place-items: center;
    }

    & button {
      width: 2.75rem;
      height: 2.75rem;
    }
  `,
  'PropertyPhotoViewer-header',
);

// 다른 요소의 선택자에서 `.PropertyPhotoViewer-controls`로 가리킨다.
export const controls = cx(
  css`
    label: PropertyPhotoViewer-controls;

    & button {
      display: grid;
      border: 0;
      border-radius: 999px;
      background: rgb(255 255 255 / 12%);
      color: inherit;
      cursor: pointer;
      place-items: center;
    }

    & {
      display: flex;
      justify-content: center;
      gap: 1rem;
      padding: 0.75rem 1rem 1rem;
    }

    & button {
      width: 3rem;
      height: 3rem;
    }

    & button:disabled {
      opacity: 0.25;
      cursor: default;
    }
  `,
  'PropertyPhotoViewer-controls',
);

export const photoArea = css`
  label: PropertyPhotoViewer-photoArea;
  display: grid;
  min-height: 0;
  padding: 0.75rem 0;
  place-items: center;
`;

export const photo = css`
  label: PropertyPhotoViewer-photo;
  width: 100%;
  max-height: 100%;
  object-fit: contain;
`;

export const state = css`
  label: PropertyPhotoViewer-state;
  display: grid;
  justify-items: center;
  gap: 0.75rem;
  color: rgb(255 255 255 / 78%);
  font-size: 0.8rem;

  & button {
    padding: 0.55rem 0.8rem;
    border: 1px solid rgb(255 255 255 / 32%);
    border-radius: 999px;
    background: transparent;
    color: inherit;
    font: inherit;
    font-weight: 800;
    cursor: pointer;
  }

  :is(.PropertyPhotoViewer-header button, .PropertyPhotoViewer-controls button, & button):focus-visible {
    outline: 2px solid var(--color-brand-300);
    outline-offset: 2px;
  }
`;
