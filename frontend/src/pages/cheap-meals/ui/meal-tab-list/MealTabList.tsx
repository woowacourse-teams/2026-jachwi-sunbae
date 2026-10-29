import { css } from '@emotion/css';

import type { MealTabs } from '../../hooks/useMealTabs';
import { MEAL_TABS, type MealTab } from '../../model/MealNavigation';

type MealTabListProps = {
  tabs: MealTabs;
  /** vertical은 데스크탑 왼쪽 칸에 세로로 늘어놓는다. 위쪽에 탭 줄을 더 쌓지 않게 한다. */
  orientation?: 'horizontal' | 'vertical';
  className?: string;
};

/** 식당, 편의점, 배달 탭. 방향키(가로는 좌우, 세로는 위아래)와 Home, End로 탭을 옮긴다. */
const MealTabList = ({ tabs, orientation = 'horizontal', className }: MealTabListProps) => (
  <div
    role="tablist"
    aria-label="한 끼 카테고리"
    aria-orientation={orientation}
    className={`${orientation === 'vertical' ? styles.vertical : styles.tabs} ${className ?? ''}`.trim()}
  >
    {(Object.keys(MEAL_TABS) as MealTab[]).map((value, index, all) => (
      <button
        key={value}
        type="button"
        role="tab"
        id={`meal-tab-${value}`}
        aria-controls={`meal-panel-${value}`}
        aria-selected={tabs.tab === value}
        tabIndex={tabs.tab === value ? 0 : -1}
        onClick={() => tabs.selectTab(value, 'top_tab')}
        onKeyDown={(event) => {
          const forward = orientation === 'vertical' ? 'ArrowDown' : 'ArrowRight';
          const backward = orientation === 'vertical' ? 'ArrowUp' : 'ArrowLeft';
          const next =
            event.key === forward
              ? all[(index + 1) % all.length]
              : event.key === backward
                ? all[(index + all.length - 1) % all.length]
                : event.key === 'Home'
                  ? all[0]
                  : event.key === 'End'
                    ? all[all.length - 1]
                    : null;
          if (next) {
            event.preventDefault();
            tabs.selectTab(next, 'top_tab');
            document.getElementById(`meal-tab-${next}`)?.focus();
          }
        }}
      >
        {MEAL_TABS[value]}
      </button>
    ))}
  </div>
);

const styles = {
  tabs: css`
    label: MealTabList-tabs;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;
    & button {
      min-height: 48px;
      border: 0;
      border-bottom: 3px solid transparent;
      background: none;
      font: inherit;
      font-size: 0.9rem;
      color: var(--color-ink-soft);
      cursor: pointer;
    }
    & button[aria-selected='true'] {
      border-color: var(--color-brand-yellow);
      color: var(--color-ink);
      font-weight: 800;
    }
  `,

  /* 세로 탭: 고른 탭은 왼쪽에 노란 막대와 옅은 바탕을 둔다. */
  vertical: css`
    label: MealTabList-vertical;
    display: grid;
    align-content: start;
    gap: 0.25rem;

    & button {
      min-height: 44px;
      padding: 0 0.9rem;
      border: 0;
      border-left: 3px solid transparent;
      border-radius: 0 0.5rem 0.5rem 0;
      background: none;
      font: inherit;
      font-size: 0.95rem;
      color: var(--color-ink-soft);
      text-align: left;
      cursor: pointer;
    }

    & button:hover {
      background: var(--color-surface-muted);
    }

    & button[aria-selected='true'] {
      border-color: var(--color-brand-yellow);
      background: color-mix(in srgb, var(--color-brand-yellow) 14%, transparent);
      color: var(--color-ink);
      font-weight: 800;
    }
  `,
};

export default MealTabList;
