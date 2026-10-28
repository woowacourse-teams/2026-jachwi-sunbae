import { css } from '@emotion/css';
import { type ReactNode, useId } from 'react';

type SliderMarker = number | { value: number; label?: ReactNode };

/**
 * 손잡이 하나로 값을 고르는 슬라이더. 속성 이름은 SEED Design의 Slider를 따른다.
 * SEED처럼 값은 배열(`values`)로 주고받지만, 지금은 손잡이 하나(첫 값)만 그린다.
 * @see https://seed-design.io/react/components/slider
 */
type SliderProps = {
  min: number;
  max: number;
  step?: number;
  values: number[];
  onValuesChange: (values: number[]) => void;
  /** 위 왼쪽 제목 */
  label?: ReactNode;
  /** 위 오른쪽 현재 값 표시 */
  indicator?: ReactNode;
  /** 아래 보조 설명 */
  description?: ReactNode;
  /** 막대 아래 눈금 글자. 양 끝만 둘 때는 최솟값과 최댓값 두 개를 준다. */
  markers?: SliderMarker[];
  disabled?: boolean;
  getAriaLabel?: (thumbIndex: number) => string;
  getAriaValuetext?: (value: number) => string;
  className?: string;
};

const Slider = ({
  min,
  max,
  step = 1,
  values,
  onValuesChange,
  label,
  indicator,
  description,
  markers = [],
  disabled = false,
  getAriaLabel,
  getAriaValuetext,
  className,
}: SliderProps) => {
  const id = useId();
  const value = values[0] ?? min;
  return (
    <div className={className ? `${styles.root} ${className}` : styles.root}>
      {(label || indicator) && (
        <div className={styles.header}>
          {label && <span id={`${id}-label`}>{label}</span>}
          {indicator && <output htmlFor={id}>{indicator}</output>}
        </div>
      )}
      <input
        id={id}
        type="range"
        aria-label={getAriaLabel?.(0)}
        aria-labelledby={!getAriaLabel && label ? `${id}-label` : undefined}
        aria-valuetext={getAriaValuetext?.(value)}
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(event) => onValuesChange([Number(event.target.value)])}
      />
      {markers.length > 0 && (
        <div className={styles.markers} aria-hidden="true">
          {markers.map((marker) => {
            const { value: at, label: text } = typeof marker === 'number' ? { value: marker, label: marker } : marker;
            return (
              <span key={at} style={{ left: `${((at - min) / (max - min || 1)) * 100}%` }}>
                {text ?? at}
              </span>
            );
          })}
        </div>
      )}
      {description && <small>{description}</small>}
    </div>
  );
};

const styles = {
  root: css`
    label: Slider-root;
    display: grid;
    gap: 0.5rem;

    & input {
      width: 100%;
      margin: 0;
      accent-color: var(--color-primary);
      cursor: pointer;
    }

    & input:disabled {
      cursor: default;
      opacity: 0.6;
    }

    & small {
      color: var(--color-muted);
      font-size: 0.75rem;
    }
  `,

  header: css`
    label: Slider-header;
    display: flex;
    justify-content: space-between;
    font-size: 0.85rem;
    font-weight: 700;

    & output {
      color: var(--color-primary-dark);
      font-weight: 800;
      font-variant-numeric: tabular-nums;
    }
  `,

  /* 눈금 글자는 값 위치에 두되, 양 끝 글자는 막대 밖으로 나가지 않게 안쪽으로 붙인다. */
  markers: css`
    label: Slider-markers;
    position: relative;
    height: 1rem;
    color: var(--color-muted);
    font-size: 0.72rem;

    & span {
      position: absolute;
      transform: translateX(-50%);
      white-space: nowrap;
    }

    & span:first-child {
      transform: none;
    }

    & span:last-child {
      transform: translateX(-100%);
    }
  `,
};

export default Slider;
