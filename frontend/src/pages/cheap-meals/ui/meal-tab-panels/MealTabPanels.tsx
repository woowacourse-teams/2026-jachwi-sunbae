import { css } from '@emotion/css';

import type { MealTabs } from '../../hooks/useMealTabs';
import ConveniencePanel from '../ConveniencePanel';
import DeliveryPanel from '../DeliveryPanel';
import RestaurantPanel from '../RestaurantPanel';

type MealTabPanelsProps = { tabs: MealTabs };

/**
 * 탭마다 패널을 하나씩 둔다. 한 번 연 패널은 숨겨 두기만 해서 필터와 스크롤을 지킨다.
 * 데스크탑에서는 각 패널이 넓은 화면 배치를 쓴다.
 */
const MealTabPanels = ({ tabs }: MealTabPanelsProps) => {
  const { tab, layout } = tabs;
  return (
    <>
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
};

export default MealTabPanels;
