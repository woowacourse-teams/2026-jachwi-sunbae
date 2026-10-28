import { css, cx } from '@emotion/css';

// 다른 요소의 선택자에서 `.SelectionControl-control`로 가리킨다.
export const control = cx(
  css`
    label: SelectionControl-control;
    position: relative;
    cursor: pointer;
  `,
  'SelectionControl-control',
);

export const input = css`
  label: SelectionControl-input;

  .SelectionControl-control:has(&:disabled) {
    cursor: not-allowed;
  }

  /* 표시는 옆의 요소가 대신 그리고, input 자체는 초점만 받도록 숨긴다. */
  & {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    opacity: 0;
  }
`;
