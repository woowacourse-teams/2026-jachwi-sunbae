import { css, cx, keyframes } from '@emotion/css';

const spinKeyframes = keyframes`
  to {
    transform: rotate(360deg);
  }
`;

export const page = css`
  label: StatusPanel-page;
  display: grid;
  min-height: 100svh;
  padding: 1.25rem;
  place-items: center;
`;

export const panel = css`
  label: StatusPanel-panel;
  width: min(100%, 430px);
  padding: clamp(1.5rem, 7vw, 2.25rem);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface-translucent);
  text-align: center;

  & h1 {
    margin: 0;
    font-size: 1.45rem;
    letter-spacing: -0.04em;
  }

  & p {
    margin: 0.75rem 0 0;
    color: var(--color-ink-soft);
    line-height: 1.6;
  }
`;

// 다른 요소의 선택자에서 `.StatusPanel-mark`로 가리킨다.
export const mark = cx(
  css`
    label: StatusPanel-mark;
    display: grid;
    width: 3.25rem;
    height: 3.25rem;
    margin: 0 auto 1rem;
    border-radius: 50%;
    place-items: center;
    background: var(--color-surface-muted);
    color: var(--color-primary-dark);
    font-size: 1.4rem;
    font-weight: 800;
  `,
  'StatusPanel-mark',
);

export const success = css`
  label: StatusPanel-success;

  & .StatusPanel-mark {
    background: var(--color-success-surface);
    color: var(--color-success);
  }
`;

export const errorIllustrationViewport = css`
  label: StatusPanel-errorIllustrationViewport;
  position: relative;
  width: 8.5rem;
  aspect-ratio: 1.1;
  margin: 0 auto 1rem;
  overflow: hidden;
`;

export const errorIllustration = css`
  label: StatusPanel-errorIllustration;
  position: absolute;
  top: 50%;
  left: 50%;
  display: block;
  width: 220%;
  max-width: none;
  height: auto;
  transform: translate(-50%, -50%);
`;

export const action = css`
  label: StatusPanel-action;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1.4rem;
`;

export const spinner = css`
  label: StatusPanel-spinner;
  width: 1.4rem;
  height: 1.4rem;
  border: 3px solid color-mix(in srgb, var(--color-primary) 24%, transparent);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: ${spinKeyframes} 800ms linear infinite;
`;
