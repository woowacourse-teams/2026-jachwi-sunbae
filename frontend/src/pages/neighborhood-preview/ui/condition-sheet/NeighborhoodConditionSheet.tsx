import { css } from '@emotion/css';
import type { ReactNode } from 'react';

import BottomSheet from '@/shared/ui/bottom-sheet/BottomSheet';
import { SegmentedControl, SegmentedControlItem } from '@/shared/ui/segmented-control/SegmentedControl';

import type { NeighborhoodPreviewContext } from '../../hooks/useNeighborhoodPreview';
import { criteriaSummary } from '../../model/criteriaLabels';
import { MINUTE_OPTIONS, TRANSFER_OPTIONS } from '../../NeighborhoodFilters';
import CommuteLegend from '../commute-legend/CommuteLegend';
import RentSlider, { OptionSlider } from '../rent-slider/RentSlider';

type Props = {
  preview: Pick<
    NeighborhoodPreviewContext,
    | 'maxMinutes'
    | 'applyMaxMinutes'
    | 'maxTransfers'
    | 'applyMaxTransfers'
    | 'maxRent'
    | 'changeMaxRent'
    | 'isRefining'
  >;
  /** 시트 바로 위 가운데에 띄울 버튼 줄(`내 기록으로`, `출퇴근 장소 다시 선택`). */
  floating?: ReactNode;
  /** 값이 바뀔 때마다 접는다(지도 빈 곳을 찍었을 때 등). */
  peekSignal: number;
  /** 아래로 끝까지 내렸을 때. 닫지 않고 접는다. */
  onCollapse: () => void;
  /** 동네 정보 시트가 위에 열린 동안 숨긴다. 높이 단계는 그대로 두어, 정보 시트를 닫으면 전과 같은 높이로 돌아온다. */
  hidden: boolean;
};

/**
 * 휴대폰 동네 찾기 결과의 조건 시트. 통근 시간, 환승 횟수, 월세 상한과 지도 색 기준을 한 시트에 모은다.
 * 고치는 대로 결과에 바로 반영한다(통근 시간을 줄이거나 월세를 바꾸면 받아 둔 결과를 거르고, 환승이나 더 긴 통근 시간은 잠깐 뒤 다시 받는다).
 * 닫기(X)는 없다. 아래로 내리면 제목과 조건 한 줄만 남게 접히고, 손잡이를 올리면 다시 열린다.
 */
const NeighborhoodConditionSheet = ({ preview, floating, peekSignal, onCollapse, hidden }: Props) => (
  <BottomSheet
    title="동네 찾기 조건"
    subtitle={criteriaSummary(preview)}
    showCloseButton={false}
    fullPage={false}
    initialHeightPercent={46}
    closeLabel="조건 접기"
    onClose={onCollapse}
    peekSignal={peekSignal}
    floating={floating}
    floatingAlign="center"
    hidden={hidden}
  >
    <div className={styles.body}>
      <OptionSlider
        options={MINUTE_OPTIONS}
        value={preview.maxMinutes}
        onChange={preview.applyMaxMinutes}
        label="통근 시간"
        ariaLabel="최대 통근 시간"
        indicator={(option) => `${option.value}분`}
        className={styles.minutes}
      />
      <fieldset className={styles.field}>
        <legend>환승 횟수</legend>
        <SegmentedControl
          aria-label="최대 환승 횟수"
          value={String(preview.maxTransfers)}
          onValueChange={(value) => preview.applyMaxTransfers(Number(value))}
        >
          {TRANSFER_OPTIONS.map((option) => (
            <SegmentedControlItem key={option.value} value={String(option.value)}>
              {option.label}
            </SegmentedControlItem>
          ))}
        </SegmentedControl>
      </fieldset>
      <RentSlider preview={preview} />
      <CommuteLegend maxMinutes={preview.maxMinutes} showsNoRent={false} className={styles.legend} />
      <p className={styles.status} role="status">
        {preview.isRefining ? '바꾼 조건으로 동네를 다시 찾고 있어요.' : ''}
      </p>
    </div>
  </BottomSheet>
);

const styles = {
  body: css`
    label: NeighborhoodConditionSheet-body;
    display: grid;
    gap: 1.25rem;
    padding: 0.25rem 1rem calc(env(safe-area-inset-bottom) + 1rem);
  `,
  /* 지금 고른 통근 시간을 크게 보여 준다. */
  minutes: css`
    label: NeighborhoodConditionSheet-minutes;
    & output {
      font-size: 1.35rem;
      font-weight: 800;
    }
  `,
  field: css`
    label: NeighborhoodConditionSheet-field;
    display: grid;
    gap: 0.5rem;
    min-width: 0;
    margin: 0;
    padding: 0;
    border: 0;

    & legend {
      margin-bottom: 0.5rem;
      padding: 0;
      font-size: 0.9rem;
      font-weight: 700;
    }
  `,
  /* 시트 안에서는 카드 그림자 없이 세 줄로 놓는다. */
  legend: css`
    label: NeighborhoodConditionSheet-legend;
    justify-self: start;
    box-shadow: none;
  `,
  status: css`
    label: NeighborhoodConditionSheet-status;
    margin: 0;
    color: var(--color-ink-soft);
    font-size: 0.8rem;

    &:empty {
      display: none;
    }
  `,
};

export default NeighborhoodConditionSheet;
