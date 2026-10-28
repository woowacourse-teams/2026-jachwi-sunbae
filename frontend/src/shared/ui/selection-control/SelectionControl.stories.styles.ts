import { css, cx } from '@emotion/css';

// 다른 요소의 선택자에서 `.SelectionControl.stories-option`로 가리킨다.
export const option = cx(
  css`
    label: SelectionControl.stories-option;
    display: inline-flex;
    align-items: center;
    gap: 0.55rem;
    min-width: 15rem;
    padding: 0.75rem 0.9rem;
    border: 1px solid var(--color-border-strong, #d9dce1);
    border-radius: 0.65rem;
    background: var(--color-surface, #fff);
    color: var(--color-ink, #212124);

    &[data-selected='true'] {
      border-color: var(--color-primary, #6c873b);
      background: var(--color-surface-brand, #f2f2f2);
    }

    &:has(input:focus-visible) {
      outline: 2px solid var(--color-focus, #9bbd55);
      outline-offset: 2px;
    }

    &:has(input:disabled) {
      opacity: 0.5;
    }
  `,
  'SelectionControl.stories-option',
);

export const mark = css`
  label: SelectionControl.stories-mark;
  display: grid;
  width: 1.1rem;
  height: 1.1rem;
  flex: none;
  place-items: center;
  border: 1px solid var(--color-border-strong, #d9dce1);
  border-radius: 0.3rem;
  color: var(--color-surface, #fff);
  font-size: 0.75rem;
  line-height: 1;

  .SelectionControl.stories-option[data-selected='true'] & {
    border-color: var(--color-primary, #6c873b);
    background: var(--color-primary, #6c873b);
  }
`;
