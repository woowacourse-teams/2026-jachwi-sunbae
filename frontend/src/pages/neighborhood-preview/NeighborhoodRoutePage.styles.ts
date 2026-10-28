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

  /* 데스크탑은 목록 옆 상세 칸(ListDetailLayout)을 채운다. 닫기는 칸 옆 지도 위 버튼이 맡는다. */
  @media (min-width: 1024px) {
    z-index: auto;
    padding-top: 1.25rem;
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

export const rent = css`
  label: NeighborhoodRoutePage-rent;
  display: grid;
  gap: 0.25rem;
  margin-bottom: 1rem;
  padding: 0.9rem 1rem;
  border-radius: 0.75rem;
  background: var(--color-surface-muted);

  & > span,
  & > small {
    color: var(--color-muted);
    font-size: 0.8rem;
  }

  & > strong {
    font-size: 1rem;
  }
`;

export const address = css`
  label: NeighborhoodRoutePage-address;
  color: var(--color-muted);
  line-height: 1.6;
`;

export const notice = css`
  label: NeighborhoodRoutePage-notice;
  color: var(--color-muted);
  line-height: 1.6;
  font-size: 0.8rem;
  margin-top: 1.5rem;
`;

export const actions = css`
  label: NeighborhoodRoutePage-actions;
  display: grid;
  gap: 0.5rem;
  margin-top: 1rem;
`;
