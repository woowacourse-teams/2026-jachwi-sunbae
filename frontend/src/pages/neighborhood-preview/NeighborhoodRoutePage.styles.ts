import { css } from '@emotion/css';

export const page = css`
  label: NeighborhoodRoutePage-page;
  min-height: 100%;
  padding: 1rem 1.5rem 2rem;
  background: white;
  color: var(--color-ink);

  & h1 {
    font-size: 1.5rem;
    margin: 0 0 0.5rem;
  }
`;

export const detailPage = css`
  label: NeighborhoodRoutePage-detailPage;
  position: absolute;
  inset: 0;
  z-index: 30;
  overflow-y: auto;
  padding: 1rem 1.25rem calc(var(--map-sheet-bottom, 0px) + 1.5rem);
  background: white;
  color: var(--color-ink);

  & h1 {
    margin: 0;
    font-size: 1.1rem;
  }
`;

export const header = css`
  label: NeighborhoodRoutePage-header;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 1rem;
  font-weight: 650;

  & button {
    display: grid;
    place-items: center;
    width: 2.5rem;
    height: 2.5rem;
    border: 0;
    background: none;
    color: inherit;
    cursor: pointer;
  }
`;
