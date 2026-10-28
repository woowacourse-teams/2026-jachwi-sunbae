import { css, cx } from '@emotion/css';

export const panel = css`
  label: NeighborhoodPlacePanel-panel;
  position: absolute;
  inset: 0;
  overflow-y: auto;
  padding: 1.25rem 1.25rem 1.5rem;
  background: white;
  color: var(--color-ink);
`;

export const title = css`
  label: NeighborhoodPlacePanel-title;
  margin: 0 0 0.4rem;
  font-size: 1.1rem;
`;

// 다른 요소의 선택자에서 `.NeighborhoodPlacePanel-details`로 가리킨다.
export const details = cx(
  css`
    label: NeighborhoodPlacePanel-details;
    display: grid;
    gap: 0.75rem;
  `,
  'NeighborhoodPlacePanel-details',
);

// 다른 요소의 선택자에서 `.NeighborhoodPlacePanel-actions`로 가리킨다.
export const actions = cx(
  css`
    label: NeighborhoodPlacePanel-actions;
    display: grid;
    gap: 0.5rem;

    & a {
      padding: 0.8rem 1rem;
      border: 1px solid var(--color-border);
      border-radius: 0.7rem;
      color: var(--color-ink);
      font-size: 0.9rem;
      font-weight: 650;
      text-align: center;
      text-decoration: none;
    }
  `,
  'NeighborhoodPlacePanel-actions',
);

export const primary = css`
  label: NeighborhoodPlacePanel-primary;

  .NeighborhoodPlacePanel-actions &,
  .NeighborhoodPlacePanel-details > & {
    border-color: transparent;
    background: var(--color-ink);
    color: white;
  }

  .NeighborhoodPlacePanel-details > & {
    padding: 0.85rem 1rem;
    border: 0;
    border-radius: 0.7rem;
    font-size: 0.9rem;
    font-weight: 650;
    cursor: pointer;
  }

  .NeighborhoodPlacePanel-details > &:disabled {
    opacity: 0.4;
    cursor: default;
  }
`;

export const empty = css`
  label: NeighborhoodPlacePanel-empty;
  margin: 0 0 0.5rem;
  color: var(--color-ink-soft);
  font-size: 0.85rem;
`;

export const lead = css`
  label: NeighborhoodPlacePanel-lead;
  margin: 0 0 0.5rem;
  color: var(--color-ink-soft);
  font-size: 0.85rem;
`;

export const phone = css`
  label: NeighborhoodPlacePanel-phone;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.6rem;
  padding: 0.8rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 0.7rem;

  & strong {
    font-size: 1.05rem;
    letter-spacing: 0.01em;
  }

  & button {
    padding: 0.4rem 0.7rem;
    border: 0;
    border-radius: 0.5rem;
    background: var(--color-surface-muted);
    color: var(--color-ink);
    font-size: 0.8rem;
    font-weight: 650;
    cursor: pointer;
  }

  & span {
    color: var(--color-muted);
    font-size: 0.75rem;
  }
`;

export const summary = css`
  label: NeighborhoodPlacePanel-summary;
  margin: 0;
  font-size: 1.05rem;
  font-weight: 750;
`;

/* 휴대폰에서 정류장 경로를 전체 화면으로 여는 창. 동네 대중교통 상세와 같은 자리를 쓴다. */
export const screen = css`
  label: NeighborhoodPlacePanel-screen;
  position: absolute;
  inset: 0;
  z-index: 45;
  overflow-y: auto;
  padding: 1rem 1.25rem calc(env(safe-area-inset-bottom) + 1.5rem);
  background: white;
  color: var(--color-ink);
`;

export const screenHeader = css`
  label: NeighborhoodPlacePanel-screenHeader;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 1rem;

  & h1 {
    margin: 0;
    font-size: 1.1rem;
  }

  & button {
    display: grid;
    width: 2.5rem;
    height: 2.5rem;
    padding: 0;
    place-items: center;
    border: 0;
    background: none;
    color: inherit;
    cursor: pointer;
  }
`;
