import { css } from '@emotion/css';
import { useState } from 'react';

import { Button } from '@/shared/ui/button/Button';
import WheelPicker from '@/shared/ui/wheel-picker/WheelPicker';

import type { NeighborhoodPreviewContext } from './hooks/useNeighborhoodPreview';
import { RENT_LIMITS } from './model/criteriaLabels';

type FilterValues = Pick<
  NeighborhoodPreviewContext,
  'maxMinutes' | 'changeMaxMinutes' | 'maxTransfers' | 'changeMaxTransfers' | 'maxRent' | 'changeMaxRent'
>;
export type NeighborhoodFilterField = 'minutes' | 'transfers' | 'rent';
/** 월세 상한 선택지. 0은 전체 가격이다. 서버는 월세로 거르지 않아, 받은 동네 시세(월세 중앙값)를 화면에서 거른다. */
export const RENT_OPTIONS = RENT_LIMITS.map((value) => ({
  value,
  label: value === 0 ? '전체 가격' : `${value}만원 이하`,
}));
export const MINUTE_OPTIONS = Array.from({ length: 6 }, (_, index) => ({
  value: (index + 1) * 10,
  label: `${(index + 1) * 10}분 이내`,
}));
const TRANSFER_OPTIONS = [
  { value: 0, label: '환승 없음' },
  { value: 1, label: '1회 이하' },
  { value: 2, label: '2회 이하' },
];

/** 조건 칸 아래에 바로 펼치는 피커. 굴리면 바로 반영하므로 적용 버튼이 없다. */
export const NeighborhoodFilterPicker = ({
  preview,
  field,
}: {
  preview: FilterValues;
  field: NeighborhoodFilterField;
}) =>
  field === 'minutes' ? (
    <WheelPicker
      size="small"
      aria-label="최대 통근 시간"
      options={MINUTE_OPTIONS}
      value={preview.maxMinutes}
      onValueChange={preview.changeMaxMinutes}
    />
  ) : field === 'transfers' ? (
    <WheelPicker
      size="small"
      aria-label="최대 환승 횟수"
      options={TRANSFER_OPTIONS}
      value={preview.maxTransfers}
      onValueChange={preview.changeMaxTransfers}
    />
  ) : (
    <WheelPicker
      size="small"
      aria-label="최대 월세 시세"
      options={RENT_OPTIONS}
      value={preview.maxRent}
      onValueChange={preview.changeMaxRent}
    />
  );

const NeighborhoodFilters = ({
  preview,
  field,
  onClose,
  onApply,
}: {
  preview: FilterValues;
  field: NeighborhoodFilterField;
  onClose: () => void;
  onApply?: () => void;
}) => {
  const [draft, setDraft] = useState(
    field === 'minutes' ? preview.maxMinutes : field === 'rent' ? preview.maxRent : preview.maxTransfers,
  );
  return (
    <div className={styles.editor}>
      {field !== 'transfers' ? (
        <WheelPicker
          aria-label={field === 'rent' ? '최대 월세 시세' : '최대 통근 시간'}
          options={field === 'rent' ? RENT_OPTIONS : MINUTE_OPTIONS}
          value={draft}
          onValueChange={setDraft}
        />
      ) : (
        <div className={styles.choices} role="radiogroup" aria-label="최대 환승 횟수">
          {[0, 1, 2].map((count) => (
            <Button
              key={count}
              role="radio"
              aria-checked={draft === count}
              variant={draft === count ? 'soft' : 'secondary'}
              onClick={() => setDraft(count)}
            >
              {count === 0 ? '환승 없음' : `${count}회 이하`}
            </Button>
          ))}
        </div>
      )}
      <Button
        variant="soft"
        fullWidth
        onClick={() => {
          if (field === 'minutes') preview.changeMaxMinutes(draft);
          else if (field === 'rent') preview.changeMaxRent(draft);
          else preview.changeMaxTransfers(draft);
          onApply?.();
          onClose();
        }}
      >
        적용
      </Button>
    </div>
  );
};

const styles = {
  editor: css`
    label: NeighborhoodFilters-editor;
    display: flex;
    flex-direction: column;
    min-height: 100%;
    gap: 1rem;

    & > * {
      flex-shrink: 0;
    }

    & > button:last-child {
      margin-top: auto;
    }
  `,

  choices: css`
    label: NeighborhoodFilters-choices;
    display: flex;
    gap: 0.6rem;
    margin: 0.5rem 0 1rem;

    & button {
      display: flex;
      flex: 1;
      font-size: 0.8rem;
    }
  `,
};

export default NeighborhoodFilters;
