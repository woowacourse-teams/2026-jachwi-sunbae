import { css, cx, keyframes } from '@emotion/css';

const blinkKeyframes = keyframes`
  50% {
    opacity: 0;
  }
`;

const clickKeyframes = keyframes`
  80%,
  100% {
    transform: scale(1);
  }
  90% {
    transform: scale(0.8);
  }
`;

export const demo = css`
  label: UsageDemo-demo;

  & h2 {
    margin: 0 0 1rem;
    font-size: 0.95rem;
    letter-spacing: -0.02em;
  }
`;

export const step = css`
  label: UsageDemo-step;
  display: grid;
  gap: 0.75rem;
  margin-bottom: 2.25rem;
  opacity: 0.35;
  transform: translateY(16px);
  transition:
    opacity 400ms ease-out,
    transform 400ms ease-out;

  &[data-revealed='true'] {
    opacity: 1;
    transform: none;
  }

  /* 넓은 화면은 설명을 왼쪽, 예시 화면을 오른쪽에 두고 단계마다 좌우를 번갈아 배치하지 않는다. */
  @media (min-width: 48rem) {
    grid-template-columns: minmax(0, 15rem) minmax(0, 1fr);
    align-items: center;
    gap: 2rem;
    margin-bottom: 3rem;
  }

  @media (prefers-reduced-motion: reduce) {
    opacity: 1;
    transform: none;
    transition: none;
  }
`;

export const stepLabel = css`
  label: UsageDemo-stepLabel;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  font-size: 0.95rem;

  & span {
    display: grid;
    place-items: center;
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 50%;
    background: #333;
    color: white;
    font-size: 0.7rem;
    font-weight: 700;
  }
`;

// 다른 요소의 선택자에서 `.UsageDemo-screen`로 가리킨다.
export const screen = cx(
  css`
    label: UsageDemo-screen;
    position: relative;
    overflow: hidden;
    border: 1px solid #e5e5e5;
    border-radius: 1rem;
    background: white;
    box-shadow: 0 8px 24px #0000000c;
  `,
  'UsageDemo-screen',
);

export const toolbar = css`
  label: UsageDemo-toolbar;
  display: flex;
  gap: 0.4rem;
  align-items: center;
  padding: 0.7rem 1rem;
  border-bottom: 1px solid #eee;
  font-size: 0.7rem;

  & img {
    border-radius: 0.3rem;
  }

  & small {
    margin-left: auto;
    color: #888;
    font-size: 0.6rem;
  }
`;

export const content = css`
  label: UsageDemo-content;
  height: 19rem;
  padding: 1.1rem;

  & h3 {
    font-size: 1rem;
    margin: 0 0 1rem;
  }
`;

export const field = css`
  label: UsageDemo-field;
  padding: 0.7rem;
  border: 1px solid #ddd;
  border-radius: 0.6rem;
  margin-bottom: 0.8rem;

  & span {
    display: block;
    color: #888;
    font-size: 0.65rem;
    margin-bottom: 0.4rem;
  }

  & strong {
    font-size: 0.85rem;
  }

  & i {
    display: inline-block;
    height: 0.8rem;
    border-right: 1px solid #333;
    margin-left: 2px;
    animation: ${blinkKeyframes} 0.8s infinite;
  }

  @media (prefers-reduced-motion: reduce) {
    & i {
      animation: none;
      transition: none;
    }
  }
`;

export const prices = css`
  label: UsageDemo-prices;
  display: flex;
  gap: 0.7rem;

  & > div {
    flex: 1;
  }
`;

export const save = css`
  label: UsageDemo-save;
  margin-top: 0.7rem;
  padding: 0.8rem;
  background: #333;
  color: white;
  border-radius: 0.6rem;
  text-align: center;
  font-size: 0.8rem;

  &[data-active='true'] {
    background: #ffc329;
    color: #111;
  }
`;

export const photo = css`
  label: UsageDemo-photo;
  display: flex;
  align-items: center;
  gap: 1rem;
  background: #f6f6f6;
  border-radius: 0.6rem;
  padding: 0.7rem;
  font-size: 0.75rem;

  & img {
    width: 4.7rem;
    height: 5.5rem;
    object-fit: cover;
    border-radius: 0.5rem;
  }
`;

export const details = css`
  label: UsageDemo-details;
  font-size: 0.75rem;

  & div {
    display: flex;
    justify-content: space-between;
    padding: 0.5rem 0;
  }

  & dt {
    color: #888;
  }

  & dd {
    margin: 0;
  }
`;

export const success = css`
  label: UsageDemo-success;
  font-size: 0.75rem;
  color: #333;
  margin-top: 1rem;
`;

