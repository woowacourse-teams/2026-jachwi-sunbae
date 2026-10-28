import { css, keyframes } from '@emotion/css';

const spinKeyframes = keyframes`
  to {
    transform: rotate(360deg);
  }
`;

export const loading = css`
  label: CompareLoadState-loading;
  display: grid;
  gap: 0.75rem;
  min-height: 10rem;
  align-content: center;
  justify-items: center;
  color: var(--color-muted);
  font-size: 0.75rem;
`;

export const errorState = css`
  label: CompareLoadState-errorState;
  display: grid;
  gap: 0.75rem;
`;

export const spinner = css`
  label: CompareLoadState-spinner;
  width: 1.35rem;
  height: 1.35rem;
  border: 3px solid color-mix(in srgb, var(--color-primary) 22%, transparent);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: ${spinKeyframes} 800ms linear infinite;
`;
