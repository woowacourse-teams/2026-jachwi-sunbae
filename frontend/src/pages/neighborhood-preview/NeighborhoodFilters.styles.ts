import { css } from '@emotion/css';

export const editor = css`
  label: NeighborhoodFilters-editor;
  display: flex;
  flex-direction: column;
  min-height: 100%;
  gap: 1rem;

  & > * {
    flex-shrink: 0;
  }

  & > button:last-child {
    margin-top: auto;
  }
`;

export const choices = css`
  label: NeighborhoodFilters-choices;
  display: flex;
  gap: 0.6rem;
  margin: 0.5rem 0 1rem;

  & button {
    display: flex;
    flex: 1;
    font-size: 0.8rem;
  }
`;
