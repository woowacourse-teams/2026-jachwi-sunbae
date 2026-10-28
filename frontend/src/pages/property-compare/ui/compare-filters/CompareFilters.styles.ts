import { css } from '@emotion/css';

/* 리스트 위 줄 오른쪽에 두는 가로 필터 줄: 이름 검색, 월세 칩, 체크리스트 칩, 결과 개수. */
export const filters = css`
  label: CompareFilters-filters;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem 0.9rem;
`;

export const search = css`
  label: CompareFilters-search;
  width: 9rem;

  /* 공용 채움형 입력칸보다 작게 두려고 크기만 덮어쓴다. */
  & input {
    min-height: 2rem !important;
    padding: 0.35rem 0.7rem !important;
    font-size: 0.66rem !important;
  }

  & label {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
  }
`;

export const group = css`
  label: CompareFilters-group;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin: 0;
  padding: 0;
  border: 0;

  & legend {
    float: left;
    margin-right: 0.4rem;
    padding: 0;
    color: var(--color-muted);
    font-size: 0.62rem;
    font-weight: 600;
  }
`;

export const chips = css`
  label: CompareFilters-chips;
  display: flex;
  gap: 0.25rem;

  /* 고른 칩은 파란 글자·옅은 파란 바탕, 나머지는 흰 칩으로 둔다. */
  & button {
    padding: 0.3rem 0.55rem;
    border: 1px solid #e3e5e9;
    border-radius: 0.5rem;
    background: #fff;
    color: var(--color-muted);
    font: inherit;
    font-size: 0.62rem;
    cursor: pointer;
    transition:
      background-color 0.18s ease,
      border-color 0.18s ease,
      color 0.18s ease;
  }

  & button[aria-pressed='true'] {
    border-color: var(--color-brand-blue);
    background: color-mix(in srgb, var(--color-brand-blue) 10%, #fff);
    color: var(--color-brand-blue);
    font-weight: 600;
  }
`;

export const count = css`
  label: CompareFilters-count;
  color: var(--color-muted);
  font-size: 0.62rem;
`;
