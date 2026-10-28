import { css, cx, keyframes } from '@emotion/css';

const spinKeyframes = keyframes`
  to {
    transform: rotate(360deg);
  }
`;

export const button = css`
  label: Button-button;
  display: inline-flex;
  min-height: 2.65rem;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.62rem 0.9rem;
  border: 1px solid transparent;
  border-radius: 0.75rem;
  font-size: 0.8rem;
  font-weight: 700;
  line-height: 1.2;
  text-align: center;
  text-decoration: none;
  cursor: pointer;
  transition:
    background-color 0.18s ease,
    border-color 0.18s ease,
    color 0.18s ease;

  /* 아이콘·이모티콘과 한글이 각자의 글꼴 baseline에 끌려가지 않게 한 줄의 가운데를 공유한다. */
  & > span {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  & > span svg {
    display: block;
    flex: none;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.52;
  }
`;

/* 한 화면의 주 행동처럼 크게 두는 버튼. 높이 52px, 글자 18px. */
export const large = css`
  label: Button-large;
  min-height: 3.25rem;
  padding: 0.875rem 1.25rem;
  font-size: 1.125rem;
  line-height: 1.5rem;
`;

export const primary = css`
  label: Button-primary;
  background: var(--color-brand-blue);
  color: var(--color-on-card-accent);

  &:hover:not(:disabled) {
    background: color-mix(in srgb, var(--color-brand-blue) 88%, black);
  }
`;

export const soft = css`
  label: Button-soft;
  background: var(--color-action);
  color: var(--color-on-action);
  font-weight: 750;

  &:hover:not(:disabled) {
    background: var(--color-action-hover);
  }
`;

// 다른 요소의 선택자에서 `.Button-secondary`로 가리킨다.
export const secondary = cx(
  css`
    label: Button-secondary;
    border-color: var(--color-border-strong);
    background: var(--color-surface);
    color: var(--color-ink);

    &:hover:not(:disabled) {
      background: var(--color-surface-muted);
    }
  `,
  'Button-secondary',
);

// 다른 요소의 선택자에서 `.Button-neutral`로 가리킨다.
export const neutral = cx(
  css`
    label: Button-neutral;
    border-color: transparent;
    background: var(--color-surface-neutral);
    color: var(--color-ink-soft);

    &:hover:not(:disabled) {
      background: var(--color-surface-disabled);
    }
  `,
  'Button-neutral',
);

export const danger = css`
  label: Button-danger;
  background: var(--color-error);
  color: var(--color-on-primary);

  &:hover:not(:disabled) {
    background: color-mix(in srgb, var(--color-error) 84%, var(--color-ink));
  }
`;

// 다른 요소의 선택자에서 `.Button-text`로 가리킨다.
export const text = cx(
  css`
    label: Button-text;
    min-height: 2.75rem;
    padding-right: 0.6rem;
    padding-left: 0.6rem;
    background: transparent;
    color: var(--color-primary-dark);
  `,
  'Button-text',
);

export const fullWidth = css`
  label: Button-fullWidth;
  width: 100%;
`;

export const spinner = css`
  label: Button-spinner;
  width: 1rem;
  height: 1rem;
  border: 2px solid color-mix(in srgb, var(--color-on-primary) 36%, transparent);
  border-top-color: currentColor;
  border-radius: 50%;
  animation: ${spinKeyframes} 700ms linear infinite;

  .Button-secondary &,
  .Button-neutral &,
  .Button-text & {
    border-color: color-mix(in srgb, var(--color-primary) 22%, transparent);
    border-top-color: currentColor;
  }
`;
