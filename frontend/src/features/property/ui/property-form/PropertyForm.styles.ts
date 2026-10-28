import { css, cx } from '@emotion/css';

// 다른 요소의 선택자에서 `.PropertyForm-form`로 가리킨다.
export const form = cx(
  css`
    label: PropertyForm-form;
    display: flex;
    min-height: calc(100dvh - var(--bottom-navigation-height) - var(--app-bar-height) - 4.5rem);
    flex-direction: column;
    gap: 0.8rem;
    padding-bottom: 1rem;

    & > :last-child {
      margin-top: auto;
    }
  `,
  'PropertyForm-form',
);

export const defaultField = css`
  label: PropertyForm-defaultField;
  gap: 0.3rem;

  & > label {
    font-size: 0.78rem;
  }
`;

export const defaultInput = css`
  label: PropertyForm-defaultInput;

  .PropertyForm-form & {
    min-height: 2.55rem;
    padding: 0.55rem 0.7rem;
    font-size: 0.78rem;
  }

  .PropertyForm-form textarea& {
    min-height: 4.75rem;
  }
`;

export const moneyFields = css`
  label: PropertyForm-moneyFields;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.65rem;
`;

// 다른 요소의 선택자에서 `.PropertyForm-locationFields`로 가리킨다.
export const locationFields = cx(
  css`
    label: PropertyForm-locationFields;
    display: grid;
    gap: 0.65rem;
  `,
  'PropertyForm-locationFields',
);

export const locationCoordinates = css`
  label: PropertyForm-locationCoordinates;
  margin: 0;
  color: var(--color-muted);
  font-size: 0.72rem;
  text-align: center;
`;

// 다른 요소의 선택자에서 `.PropertyForm-detailForm`로 가리킨다.
export const detailForm = cx(
  css`
    label: PropertyForm-detailForm;

    & .PropertyForm-locationFields {
      margin: 0.75rem 0;
    }

    & {
      gap: 0;
    }
  `,
  'PropertyForm-detailForm',
);

export const detailMoneyFields = css`
  label: PropertyForm-detailMoneyFields;
  display: contents;
`;

export const detailField = css`
  label: PropertyForm-detailField;
  grid-template-columns: 5.25rem minmax(0, 1fr);
  align-items: start;
  gap: 0.25rem 0.75rem;
  padding: 0.65rem 0;

  & > label {
    padding-top: 0.75rem;
    color: var(--color-muted);
    font-size: 0.78rem;
  }

  & > div {
    min-width: 0;
  }

  & > p {
    grid-column: 2;
  }

  @media (max-width: 340px) {
    grid-template-columns: 1fr;
  }

  @media (max-width: 340px) {
    & > label {
      padding-top: 0;
    }
  }

  @media (max-width: 340px) {
    & > p {
      grid-column: 1;
    }
  }
`;

export const detailInput = css`
  label: PropertyForm-detailInput;

  .PropertyForm-detailForm & {
    min-height: 2.15rem;
    padding: 0.35rem 0.55rem;
    border-color: transparent;
    background: var(--color-surface);
    font-size: 0.76rem;
    font-weight: 650;
  }

  .PropertyForm-detailForm textarea& {
    min-height: 5.5rem;
    font-size: 0.82rem;
    font-weight: 650;
  }

  .PropertyForm-detailForm &:hover {
    background: var(--color-surface-neutral);
  }

  .PropertyForm-detailForm &:focus,
  .PropertyForm-detailForm &:focus-visible {
    border: 1px solid var(--color-primary);
    border-color: var(--color-primary);
    background: var(--color-surface);
    outline: 0 !important;
    box-shadow: none;
  }
`;
