import { css } from '@emotion/css';

export const summary = css`
  label: ChecklistProgressRing-summary;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-top: 0.9rem;
`;

export const ring = css`
  label: ChecklistProgressRing-ring;
  flex: 0 0 auto;
  /* 12시 방향에서 시작하도록 돌린다. */
  transform: rotate(-90deg);

  & circle {
    fill: none;
    stroke: var(--color-check-unconfirmed);
  }

  & circle[data-status='GOOD'] {
    stroke: var(--color-check-good);
  }

  & circle[data-status='CAUTION'] {
    stroke: var(--color-check-caution);
  }
`;

export const legend = css`
  label: ChecklistProgressRing-legend;
  display: grid;
  gap: 0.45rem;
  margin: 0;
  padding: 0;
  list-style: none;

  & li {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--color-ink-soft);
    font-size: 0.78rem;
    font-weight: 650;
  }

  /* 고리와 같은 색의 짧은 막대로 어느 조각인지 잇는다. 글자는 색 없이 둔다. */
  & li::before {
    width: 3px;
    height: 0.85rem;
    flex: 0 0 auto;
    border-radius: 2px;
    background: var(--color-check-unconfirmed);
    content: '';
  }

  & li[data-status='GOOD']::before {
    background: var(--color-check-good);
  }

  & li[data-status='CAUTION']::before {
    background: var(--color-check-caution);
  }

  & li[data-empty='true']::before {
    opacity: 0.45;
  }

  /* 라벨 길이가 달라도 개수가 한 줄로 서도록 라벨 칸 너비를 맞춘다. */
  & span {
    min-width: 2.75rem;
  }

  & strong {
    color: var(--color-ink);
    font-size: 0.86rem;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
  }

  & li[data-empty='true'] strong {
    color: var(--color-muted);
  }
`;
