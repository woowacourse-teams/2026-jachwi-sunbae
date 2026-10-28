import { css, cx } from '@emotion/css';

// 다른 요소의 선택자에서 `.BottomSheet-sheet`로 가리킨다.
export const sheet = cx(
  css`
    label: BottomSheet-sheet;
    position: absolute;
    left: 0;
    right: 0;
    bottom: var(--map-sheet-bottom, 0px);
    height: var(--sheet-height, var(--sheet-default-height, 58%));
    max-height: calc(100% - var(--map-sheet-bottom, 0px) - 1rem);
    display: flex;
    flex-direction: column;
    z-index: 35;
    border-radius: 1.25rem 1.25rem 0 0;
    background: var(--color-surface);
    color: var(--color-ink);
    box-shadow: 0 -0.35rem 1.4rem rgb(0 0 0 / 12%);
    overflow: hidden;

    &[data-expanded='true'] {
      height: var(--sheet-height, 88%);
    }

    /* 태블릿부터는 넓은 화면을 가로지르지 않게 30rem 폭으로 가운데에 띄운다. */
    @media (min-width: 768px) {
      max-width: 30rem;
      margin-right: auto;
      margin-left: auto;
    }
  `,
  'BottomSheet-sheet',
);

export const grabber = css`
  label: BottomSheet-grabber;
  flex: none;
  display: grid;
  place-items: center;
  width: 100%;
  height: 1.75rem;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: ns-resize;
  touch-action: none;

  & span {
    width: 2.5rem;
    height: 0.25rem;
    border-radius: 999px;
    background: var(--color-border-strong);
  }
`;

export const header = css`
  label: BottomSheet-header;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.35rem 1.25rem 0.7rem;
  flex: none;

  & h2 {
    font-size: 1.05rem;
    margin: 0;
  }

  .BottomSheet-sheet[data-resizable='false'] & {
    padding-top: 1.25rem;
  }

  & button {
    display: grid;
    place-items: center;
    width: 2rem;
    height: 2rem;
    padding: 0;
    background: none;
    color: inherit;
    border: 0;
    cursor: pointer;
  }
`;

export const content = css`
  label: BottomSheet-content;
  overflow-y: auto;
  overscroll-behavior: contain;
  min-height: 0;
  flex: 1;
  padding: 0 1.25rem 1.5rem;
`;
