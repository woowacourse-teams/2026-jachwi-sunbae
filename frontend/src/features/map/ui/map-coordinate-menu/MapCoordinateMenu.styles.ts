import { css } from '@emotion/css';

/* 찍은 좌표를 꼬리 끝으로 가리키는 동작 말풍선. 좌표 기준 가운데 위에 놓인다. */
export const menu = css`
  label: MapCoordinateMenu-menu;
  position: relative;
  display: grid;
  gap: 0.25rem;
  min-width: 11rem;
  margin-bottom: 0.7rem;
  padding: 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
  background: var(--color-surface);
  color: var(--color-ink);
  box-shadow: 0 0.4rem 1.2rem rgb(0 0 0 / 16%);
  z-index: 40;

  &::after {
    position: absolute;
    bottom: -0.45rem;
    left: 50%;
    width: 0.8rem;
    height: 0.8rem;
    border-right: 1px solid var(--color-border);
    border-bottom: 1px solid var(--color-border);
    background: var(--color-surface);
    content: '';
    transform: translateX(-50%) rotate(45deg);
  }
`;

export const header = css`
  label: MapCoordinateMenu-header;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.15rem 0.25rem 0.25rem 0.5rem;
  color: var(--color-muted);
  font-size: 0.75rem;
`;

export const close = css`
  label: MapCoordinateMenu-close;
  display: grid;
  width: 1.5rem;
  height: 1.5rem;
  place-items: center;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--color-ink-soft);
  font-size: 1rem;
  line-height: 1;
  cursor: pointer;

  &:hover {
    background: var(--color-surface-muted);
  }
`;

export const action = css`
  label: MapCoordinateMenu-action;
  padding: 0.6rem 0.7rem;
  border: 0;
  border-radius: 0.5rem;
  background: transparent;
  color: inherit;
  font-size: 0.875rem;
  font-weight: 650;
  text-align: left;
  white-space: nowrap;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    background: var(--color-surface-muted);
  }
`;
