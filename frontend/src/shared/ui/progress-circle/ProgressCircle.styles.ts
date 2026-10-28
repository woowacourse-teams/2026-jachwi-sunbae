import { css, keyframes } from '@emotion/css';

const rotateKeyframes = keyframes`
  to {
    transform: rotate(360deg);
  }
`;

const lengthKeyframes = keyframes`
  0%,
  100% {
    stroke-dasharray: 12 110;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 75 110;
    stroke-dashoffset: -20;
  }
`;

export const progress = css`
  label: ProgressCircle-progress;
  display: inline-flex;
  flex: none;

  & svg {
    width: 100%;
    height: 100%;
    animation: ${rotateKeyframes} 1.2s cubic-bezier(0.35, 0.25, 0.65, 0.75) infinite;
  }

  @media (prefers-reduced-motion: reduce) {
    & svg {
      animation: none;
    }
  }
`;

export const track = css`
  label: ProgressCircle-track;
  fill: none;
  stroke-width: 5;
  stroke: var(--color-border, #e5e5e5);
`;

export const indicator = css`
  label: ProgressCircle-indicator;
  fill: none;
  stroke-width: 5;
  stroke: var(--color-muted, #909090);
  stroke-linecap: round;
  stroke-dasharray: 30 110;
  animation: ${lengthKeyframes} 1.2s cubic-bezier(0.35, 0, 0.65, 1) infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;
