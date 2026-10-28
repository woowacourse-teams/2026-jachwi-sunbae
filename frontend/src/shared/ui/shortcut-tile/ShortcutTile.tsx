import { css, cx } from '@emotion/css';
import { Link } from 'react-router-dom';

type ShortcutTileBaseProps = {
  /** 타일 아래에 보이는 기능 이름. 두 줄을 넘으면 말줄임한다. */
  label: string;
  /** 타일 안에 들어가는 정사각형 아이콘 이미지. */
  icon: string;
  className?: string;
};

type ShortcutTileProps = ShortcutTileBaseProps &
  ({ to: string; onClick?: never } | { to?: never; onClick: () => void });

/**
 * 정사각형 아이콘 타일과 이름으로 된 바로가기. 타일 크기는 놓인 칸 너비를 따르므로 그리드에 넣어 쓴다.
 * 화면 이동이면 `to`로 링크를, 동작이면 `onClick`으로 버튼을 그린다.
 */
const ShortcutTile = ({ label, icon, className, to, onClick }: ShortcutTileProps) => {
  const classes = `${styles.shortcut} ${className ?? ''}`.trim();
  const content = (
    <>
      <span className={styles.tile} aria-hidden="true">
        <img src={icon} alt="" width={192} height={192} />
      </span>
      <span className={styles.label}>{label}</span>
    </>
  );

  if (to !== undefined) {
    return (
      <Link className={classes} to={to}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" className={classes} onClick={onClick}>
      {content}
    </button>
  );
};

const styles = {
  // 다른 요소의 선택자에서 `.ShortcutTile-shortcut`로 가리킨다.
  shortcut: cx(
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
  ),

  /* 타일 크기는 칸 너비로만 정해져서 이름이 길어져도 줄어들거나 넘치지 않는다. */
  tile: css`
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
  `,

  /* 긴 이름은 단어 단위로 최대 두 줄까지 보이고 넘치면 말줄임한다. */
  label: css`
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
  `,
};

export default ShortcutTile;
