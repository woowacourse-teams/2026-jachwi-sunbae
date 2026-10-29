import { css } from '@emotion/css';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import Icon from '@/shared/ui/icon/Icon';

import useMealNavigation from './hooks/useMealNavigation';
import { MEAL_TABS, type MealTab } from './model/MealNavigation';
import ConveniencePanel from './ui/ConveniencePanel';
import DeliveryPanel from './ui/DeliveryPanel';
import MealDetails from './ui/MealDetails';
import RestaurantPanel from './ui/RestaurantPanel';

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
const CheapMealsPage = () => {
  const navigation = useMealNavigation();
  const { tab, selectTab } = navigation;
  const [visited, setVisited] = useState<MealTab[]>([tab]);
  useEffect(() => {
    setVisited((previous) => (previous.includes(tab) ? previous : [...previous, tab]));
  }, [tab]);
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link to="/" aria-label="홈으로 돌아가기">
          <Icon name="chevron-left" size={24} />
        </Link>
        <h1>저렴한 한 끼 찾기</h1>
      </header>
      <div role="tablist" aria-label="한 끼 카테고리" className={styles.tabs}>
        {(Object.keys(MEAL_TABS) as MealTab[]).map((value, index, all) => (
          <button
            key={value}
            type="button"
            role="tab"
            id={`meal-tab-${value}`}
            aria-controls={`meal-panel-${value}`}
            aria-selected={tab === value}
            tabIndex={tab === value ? 0 : -1}
            onClick={() => selectTab(value)}
            onKeyDown={(event) => {
              const next =
                event.key === 'ArrowRight'
                  ? all[(index + 1) % all.length]
                  : event.key === 'ArrowLeft'
                    ? all[(index + all.length - 1) % all.length]
                    : event.key === 'Home'
                      ? all[0]
                      : event.key === 'End'
                        ? all[all.length - 1]
                        : null;
              if (next) {
                event.preventDefault();
                selectTab(next);
                document.getElementById(`meal-tab-${next}`)?.focus();
              }
            }}
          >
            {MEAL_TABS[value]}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id="meal-panel-all"
        aria-labelledby="meal-tab-all"
        hidden={tab !== 'all'}
        className={styles.scrollPanel}
      >
        <section className={styles.overview}>
          <span className={styles.eyebrow}>오늘의 식비를 조금 가볍게</span>
          <h2>오늘은 어떻게 아껴볼까요?</h2>
          <p>세 가지 방법 중 원하는 것을 선택해 보세요.</p>
          <div className={styles.choices}>
            {choices.map((choice) => (
              <button type="button" key={choice.tab} onClick={() => selectTab(choice.tab)}>
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
          {(visited.includes(value) || tab === value) &&
            (value === 'restaurant' ? (
              <RestaurantPanel isActive={tab === value} />
            ) : value === 'convenience' ? (
              <ConveniencePanel isActive={tab === value} onDetail={navigation.openDetail} />
            ) : (
              <DeliveryPanel isActive={tab === value} onDetail={navigation.openDetail} />
            ))}
        </div>
      ))}
      {navigation.detail && <MealDetails detail={navigation.detail} onClose={navigation.closeDetail} />}
    </main>
  );
};
const styles = {
  page: css`
    label: CheapMealsPage-page;
    height: 100dvh;
    max-height: 100%;
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 60rem;
    margin: auto;
    background: var(--color-surface);
    color: var(--color-ink);
    overflow: hidden;
    padding-top: env(safe-area-inset-top);
    box-sizing: border-box;
  `,
  header: css`
    label: CheapMealsPage-header;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-shrink: 0;
    padding: 0.45rem 0.75rem;
    & a {
      display: grid;
      place-items: center;
      width: 44px;
      height: 44px;
      color: inherit;
    }
    & h1 {
      margin: 0;
      font-size: 1.1rem;
      letter-spacing: -0.035em;
    }
  `,
  tabs: css`
    label: CheapMealsPage-tabs;
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    padding: 0 1rem;
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
  scrollPanel: css`
    label: CheapMealsPage-scrollPanel;
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
    label: CheapMealsPage-mapPanel;
    flex: 1;
    min-height: 0;
    &[hidden] {
      display: none;
    }
  `,
  overview: css`
    label: CheapMealsPage-overview;
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
  eyebrow: css`
    label: CheapMealsPage-eyebrow;
    font-size: 0.75rem;
    color: var(--color-ink-soft);
  `,
  choices: css`
    label: CheapMealsPage-choices;
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
  choiceIcon: css`
    label: CheapMealsPage-choiceIcon;
    flex-shrink: 0;
    width: 2.6rem;
    height: 2.6rem;
    border-radius: 0.8rem;
    display: grid;
    place-items: center;
    background: color-mix(in srgb, var(--color-brand-yellow) 20%, white);
  `,
  choiceText: css`
    label: CheapMealsPage-choiceText;
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
export default CheapMealsPage;
