import { css, cx, keyframes } from '@emotion/css';

const routeSkeletonShimmerKeyframes = keyframes`
  to {
    background-position: -200% 0;
  }
`;

export const routeGuide = css`
  label: RouteGuide-routeGuide;
  padding-top: 0.35rem;

  & h2 {
    font-size: 1.1rem;
  }

  /* 이동 수단 색. 요약 막대와 구간 선이 같은 색을 쓴다. */
  & {
    --leg-bus: var(--color-brand-yellow);
    --leg-subway: var(--color-brand-blue, #6b9ae6);
    --leg-walk: #c3c8cf;
  }
`;

export const legs = css`
  label: RouteGuide-legs;
  list-style: none;
  margin: 1.25rem 0 0.5rem;
  padding: 0;

  & > li {
    --leg-color: var(--leg-walk);
    position: relative;
    display: grid;
    gap: 0.3rem;
    padding: 0 0 1.4rem 1.6rem;
  }

  & > li[data-type='BUS'] {
    --leg-color: var(--leg-bus);
  }

  & > li[data-type='SUBWAY'] {
    --leg-color: var(--leg-subway);
  }

  /* 구간 선. 걷기는 점선으로 그린다. */
  & > li::before {
    position: absolute;
    top: 1rem;
    bottom: 0;
    left: 0.33rem;
    width: 3px;
    border-radius: 999px;
    background: var(--leg-color);
    content: '';
  }

  & > li[data-type='WALK']::before {
    background: repeating-linear-gradient(to bottom, var(--leg-color) 0 4px, transparent 4px 8px);
  }

  & > li:last-child::before {
    bottom: 0.6rem;
  }

  /* 구간 시작점. */
  & > li::after {
    position: absolute;
    top: 0.2rem;
    left: 0;
    box-sizing: border-box;
    width: 0.75rem;
    height: 0.75rem;
    border: 3px solid var(--leg-color);
    border-radius: 50%;
    background: white;
    content: '';
  }

  & small {
    color: var(--color-muted);
    font-size: 0.75rem;
  }

  & strong {
    font-size: 0.95rem;
  }

  & span {
    color: var(--color-ink-soft);
    font-size: 0.85rem;
  }
`;

export const routeSegments = css`
  label: RouteGuide-routeSegments;
  display: flex;
  gap: 2px;
  overflow: hidden;
  border-radius: 999px;
  margin: 1rem 0 1.5rem;

  & span {
    padding: 0.45rem 0.6rem;
    font-size: 0.7rem;
    text-align: center;
    background: var(--color-surface-muted);
    white-space: nowrap;
  }

  & span[data-type='BUS'] {
    background: var(--leg-bus);
    color: var(--color-ink);
  }

  & span[data-type='SUBWAY'] {
    background: var(--leg-subway);
    color: white;
  }
`;

export const stops = css`
  label: RouteGuide-stops;

  & summary {
    width: fit-content;
    color: var(--color-ink-soft);
    font-size: 0.75rem;
    cursor: pointer;
  }

  & ul {
    margin: 0.4rem 0 0;
    padding-left: 1rem;
    color: var(--color-ink-soft);
  }

  & li {
    padding: 0.2rem 0;
    font-size: 0.75rem;
  }
`;

/* 경로를 불러오는 동안의 스켈레톤. 기록 리스트 스켈레톤과 같은 색과 움직임을 쓴다. */
export const routeSkeleton = css`
  label: RouteGuide-routeSkeleton;
  display: grid;
  gap: 1rem;
  padding-top: 0.35rem;
`;

// 다른 요소의 선택자에서 `.RouteGuide-skeleton`로 가리킨다.
export const skeleton = cx(
  css`
    label: RouteGuide-skeleton;
    display: block;
    height: 0.8rem;
    border-radius: 0.4rem;
    background: linear-gradient(90deg, #eff1f5 25%, #e3e6eb 50%, #eff1f5 75%);
    background-size: 200% 100%;
    animation: ${routeSkeletonShimmerKeyframes} 1.2s ease-in-out infinite;

    @media (prefers-reduced-motion: reduce) {
      animation: none;
    }
  `,
  'RouteGuide-skeleton',
);

export const skeletonTitle = css`
  label: RouteGuide-skeletonTitle;
  width: 45%;
  height: 1.2rem;
`;

export const skeletonBar = css`
  label: RouteGuide-skeletonBar;
  height: 1.9rem;
  border-radius: 999px;
`;

export const skeletonLegs = css`
  label: RouteGuide-skeletonLegs;
  display: grid;
  gap: 1.4rem;
  margin: 0.5rem 0 0;
  padding: 0 0 0 1.6rem;
  list-style: none;

  & li {
    display: grid;
    gap: 0.45rem;
  }

  & li .RouteGuide-skeleton:nth-child(1) {
    width: 35%;
    height: 0.7rem;
  }

  & li .RouteGuide-skeleton:nth-child(2) {
    width: 55%;
    height: 0.95rem;
  }

  & li .RouteGuide-skeleton:nth-child(3) {
    width: 75%;
  }
`;
