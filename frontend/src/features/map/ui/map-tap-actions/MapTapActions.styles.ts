import { css } from '@emotion/css';

/* 휴대폰에서 찍은 위치의 동작. 시트 없이 지도 아래쪽에 버튼만 띄운다. */
export const actions = css`
  label: MapTapActions-actions;
  position: absolute;
  right: 1rem;
  bottom: calc(1.25rem + env(safe-area-inset-bottom, 0px));
  left: 1rem;
  z-index: 35;
  display: flex;
  gap: 0.5rem;
  justify-content: center;
`;

export const action = css`
  label: MapTapActions-action;
  flex: 1;
  max-width: 12rem;
  min-height: 3.25rem;
  padding: 0 1rem;
  border: 0;
  border-radius: 999px;
  background: var(--color-ink);
  color: #fff;
  font-size: 0.9375rem;
  font-weight: 700;
  white-space: nowrap;
  box-shadow: 0 0.4rem 1.2rem rgb(0 0 0 / 22%);

  &:nth-child(2) {
    background: var(--color-surface);
    color: var(--color-ink);
  }

  &:active {
    transform: scale(0.98);
  }
`;
