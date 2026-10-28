import { css, cx } from '@emotion/css';

// 다른 요소의 선택자에서 `.CreatePropertyPage-page`로 가리킨다.
export const page = cx(
  css`
    label: CreatePropertyPage-page;
    min-height: 100%;
    background: var(--color-canvas, #fff);
  `,
  'CreatePropertyPage-page',
);

export const content = css`
  label: CreatePropertyPage-content;
  padding: 0 1.25rem calc(6rem + env(safe-area-inset-bottom));

  /* 패널로 열면 화면 맨 아래가 아닌 패널 스크롤 영역 아래에 버튼을 붙인다. */
  .CreatePropertyPage-page[data-panel='true'] & {
    padding-bottom: 1rem;
  }
`;

export const createNavigation = css`
  label: CreatePropertyPage-createNavigation;

  &[data-has-back='true'] h1 {
    font-size: 1.08rem;
  }
`;

export const formContainer = css`
  label: CreatePropertyPage-formContainer;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  margin-top: 0.6rem;

  & > [data-divider] {
    position: fixed;
    right: 0;
    bottom: var(--keyboard-inset, 0px);
    left: 0;
    z-index: 20;
    box-sizing: border-box;
    width: 100%;
    max-width: var(--app-max-width);
    margin: 0 auto;
    padding: 0.75rem 1.25rem calc(0.75rem + env(safe-area-inset-bottom));
    transition: bottom 0.18s ease-out;
  }

  .CreatePropertyPage-page[data-panel='true'] & > [data-divider] {
    position: sticky;
    bottom: 0;
    max-width: none;
    margin: 0 -1.25rem;
  }
`;

/* 다음 단계가 열릴 때 새 입력칸이 현재 입력칸 위에 쌓이도록 한다. */
/* 마지막으로 묻는 매물 이름을 맨 위에 둔다. 지도는 그 아래에 남는다. */
export const nameField = css`
  label: CreatePropertyPage-nameField;
  order: 0;
`;

export const rentField = css`
  label: CreatePropertyPage-rentField;
  order: 2;
`;

export const depositField = css`
  label: CreatePropertyPage-depositField;
  order: 3;
`;

export const errorNotice = css`
  label: CreatePropertyPage-errorNotice;
  margin: 0;
  color: var(--color-error, #e53e3e);
  font-size: 0.8rem;
  font-weight: 600;
`;

export const stepNotice = css`
  label: CreatePropertyPage-stepNotice;
  margin: 0;
  color: var(--color-muted, #868b94);
  font-size: 0.78rem;
  line-height: 1.55;
  order: 4;
  margin-top: 1rem;
`;
