import { css } from '@emotion/css';

export const list = css`
  label: ChecklistListContent-list;
  display: grid;
  gap: 0.55rem;
  margin: 0.7rem 1rem 0;
  padding: 0;
  list-style: none;
`;

export const emptyState = css`
  label: ChecklistListContent-emptyState;
  margin: 1rem;
  padding: 1.2rem 0;
  color: var(--color-muted);
  font-size: 0.78rem;
  text-align: center;
`;

export const createCard = css`
  label: ChecklistListContent-createCard;
  margin: 0.55rem 1rem 0;
`;
