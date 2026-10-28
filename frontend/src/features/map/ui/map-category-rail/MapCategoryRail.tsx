import { css } from '@emotion/css';

import { MAP_CATEGORY_OPTIONS } from '../../lib/mapPresentation';
import type { MapCategory } from '../../model/Map';

type MapCategoryRailProps = {
  selectedCategories: MapCategory[];
  counts?: Partial<Record<MapCategory, number>>;
  onToggle: (category: MapCategory) => void;
  /** 거리 메모 탭을 함께 보여준다. 매물 주변 분석처럼 시설만 다루는 화면은 끈다. */
  showMemo?: boolean;
  className?: string;
};

/** 지도 오른쪽에 세로로 쌓는 카테고리 버튼. 아이콘 없이 짧은 글자만 작게 둔다. */
const MapCategoryRail = ({
  selectedCategories,
  counts,
  onToggle,
  showMemo = false,
  className,
}: MapCategoryRailProps) => (
  <aside className={`${styles.rail} ${className ?? ''}`} aria-label="지도 시설 카테고리">
    {MAP_CATEGORY_OPTIONS.filter((option) => showMemo || option.value !== 'MEMO').map((option) => {
      const selected = selectedCategories.includes(option.value);
      const count = counts?.[option.value];
      return (
        <button
          key={option.value}
          type="button"
          className={styles.categoryButton}
          data-category={option.value}
          aria-pressed={selected}
          aria-label={`${option.label} ${selected ? '숨기기' : '표시하기'}${count === undefined ? '' : `, ${count}개`}`}
          onClick={() => onToggle(option.value)}
        >
          {option.shortLabel}
        </button>
      );
    })}
  </aside>
);

const styles = {
  rail: css`
    label: MapCategoryRail-rail;
    position: absolute;
    z-index: 12;
    top: 1rem;
    right: 0.72rem;
    display: grid;
    overflow: hidden;
    border-radius: 0.6rem;
    background: var(--color-surface, #fff);
    box-shadow: 0 0.2rem 0.8rem rgb(42 48 35 / 16%);
  `,

  categoryButton: css`
    label: MapCategoryRail-categoryButton;
    display: grid;
    width: 2.6rem;
    height: 2.5rem;
    padding: 0;
    border: 0;
    background: transparent;
    color: #25282d;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    place-items: center;

    & + & {
      border-top: 1px solid #ececec;
    }

    /* 켜진 카테고리는 추가 버튼과 같은 파란색으로 칠한다. */
    &[aria-pressed='true'] {
      background: #648fff;
      color: #fff;
    }

    &:focus-visible {
      outline: 2px solid #25282d;
      outline-offset: -2px;
    }
  `,
};

export default MapCategoryRail;
