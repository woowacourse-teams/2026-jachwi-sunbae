import { css } from '@emotion/css';

/* 모양은 내용을 그리는 쪽에 맡기고, 버튼·링크 기본 모양을 지운 뒤 상태 표시만 맞춘다. */
export const card = css`
  label: RailCard-card;
  display: block;
  min-width: 0;
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  text-align: left;
  text-decoration: none;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: transform 120ms ease;

  &:focus-visible {
    outline: 2px solid var(--color-focus);
    outline-offset: 2px;
  }

  &:active:not(:disabled) {
    transform: scale(0.98);
  }

  &[aria-pressed='true'] {
    border-color: var(--color-ink);
    box-shadow: inset 0 0 0 1px var(--color-ink);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;
