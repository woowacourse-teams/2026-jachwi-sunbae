import { css, keyframes } from '@emotion/css';

const splitLeftKeyframes = keyframes`
  from {
    opacity: 0;
    transform: translate(50%, 1.5rem) scale(0.6);
  }
`;

const splitRightKeyframes = keyframes`
  from {
    opacity: 0;
    transform: translate(-50%, 1.5rem) scale(0.6);
  }
`;

/* 휴대폰 기록 지도 가운데 아래의 추가 버튼과, 누르면 위로 좌우에 띄우는 메모·매물 버튼. */
export const root = css`
  label: RecordsAddButton-root;
  position: absolute;
  bottom: max(1.5rem, env(safe-area-inset-bottom));
  left: 50%;
  z-index: 20;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: center;
  width: max-content;
  transform: translateX(-50%);
`;

export const hint = css`
  label: RecordsAddButton-hint;
  max-width: calc(100vw - 2rem);
  padding: 0.5rem 0.7rem;
  border-radius: 0.5rem;
  background: #ffffffed;
  color: #92969d;
  font-size: 0.65rem;
  text-align: center;
`;

export const fab = css`
  label: RecordsAddButton-fab;
  display: grid;
  place-items: center;
  width: 3.75rem;
  height: 3.75rem;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: #648fff;
  color: white;
  box-shadow: 0 4px 16px #396ae837;
  cursor: pointer;

  &:active {
    transform: scale(0.97);
  }

  &:focus-visible {
    outline: 2px solid #25282d;
    outline-offset: 3px;
  }
`;

/* 펼친 동안 X로 바뀐 버튼. 메모·매물 버튼과 구분되게 흰 바탕으로 둔다. */
export const close = css`
  label: RecordsAddButton-close;
  background: #fff;
  color: var(--color-ink);
  box-shadow: 0 4px 16px rgb(0 0 0 / 16%);
`;

/* X 버튼 위에서 좌우로 벌어지며 나타난다. */
export const choices = css`
  label: RecordsAddButton-choices;
  display: flex;
  gap: 0.75rem;
`;

export const choice = css`
  label: RecordsAddButton-choice;
  min-width: 6.5rem;
  height: 3.25rem;
  padding: 0 1.2rem;
  border: 0;
  border-radius: 999px;
  background: #648fff;
  color: white;
  box-shadow: 0 4px 16px #396ae837;
  font: inherit;
  font-size: 0.95rem;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;

  &:active {
    transform: scale(0.97);
  }

  &:focus-visible {
    outline: 2px solid #25282d;
    outline-offset: 3px;
  }
`;

export const left = css`
  label: RecordsAddButton-left;
  animation: ${splitLeftKeyframes} 180ms ease-out;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const right = css`
  label: RecordsAddButton-right;
  animation: ${splitRightKeyframes} 180ms ease-out;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;
