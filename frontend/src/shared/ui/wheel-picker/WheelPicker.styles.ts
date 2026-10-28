import { css } from '@emotion/css';

export const picker = css`
  label: WheelPicker-picker;
  position: relative;
  height: 220px;
  width: 100%;
`;

export const indicator = css`
  label: WheelPicker-indicator;
  position: absolute;
  top: 88px;
  inset-inline: 0.5rem;
  height: 44px;
  background: #f2f3f5;
  border-radius: 0.6rem;
`;

export const column = css`
  label: WheelPicker-column;
  position: absolute;
  inset: 0;
  overflow-y: auto;
  padding-block: 88px;
  scrollbar-width: none;
  scroll-snap-type: y mandatory;
  touch-action: pan-y;
  overscroll-behavior: contain;
  mask-image: linear-gradient(transparent, black 35%, black 65%, transparent);

  &::-webkit-scrollbar {
    display: none;
  }
`;

export const item = css`
  label: WheelPicker-item;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  scroll-snap-align: center;
  color: #90949c;
  font-size: 1.1rem;
  cursor: pointer;
  user-select: none;

  &[aria-selected='true'] {
    color: #25272b;
    font-weight: 700;
  }
`;
