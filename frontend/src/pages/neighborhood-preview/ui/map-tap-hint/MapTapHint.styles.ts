import { css, keyframes } from '@emotion/css';

const rippleKeyframes = keyframes`
  from {
    opacity: 0.9;
    transform: scale(0.5);
  }
  to {
    opacity: 0;
    transform: scale(1.3);
  }
`;

const pressKeyframes = keyframes`
  0%,
  100% {
    transform: scale(1);
  }
  20% {
    transform: scale(0.7);
  }
  40% {
    transform: scale(1);
  }
`;

export const hint = css`
  label: MapTapHint-hint;
  position: absolute;
  right: 1rem;
  bottom: calc(var(--map-sheet-bottom, env(safe-area-inset-bottom)) + 1rem);
  left: 1rem;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 0.85rem;
  max-width: 27rem;
  margin: 0 auto;
  padding: 0.85rem 1rem;
  border-radius: 0.9rem;
  background: rgb(37 40 45 / 92%);
  color: white;
  box-shadow: 0 4px 16px rgb(0 0 0 / 18%);
  pointer-events: none;

  & p {
    display: grid;
    gap: 0.2rem;
    margin: 0;
  }

  & strong {
    font-size: 0.9rem;
  }

  & small {
    color: rgb(255 255 255 / 75%);
    font-size: 0.72rem;
  }
`;

export const tap = css`
  label: MapTapHint-tap;
  position: relative;
  flex: none;
  width: 2.5rem;
  height: 2.5rem;

  &::before,
  & i {
    position: absolute;
    inset: 0;
    border-radius: 50%;
  }

  /* 바깥 고리는 퍼져 나가고, 가운데 점은 눌리듯 작아졌다 돌아온다. */
  &::before {
    content: '';
    border: 2px solid var(--color-brand-yellow);
    animation: ${rippleKeyframes} 1.6s ease-out infinite;
  }

  & i {
    inset: 0.75rem;
    background: var(--color-brand-yellow);
    animation: ${pressKeyframes} 1.6s ease-in-out infinite;
  }

  @media (prefers-reduced-motion: reduce) {
    &::before,
    & i {
      animation: none;
    }
  }
`;
