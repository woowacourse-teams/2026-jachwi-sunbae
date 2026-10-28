import { css, cx } from '@emotion/css';

// 다른 요소의 선택자에서 `.ComparePropertyOption-option`로 가리킨다.
export const option = cx(
  css`
    label: ComparePropertyOption-option;
    display: grid;
    grid-template-columns: 1.1rem 3.8rem minmax(0, 1fr);
    align-items: center;
    gap: 0.7rem;
    min-height: 6.15rem;
    padding: 0.75rem 1rem;
    background: transparent;
    cursor: pointer;
    transition: background-color 0.18s ease;

    /* 이어진 리스트 안의 한 줄이므로 테두리 대신 옅은 바탕색으로만 선택을 보여 준다. */
    &[data-selected='true'] {
      background: color-mix(in srgb, var(--color-brand-blue) 10%, transparent);
    }

    &:has(input:focus-visible) {
      outline: 2px solid var(--color-focus);
      outline-offset: -2px;
    }

    &:has(input:disabled) {
      cursor: not-allowed;
      opacity: 0.58;
    }

    @media (max-width: 350px) {
      grid-template-columns: 1rem 3.2rem minmax(0, 1fr);
      gap: 0.55rem;
      padding-inline: 0.65rem;
    }
  `,
  'ComparePropertyOption-option',
);

export const checkmark = css`
  label: ComparePropertyOption-checkmark;
  display: grid;
  width: 1.1rem;
  height: 1.1rem;
  border: 1px solid var(--color-border-strong);
  border-radius: 50%;
  background: var(--color-surface);
  color: var(--color-on-primary);
  place-items: center;

  .ComparePropertyOption-option[data-selected='true'] & {
    border-color: var(--color-brand-blue);
    background: var(--color-brand-blue);
  }
`;

export const thumbnail = css`
  label: ComparePropertyOption-thumbnail;
  display: grid;
  width: 3.8rem;
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: var(--radius-sm);
  background: var(--color-surface-disabled);
  color: var(--color-muted);
  place-items: center;

  & img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  @media (max-width: 350px) {
    width: 3.2rem;
  }
`;

export const emptyThumbnailMascot = css`
  label: ComparePropertyOption-emptyThumbnailMascot;
  width: 100% !important;
  height: 100% !important;
  object-fit: cover !important;
`;

// 다른 요소의 선택자에서 `.ComparePropertyOption-propertyInfo`로 가리킨다.
export const propertyInfo = cx(
  css`
    label: ComparePropertyOption-propertyInfo;
    display: grid;
    min-width: 0;
    gap: 0.24rem;

    & > strong {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    & > strong {
      color: var(--color-ink);
      font-size: 0.8rem;
    }

    & > span {
      color: var(--color-muted);
      font-size: 0.58rem;
    }
  `,
  'ComparePropertyOption-propertyInfo',
);

export const stageOverview = css`
  label: ComparePropertyOption-stageOverview;

  .ComparePropertyOption-propertyInfo > span:not(&) {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  & {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    margin-top: 0.15rem;
  }

  & span {
    padding: 0.16rem 0.28rem;
    border-radius: 999px;
    background: var(--color-surface-muted);
    color: var(--color-muted);
    font-size: 0.52rem;
    font-weight: 750;
  }

  & span[data-applied='true'] {
    background: color-mix(in srgb, var(--color-primary) 12%, var(--color-surface));
    color: var(--color-primary-dark);
  }
`;
