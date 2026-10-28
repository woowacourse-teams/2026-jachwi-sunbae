import { css, cx } from '@emotion/css';

// 다른 요소의 선택자에서 `.ActionCard-card`로 가리킨다.
export const card = cx(
  css`
    label: ActionCard-card;
    --action-card-surface: var(--color-card-surface);
    --action-card-ink: var(--color-ink);
    position: relative;
    display: block;
    overflow: hidden;
    border: 0;
    border-radius: var(--radius-card);
    padding: 0;
    background: var(--action-card-surface);
    color: var(--action-card-ink);
    font: inherit;
    text-align: left;
    text-decoration: none;
    cursor: pointer;
    transition: transform 150ms ease;

    &:focus-visible {
      outline: 2px solid var(--color-focus);
      outline-offset: 3px;
    }

    @media (hover: hover) {
      &:hover {
        transform: translateY(-2px);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      transition: none;
    }
  `,
  'ActionCard-card',
);

/* 톤: 바탕색과 글자색만 바꾼다. */
export const neutral = css`
  label: ActionCard-neutral;
  --action-card-surface: var(--color-card-surface);
  --action-card-ink: var(--color-ink);
`;

export const brand = css`
  label: ActionCard-brand;
  --action-card-surface: var(--color-card-brand-surface);
  --action-card-ink: var(--color-on-card-accent);
`;

export const informative = css`
  label: ActionCard-informative;
  --action-card-surface: var(--color-card-informative-surface);
  --action-card-ink: var(--color-on-card-accent);
`;

/* 글자 안쪽 여백은 화면이 넓어질 때 키울 수 있게 변수로 받는다. */
// 다른 요소의 선택자에서 `.ActionCard-text`로 가리킨다.
export const text = cx(
  css`
    label: ActionCard-text;
    position: absolute;
    top: var(--action-card-text-inset, 1.15rem);
    left: var(--action-card-text-inset, 1.15rem);
    z-index: 1;
    display: grid;
    gap: 0.35rem;
  `,
  'ActionCard-text',
);

// 다른 요소의 선택자에서 `.ActionCard-title`로 가리킨다.
export const title = cx(
  css`
    label: ActionCard-title;
    font-size: var(--action-card-title-size, 1rem);
    line-height: 1.25;
    letter-spacing: -0.04em;
  `,
  'ActionCard-title',
);

// 다른 요소의 선택자에서 `.ActionCard-description`로 가리킨다.
export const description = cx(
  css`
    label: ActionCard-description;
    font-size: var(--action-card-description-size, 0.66rem);
    opacity: 0.8;

    @media (max-width: 360px) {
      font-size: 0.6rem;
    }
  `,
  'ActionCard-description',
);

export const large = css`
  label: ActionCard-large;

  /* 크기: 대표 카드는 제목을 크게 하고 설명을 제목에 붙인다. */
  & .ActionCard-text {
    top: var(--action-card-large-text-inset, 1.1rem);
    left: var(--action-card-large-text-inset, 0.9rem);
    gap: 0.1rem;
  }

  & .ActionCard-title {
    font-size: var(--action-card-large-title-size, 1.55rem);
    line-height: 1.2;
    white-space: nowrap;
  }

  & .ActionCard-description {
    font-size: var(--action-card-large-description-size, 0.8rem);
    font-weight: 500;
    opacity: 0.95;
  }
`;

export const illustration = css`
  label: ActionCard-illustration;
  position: absolute;
  z-index: 0;
  height: auto;
  pointer-events: none;
  transition: transform 320ms cubic-bezier(0.34, 1.56, 0.64, 1);

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export const corner = css`
  label: ActionCard-corner;
  right: -0.6rem;
  bottom: -0.9rem;
  width: 7.4rem;

  @media (any-hover: hover) {
    .ActionCard-card:hover & {
      transform: translateY(-5%) rotate(-4deg);
    }
  }
`;

export const peek = css`
  label: ActionCard-peek;
  right: -1rem;
  bottom: -2.1rem;
  width: 4.2rem;
  transform-origin: 50% 100%;

  @media (any-hover: hover) {
    .ActionCard-card:hover & {
      transform: translateY(-6%) rotate(-5deg);
    }
  }
`;
