import { css, keyframes } from '@emotion/css';

const swapInKeyframes = keyframes`
  from {
    opacity: 0;
    transform: translateY(0.4rem);
  }
`;

export const card = css`
  label: WeatherSummaryCard-card;
  padding: var(--my-card-padding, 1.15rem);
  border-radius: var(--radius-card);
  background: var(--my-card-surface, var(--color-card-surface));
  color: var(--color-ink);
`;

export const location = css`
  label: WeatherSummaryCard-location;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  color: var(--color-ink-soft);
  font-size: var(--my-subtext-size, 0.78rem);

  & > span {
    color: var(--color-ink-soft);
    font-size: var(--my-subtext-size, 0.78rem);
  }
`;

/* 켜짐(기온)·꺼짐(안내) 어느 쪽이든 같은 높이를 차지한다. */
export const weather = css`
  label: WeatherSummaryCard-weather;
  display: flex;
  align-items: center;
  gap: 0.7rem;
  min-height: 3.6rem;
  margin: 1rem 0;

  & b {
    font-size: var(--my-text-size, 0.95rem);
  }

  & p {
    margin: 0.3rem 0 0;
    color: var(--color-ink-soft);
    font-size: var(--my-subtext-size, 0.78rem);
  }
`;

export const stateIcon = css`
  label: WeatherSummaryCard-stateIcon;
  display: inline-flex;
  flex-shrink: 0;
  justify-content: center;
  width: 46px;
  color: var(--color-ink);
`;

export const temperature = css`
  label: WeatherSummaryCard-temperature;
  font-size: 2.4rem;
  font-weight: 750;
  letter-spacing: -0.08rem;
`;

export const range = css`
  label: WeatherSummaryCard-range;
  display: flex;
  margin: 0;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem;
  font-size: var(--my-subtext-size, 0.78rem);

  & > span {
    color: var(--color-ink-soft);
  }
`;

export const today = css`
  label: WeatherSummaryCard-today;
  margin-left: auto;
`;

export const divider = css`
  label: WeatherSummaryCard-divider;
  margin-top: 1rem;
  padding-top: 0.8rem;
  border-top: 1px solid var(--color-border);
`;

/* 알림을 켜고 끌 때 바뀐 내용이 살짝 올라오며 나타난다. 카드 높이는 그대로라 아래 내용은 움직이지 않는다. */
export const swap = css`
  label: WeatherSummaryCard-swap;
  animation: ${swapInKeyframes} 280ms ease-out;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;
