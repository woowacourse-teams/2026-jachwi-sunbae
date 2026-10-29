import { css, cx } from '@emotion/css';

import Icon from '@/shared/ui/icon/Icon';

import type { MealTabs } from '../../hooks/useMealTabs';
import ConveniencePanel from '../ConveniencePanel';
import DeliveryPanel from '../DeliveryPanel';
import RestaurantPanel from '../RestaurantPanel';

const choices = [
  {
    tab: 'restaurant',
    title: '주변 착한가격업소',
    description: '내 주변 저렴한 가게와 메뉴 가격 확인',
    icon: 'map',
  },
  {
    tab: 'convenience',
    title: '편의점 행사상품',
    description: '이마트24 · 세븐일레븐 행사상품',
    icon: 'inbox',
  },
  { tab: 'delivery', title: '배달 할인정보', description: '배민 · 쿠팡이츠 할인 혜택', icon: 'home' },
] as const;

type MealTabPanelsProps = { tabs: MealTabs };

/**
 * 탭마다 패널을 하나씩 둔다. 한 번 연 패널은 숨겨 두기만 해서 필터와 스크롤을 지킨다.
 * 데스크탑에서는 선택 카드를 가로로 놓고, 각 패널도 넓은 화면 배치를 쓴다.
 */
const MealTabPanels = ({ tabs }: MealTabPanelsProps) => {
  const { tab, layout } = tabs;
  return (
    <>
      <div
        role="tabpanel"
        id="meal-panel-all"
        aria-labelledby="meal-tab-all"
        hidden={tab !== 'all'}
        className={styles.scrollPanel}
      >
        <section className={cx(styles.overview, layout === 'desktop' && styles.overviewDesktop)}>
          <span className={styles.eyebrow}>오늘의 식비를 조금 가볍게</span>
          <h2>오늘은 어떻게 아껴볼까요?</h2>
          <p>세 가지 방법 중 원하는 것을 선택해 보세요.</p>
          <div className={cx(styles.choices, layout === 'desktop' && styles.choicesDesktop)}>
            {choices.map((choice) => (
              <button type="button" key={choice.tab} onClick={() => tabs.selectTab(choice.tab, 'overview_card')}>
                <span className={styles.choiceIcon}>
                  <Icon name={choice.icon} size={26} />
                </span>
                <span className={styles.choiceText}>
                  <strong>{choice.title}</strong>
                  <span>{choice.description}</span>
                </span>
                <Icon name="chevron-right" size={20} />
              </button>
            ))}
          </div>
        </section>
      </div>
      {(['restaurant', 'convenience', 'delivery'] as const).map((value) => (
        <div
          key={value}
          role="tabpanel"
          id={`meal-panel-${value}`}
          aria-labelledby={`meal-tab-${value}`}
          hidden={tab !== value}
          className={value === 'restaurant' ? styles.mapPanel : styles.scrollPanel}
        >
          {tabs.isRendered(value) &&
            (value === 'restaurant' ? (
              <RestaurantPanel isActive={tab === value} layout={layout} />
            ) : value === 'convenience' ? (
              <ConveniencePanel isActive={tab === value} layout={layout} onDetail={tabs.openDetail} />
            ) : (
              <DeliveryPanel isActive={tab === value} layout={layout} onDetail={tabs.openDetail} />
            ))}
        </div>
      ))}
    </>
  );
};

const styles = {
  scrollPanel: css`
    label: MealTabPanels-scrollPanel;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding-bottom: env(safe-area-inset-bottom);
    &[hidden] {
      display: none;
    }
  `,
  mapPanel: css`
    label: MealTabPanels-mapPanel;
    flex: 1;
    min-height: 0;
    &[hidden] {
      display: none;
    }
  `,
  overview: css`
    label: MealTabPanels-overview;
    padding: 2rem 1.25rem;
    max-width: 45rem;
    margin: auto;
    & h2 {
      font-size: 1.4rem;
      letter-spacing: -0.04em;
      margin: 0.5rem 0 0.7rem;
    }
    & > p {
      font-size: 0.85rem;
      color: var(--color-ink-soft);
      line-height: 1.6;
      margin: 0;
    }
  `,
  overviewDesktop: css`
    label: MealTabPanels-overviewDesktop;
    max-width: none;
    padding: 2.5rem 0;
  `,
  eyebrow: css`
    label: MealTabPanels-eyebrow;
    font-size: 0.75rem;
    color: var(--color-ink-soft);
  `,
  choices: css`
    label: MealTabPanels-choices;
    display: grid;
    gap: 1rem;
    margin-top: 1.8rem;
    & > button {
      display: flex;
      align-items: center;
      gap: 0.9rem;
      width: 100%;
      min-height: 7rem;
      padding: 1.1rem;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-card);
      color: var(--color-ink);
      background: var(--color-surface);
      font: inherit;
      text-align: left;
      cursor: pointer;
    }
    & > button:hover {
      background: var(--color-surface-muted);
    }
    & > button > svg {
      flex-shrink: 0;
    }
  `,
  choicesDesktop: css`
    label: MealTabPanels-choicesDesktop;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  `,
  choiceIcon: css`
    label: MealTabPanels-choiceIcon;
    flex-shrink: 0;
    width: 2.6rem;
    height: 2.6rem;
    border-radius: 0.8rem;
    display: grid;
    place-items: center;
    background: color-mix(in srgb, var(--color-brand-yellow) 20%, white);
  `,
  choiceText: css`
    label: MealTabPanels-choiceText;
    display: flex;
    flex: 1;
    min-width: 0;
    flex-direction: column;
    gap: 0.5rem;
    & strong {
      font-size: 1rem;
      letter-spacing: -0.03em;
    }
    & > span {
      font-size: 0.75rem;
      color: var(--color-ink-soft);
      line-height: 1.6;
    }
  `,
};

export default MealTabPanels;
