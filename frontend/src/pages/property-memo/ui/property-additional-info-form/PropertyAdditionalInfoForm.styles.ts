import { css } from '@emotion/css';

export const form = css`
  label: PropertyAdditionalInfoForm-form;
  display: grid;
  gap: 1.4rem;
  padding-bottom: 1rem;

  /* 시트에서는 필터 시트처럼 입력을 위에, 저장 버튼을 시트 맨 아래에 둔다. */
  &[data-layout='sheet'] {
    display: flex;
    min-height: 100%;
    flex-direction: column;
    padding-bottom: 0;
  }

  &[data-layout='sheet'] > * {
    flex-shrink: 0;
  }

  &[data-layout='sheet'] > button:last-child {
    margin-top: auto;
  }
`;

export const fields = css`
  label: PropertyAdditionalInfoForm-fields;
  display: grid;
  gap: 1.4rem;

  & h1 {
    margin: 0;
    font-size: 1rem;
    font-weight: 750;
    letter-spacing: -0.03em;
  }
`;
