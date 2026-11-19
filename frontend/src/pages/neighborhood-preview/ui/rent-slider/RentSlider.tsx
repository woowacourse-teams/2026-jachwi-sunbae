import { css } from '@emotion/css';
import type { CSSProperties } from 'react';

import Slider from '@/shared/ui/slider/Slider';

import type { NeighborhoodPreviewContext } from '../../hooks/useNeighborhoodPreview';
import { RENT_OPTIONS } from '../../NeighborhoodFilters';

type SliderOption = { value: number; label: string };

type OptionSliderProps = {
  options: readonly SliderOption[];
  value: number;
  onChange: (value: number) => void;
  /** 위 왼쪽 제목. */
  label: string;
  /** 읽기 도구가 읽는 이름. */
  ariaLabel: string;
  /** 위 오른쪽 현재 값. 없으면 고른 선택지 글자를 쓴다. */
  indicator?: (option: SliderOption) => string;
  /** 아래 보조 설명. */
  description?: string;
  className?: string;
};

/**
 * 정해진 선택지 가운데 하나를 끌어서 고르는 파란 슬라이더. 월세 상한과 휴대폰 동네 찾기 조건 시트의 통근 시간이 함께 쓴다.
 * 선택지가 여러 개라 버튼 대신 끌어서 고르고 화살표 키로도 움직인다.
 */
export const OptionSlider = ({
  options,
  value,
  onChange,
  label,
  ariaLabel,
  indicator,
  description,
  className,
}: OptionSliderProps) => {
  const index = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  const selected = options[index] ?? options[0];
  return (
    <div
      style={{ '--fill': `${(index / (options.length - 1 || 1)) * 100}%` } as CSSProperties}
      className={className ? `${styles.blue} ${className}` : styles.blue}
    >
      <Slider
        label={label}
        indicator={selected ? (indicator?.(selected) ?? selected.label) : undefined}
        description={description}
        min={0}
        max={options.length - 1}
        values={[index]}
        onValuesChange={([next]) => onChange(options[next ?? 0]?.value ?? 0)}
        getAriaLabel={() => ariaLabel}
        getAriaValuetext={() => selected?.label ?? ''}
      />
    </div>
  );
};

type Props = {
  preview: Pick<NeighborhoodPreviewContext, 'maxRent' | 'changeMaxRent'>;
  className?: string;
  /** 데스크탑 왼쪽 조건 칸처럼 좁은 자리에 둘 때 설명 줄을 뺀다. */
  compact?: boolean;
};

/**
 * 동네의 월세 시세 상한을 고르는 슬라이더. 데스크탑 지도 아래 카드와 휴대폰 동네 찾기 조건 시트가 함께 쓴다.
 * 받은 시세를 화면에서 거르는 조건이라 다시 찾지 않고, 끄는 동안 지도 색과 순위가 바로 바뀐다.
 */
const RentSlider = ({ preview, className, compact = false }: Props) => (
  <OptionSlider
    options={RENT_OPTIONS}
    value={preview.maxRent}
    onChange={preview.changeMaxRent}
    label="월세 시세"
    ariaLabel="최대 월세 시세"
    description={compact ? undefined : '최근 6개월 실거래 월세 중앙값으로 걸러요.'}
    className={className}
  />
);

const styles = {
  /* 막대 뒤(채워지지 않은 쪽)는 옅은 회색, 채워진 쪽과 손잡이는 우리 파랑으로 칠한다. --fill은 손잡이 위치(%)다. */
  blue: css`
    label: RentSlider-blue;

    & input {
      accent-color: var(--color-brand-blue);
      height: 1.4rem;
      appearance: none;
      background: transparent;
    }

    & input::-webkit-slider-runnable-track {
      height: 0.3rem;
      border-radius: 999px;
      background: linear-gradient(to right, var(--color-brand-blue) var(--fill, 0%), #e3e5e9 var(--fill, 0%));
    }

    & input::-moz-range-track {
      height: 0.3rem;
      border-radius: 999px;
      background: #e3e5e9;
    }

    & input::-moz-range-progress {
      height: 0.3rem;
      border-radius: 999px;
      background: var(--color-brand-blue);
    }

    & input::-webkit-slider-thumb {
      width: 1.15rem;
      height: 1.15rem;
      margin-top: -0.425rem;
      border: 2px solid #fff;
      border-radius: 50%;
      appearance: none;
      background: var(--color-brand-blue);
      box-shadow: 0 1px 4px rgb(0 0 0 / 20%);
    }

    & input::-moz-range-thumb {
      width: 1.15rem;
      height: 1.15rem;
      border: 2px solid #fff;
      border-radius: 50%;
      background: var(--color-brand-blue);
      box-shadow: 0 1px 4px rgb(0 0 0 / 20%);
    }
  `,
};

export default RentSlider;
