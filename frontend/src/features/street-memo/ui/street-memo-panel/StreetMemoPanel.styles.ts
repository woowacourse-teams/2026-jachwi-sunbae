import { css } from '@emotion/css';

export const panel = css`
  label: StreetMemoPanel-panel;
  display: grid;
  align-content: start;
  gap: 1rem;
  padding: 1.25rem;
`;

export const header = css`
  label: StreetMemoPanel-header;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;

  & h2 {
    margin: 0;
    font-size: 1.125rem;
  }
`;
