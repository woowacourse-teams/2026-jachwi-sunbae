import { css, cx } from '@emotion/css';

// 다른 요소의 선택자에서 `.ShortcutTile-shortcut`로 가리킨다.
export const shortcut = cx(
  css`
    label: ShortcutTile-shortcut;
    display: grid;
    grid-template-rows: auto auto;
    justify-items: center;
    align-content: start;
    gap: 0.4rem;
    min-width: 0;
    border: 0;
    padding: 0;
    background: transparent;
    color: var(--color-ink);
    font: inherit;
    text-decoration: none;
    cursor: pointer;

    &:focus-visible {
      outline: 2px solid var(--color-focus);
      outline-offset: 3px;
    }
  `,
  'ShortcutTile-shortcut',
);

/* 타일 크기는 칸 너비로만 정해져서 이름이 길어져도 줄어들거나 넘치지 않는다. */
export const tile = css`
  label: ShortcutTile-tile;
  display: grid;
  place-items: center;
  width: 100%;
  aspect-ratio: 1;
  border-radius: var(--radius-tile);
  overflow: hidden;
  background: var(--color-card-surface);
  transition: transform 150ms ease;

  /* 아이콘은 타일 크기를 기준으로 채우되 가장자리에 약간 여백을 둔다. */
  & > img {
    width: 78%;
    height: 78%;
  }

  @media (hover: hover) {
    .ShortcutTile-shortcut:hover & {
      transform: translateY(-2px);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

/* 긴 이름은 단어 단위로 최대 두 줄까지 보이고 넘치면 말줄임한다. */
export const label = css`
  label: ShortcutTile-label;
  display: -webkit-box;
  width: 100%;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1.3;
  letter-spacing: -0.03em;
  text-align: center;
  word-break: keep-all;
  overflow-wrap: anywhere;
`;