export const subtitle = css`
  label: UsageDemo-subtitle;
  font-size: 0.75rem;
  color: #888;
  margin-top: -0.5rem;
`;

export const check = css`
  label: UsageDemo-check;
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.8rem 0.5rem;
  border-bottom: 1px solid #eee;
  font-size: 0.8rem;

  & span {
    width: 1.4rem;
    height: 1.4rem;
    display: grid;
    place-items: center;
    border-radius: 0.35rem;
    background: #f5f5f5;
  }

  &[data-checked='true'] span {
    background: #333;
    color: #fff;
  }
`;

export const mapSearch = css`
  label: UsageDemo-mapSearch;
  border: 1px solid #e5e5e5;
  border-radius: 2rem;
  padding: 0.6rem 0.75rem;
  font-size: 0.7rem;
  color: #666;
`;

export const mapFilters = css`
  label: UsageDemo-mapFilters;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin: 0.55rem 0;

  & button {
    border: 1px solid #ddd;
    background: white;
    border-radius: 2rem;
    padding: 0.4rem 0.55rem;
    font-size: 0.65rem;
    cursor: pointer;
  }

  & button[aria-pressed='true'] {
    background: #333;
    color: white;
    border-color: #333;
  }

  & small {
    font-size: 0.6rem;
    color: #888;
  }
`;

// 다른 요소의 선택자에서 `.UsageDemo-mapPreview`로 가리킨다.
export const mapPreview = cx(
  css`
    label: UsageDemo-mapPreview;
    position: relative;
    height: 9rem;
    border-radius: 0.7rem;
    background: #eef1e9;
    overflow: hidden;

    & svg {
      width: 100%;
      height: 100%;
    }
  `,
  'UsageDemo-mapPreview',
);

export const river = css`
  label: UsageDemo-river;
  stroke: #beddea;
  stroke-width: 12;
  fill: none;
`;

export const roads = css`
  label: UsageDemo-roads;
  stroke: white;
  stroke-width: 5;
  fill: none;
`;

export const areas = css`
  label: UsageDemo-areas;
  opacity: 0;
  transition: opacity 300ms ease-out;

  & path {
    fill-opacity: 0.3;
    stroke: white;
    stroke-width: 1;
  }

  .UsageDemo-mapPreview[data-ready='true'] & {
    opacity: 1;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export const destination = css`
  label: UsageDemo-destination;
  position: absolute;
  left: 43%;
  top: 40%;
  font-size: 0.65rem;
  padding: 0.3rem;
  background: white;
  border-radius: 0.4rem;
`;

export const mapLabels = css`
  label: UsageDemo-mapLabels;
  position: absolute;
  inset: 0.65rem;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 0.25rem;
  opacity: 0;
  transition: opacity 300ms ease-out;

  .UsageDemo-mapPreview[data-ready='true'] & {
    opacity: 1;
  }

  & span {
    display: grid;
    gap: 0.2rem;
    background: white;
    border-radius: 0.4rem;
    padding: 0.35rem 0.45rem;
    font-size: 0.6rem;
    box-shadow: 0 2px 6px #0001;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export const cursor = css`
  label: UsageDemo-cursor;
  position: absolute;
  left: 65%;
  top: 40%;
  font-size: 1.8rem;
  color: #111;
  text-shadow:
    1px 1px white,
    -1px -1px white;
  pointer-events: none;
  transition:
    left 0.6s,
    top 0.6s;
  animation: ${clickKeyframes} 3.5s infinite;

  .UsageDemo-screen[data-stage='1'] & {
    left: 65%;
    top: 40%;
  }

  .UsageDemo-screen[data-stage='2'] & {
    left: 70%;
    top: 70%;
  }

  .UsageDemo-screen[data-stage='3'] & {
    left: 10%;
    top: 55%;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    transition: none;
  }
`;

export const caption = css`
  label: UsageDemo-caption;
  margin: 0.4rem 0 0 2rem;
  color: var(--color-ink-soft);
  font-size: 0.8rem;
  line-height: 1.5;
`;

export const stepAction = css`
  label: UsageDemo-stepAction;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  margin: 0.5rem 0 0 2rem;
  color: var(--color-ink);
  font-size: 0.78rem;
  font-weight: 700;
  text-decoration: none;

  &:focus-visible {
    outline: 2px solid var(--color-focus);
    outline-offset: 3px;
    border-radius: 0.25rem;
  }

  @media (hover: hover) {
    &:hover {
      text-decoration: underline;
      text-underline-offset: 3px;
    }
  }
`;
