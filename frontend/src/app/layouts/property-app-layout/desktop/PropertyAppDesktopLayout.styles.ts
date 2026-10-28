import { css } from '@emotion/css';

/*
 * 데스크탑은 화면 전체 폭에 공용 헤더를 두고, 지도가 아닌 화면의 내용만 48rem 가운데 열에 둔다.
 * 기준 글자 크기(rem)는 125%로 올린다. 공용 데스크탑 헤더는 글자 크기를 px로 고정해 이 배율의 영향을 받지 않는다.
 */
export const root = css`
  label: PropertyAppDesktopLayout-root;

  &[data-design-shell='true'] {
    width: 100%;
    background: var(--color-canvas);
  }

  html:has(&[data-design-shell='true']:not([data-map-page='true'])) {
    font-size: 125%;
  }
`;

/* 홈과 같은 폭을 쓰는 화면(마이)은 폭을 스스로 정한다. */
export const content = css`
  label: PropertyAppDesktopLayout-content;

  .PropertyAppLayout-root[data-design-shell='true']:not([data-map-page='true']):not([data-home-width-page='true'])
    &
    > * {
    width: min(100%, 48rem);
    margin-right: auto;
    margin-left: auto;
  }
`;
