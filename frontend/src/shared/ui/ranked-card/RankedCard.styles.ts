import { css } from '@emotion/css';

export const card = css`
  label: RankedCard-card;
  display: grid;
  gap: 0.55rem;
  min-width: 0;
  padding: 0.8rem;
  border: 1px solid var(--color-border);
  border-radius: 0.7rem;
  background: var(--color-surface);

  &:hover:not(:disabled) {
    background: var(--color-surface-muted);
  }
`;

export const heading = css`
  label: RankedCard-heading;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  min-width: 0;
`;

/* 순위는 숫자 원 대신 리본 메달 이미지로 보여 준다. 순위 자체는 카드 이름(aria-label)으로 읽힌다. */
export const rank = css`
  label: RankedCard-rank;
  display: block;
  width: 2.5rem;
  height: 2.5rem;
  flex: none;
  object-fit: contain;
  user-select: none;
`;

export const title = css`
  label: RankedCard-title;
  font-size: 0.8rem;
  font-weight: 650;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`;

export const value = css`
  label: RankedCard-value;
  font-size: 1.5rem;

  & span {
    font-size: 0.8rem;
    margin-left: 0.2rem;
  }
`;

export const description = css`
  label: RankedCard-description;
  font-size: 0.7rem;
  color: var(--color-muted);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`;
