import { css } from '@emotion/css';

import { SegmentedControl, SegmentedControlItem } from '@/shared/ui/segmented-control/SegmentedControl';

import type { AreaTab } from '../../hooks/useNeighborhoodMapView';

type Props = {
  areaName: string;
  value: AreaTab;
  onChange: (tab: AreaTab) => void;
};

/**
 * 고른 동네 시트(휴대폰)와 목록 옆 칸(데스크탑) 위의 탭. 처음에는 `동네 정보`를 열고,
 * 출발 정류장 목록과 정류장 마커는 주변 분석의 교통 분류처럼 `교통` 탭에 둔다.
 */
const AreaTabs = ({ areaName, value, onChange }: Props) => (
  <SegmentedControl
    className={styles.tabs}
    aria-label={`${areaName} 정보 보기`}
    value={value}
    onValueChange={(next) => onChange(next === 'transport' ? 'transport' : 'overview')}
  >
    <SegmentedControlItem value="overview">동네 정보</SegmentedControlItem>
    <SegmentedControlItem value="transport">교통</SegmentedControlItem>
  </SegmentedControl>
);

const styles = {
  tabs: css`
    label: AreaTabs-tabs;
    flex: none;
  `,
};

export default AreaTabs;
