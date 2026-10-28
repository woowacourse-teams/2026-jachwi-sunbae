import { css, cx } from '@emotion/css';

export const picker = css`
  label: PropertyOptionPicker-picker;
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
`;

export const legend = css`
  label: PropertyOptionPicker-legend;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0;
  color: var(--color-ink, #212124);
  font-size: 0.82rem;
  font-weight: 800;
`;

export const count = css`
  label: PropertyOptionPicker-count;
  color: var(--color-muted, #868b94);
  font-size: 0.78rem;
  font-weight: 700;
`;

export const pickerContent = css`
  label: PropertyOptionPicker-pickerContent;
  margin-top: 0.55rem;
`;

export const grid = css`
  label: PropertyOptionPicker-grid;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.5rem;
  margin-top: 0.55rem;
`;

export const badges = css`
  label: PropertyOptionPicker-badges;
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.55rem;
`;

// 다른 요소의 선택자에서 `.PropertyOptionPicker-badge`로 가리킨다.
export const badge = cx(
  css`
    label: PropertyOptionPicker-badge;
    padding: 0.4rem 0.8rem;
    border: 1px solid var(--color-border, #eaebed);
    border-radius: 999px;
    background: var(--color-surface, #fff);
    color: var(--color-muted, #868b94);
    transition:
      border-color 0.15s ease,
      background 0.15s ease,
      color 0.15s ease;

    &[data-selected='true'] {
      border-color: var(--color-primary, #6c873b);
      background: var(--color-surface-brand, #f2f2f2);
      color: var(--color-ink, #212124);
    }
  `,
  'PropertyOptionPicker-badge',
);

// 다른 요소의 선택자에서 `.PropertyOptionPicker-input`로 가리킨다.
export const input = cx(
  css`
    label: PropertyOptionPicker-input;

    .PropertyOptionPicker-badge:has(&:focus-visible) {
      outline: 2px solid var(--color-focus);
      outline-offset: 2px;
    }
  `,
  'PropertyOptionPicker-input',
);

export const option = css`
  label: PropertyOptionPicker-option;
  display: grid;
  gap: 0.3rem;
  padding: 0.6rem 0.25rem 0.5rem;
  border: 1px solid var(--color-border, #eaebed);
  border-radius: var(--radius-sm, 0.65rem);
  background: var(--color-surface, #fff);
  color: var(--color-muted, #868b94);
  justify-items: center;
  transition:
    border-color 0.15s ease,
    background 0.15s ease,
    color 0.15s ease;

  &[data-selected='true'] {
    border-color: var(--color-primary, #6c873b);
    background: var(--color-surface-brand, #f2f2f2);
    color: var(--color-ink, #212124);
  }

  &:has(.PropertyOptionPicker-input:focus-visible) {
    outline: 2px solid var(--color-focus);
    outline-offset: 2px;
  }
`;

export const optionLabel = css`
  label: PropertyOptionPicker-optionLabel;
  font-size: 0.74rem;
  font-weight: 750;
  line-height: 1.2;
  text-align: center;
`;
