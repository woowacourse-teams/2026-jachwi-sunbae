import { css } from '@emotion/css';

/* 비교 데스크탑·휴대폰 화면이 함께 쓰는 틀과 선택 개수 줄. */
export const page = css`
  label: ComparePage-page;
  min-height: 100%;
  padding-bottom: 7.6rem;
  background: var(--color-canvas);
`;

export const content = css`
  label: ComparePage-content;
  display: grid;
  gap: 1rem;
  padding: 0 1rem 1.5rem;
`;

export const selectionHeader = css`
  label: ComparePage-selectionHeader;
  display: flex;
  gap: 0.5rem;
  align-items: center;
  justify-content: space-between;
  min-height: 1.5rem;
  color: var(--color-muted);
  font-size: 0.7rem;

  & strong {
    color: var(--color-primary-dark);
    font-size: 0.76rem;
  }
`;
