import { css } from '@emotion/css';

/* 빠른 메뉴는 한 줄 4칸 그리드에 바로가기 타일을 왼쪽부터 채운다. */
export const menu = css`
  label: QuickMenu-menu;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.65rem;
  margin-top: 1.25rem;

  /* 태블릿부터는 칸이 넓어져도 타일이 모바일 크기를 넘지 않게 칸 크기에 상한을 둔다. */
  @media (min-width: 768px) {
    grid-template-columns: repeat(4, minmax(0, 5.5rem));
  }
`;

/* 빈칸은 타일 크기만큼 자리만 차지하고 보이거나 반응하지 않는다. */
export const emptySlot = css`
  label: QuickMenu-emptySlot;
  aspect-ratio: 1;
`;
