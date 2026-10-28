import { css } from '@emotion/css';
import { useEffect, useId, useRef } from 'react';

export type WheelPickerOption = { value: number; label: string };
/**
 * 굴려서 하나를 고르는 휠. 속성 이름은 SEED Design의 WheelPicker 컬럼(`options`, `value`, `onValueChange`)과
 * 루트(`size`, `aria-label`)를 따른다.
 * @see https://seed-design.io/react/components/wheel-picker
 */
type WheelPickerProps = {
  'aria-label': string;
  options: readonly WheelPickerOption[];
  value: number;
  onValueChange: (value: number) => void;
  /** small은 카드 안에 바로 펼칠 때 위아래 한 칸씩만 보이게 높이를 줄인다. */
  size?: 'small' | 'medium';
};
const ITEM_HEIGHT = 44;

const WheelPicker = ({ 'aria-label': ariaLabel, options, value, onValueChange, size = 'medium' }: WheelPickerProps) => {
  const id = useId();
  const column = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pointerStart = useRef<number | undefined>(undefined);
  const wasDragged = useRef(false);
  const selected = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  useEffect(() => {
    if (column.current) column.current.scrollTop = selected * ITEM_HEIGHT;
  }, [selected]);
  useEffect(() => () => clearTimeout(timer.current), []);
  const select = (index: number) => {
    clearTimeout(timer.current);
    const option = options[Math.max(0, Math.min(options.length - 1, index))];
    if (option) onValueChange(option.value);
  };
  return (
    <div
      className={styles.picker}
      data-size={size}
      role="listbox"
      aria-label={ariaLabel}
      aria-activedescendant={options.length ? `${id}-${selected}` : undefined}
      tabIndex={0}
      onKeyDown={(event) => {
        const index = { ArrowDown: selected + 1, ArrowUp: selected - 1, Home: 0, End: options.length - 1 }[event.key];
        if (index !== undefined) {
          event.preventDefault();
          select(index);
        }
      }}
    >
      <div className={styles.indicator} aria-hidden="true" />
      <div
        ref={column}
        className={styles.column}
        role="presentation"
        onPointerDown={(event) => {
          pointerStart.current = event.clientY;
          wasDragged.current = false;
        }}
        onPointerMove={(event) => {
          if (pointerStart.current !== undefined && Math.abs(event.clientY - pointerStart.current) > 6)
            wasDragged.current = true;
        }}
        onPointerUp={() => {
          pointerStart.current = undefined;
        }}
        onPointerCancel={() => {
          pointerStart.current = undefined;
        }}
        onScroll={() => {
          clearTimeout(timer.current);
          timer.current = setTimeout(() => {
            const index = Math.round((column.current?.scrollTop ?? 0) / ITEM_HEIGHT);
            if (index !== selected) select(index);
          }, 150);
        }}
      >
        {options.map((option, index) => (
          <div
            id={`${id}-${index}`}
            key={option.value}
            role="option"
            aria-selected={index === selected}
            className={styles.item}
            onClick={() => {
              if (!wasDragged.current) select(index);
            }}
          >
            {option.label}
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  picker: css`
    label: WheelPicker-picker;
    position: relative;
    height: 220px;
    width: 100%;

    &[data-size='small'] {
      height: 132px;
    }

    &[data-size='small'] > [aria-hidden='true'] {
      top: 44px;
    }

    &[data-size='small'] > [role='presentation'] {
      padding-block: 44px;
    }
  `,

  indicator: css`
    label: WheelPicker-indicator;
    position: absolute;
    top: 88px;
    inset-inline: 0.5rem;
    height: 44px;
    background: #f2f3f5;
    border-radius: 0.6rem;
  `,

  column: css`
    label: WheelPicker-column;
    position: absolute;
    inset: 0;
    overflow-y: auto;
    padding-block: 88px;
    scrollbar-width: none;
    scroll-snap-type: y mandatory;
    touch-action: pan-y;
    overscroll-behavior: contain;
    mask-image: linear-gradient(transparent, black 35%, black 65%, transparent);

    &::-webkit-scrollbar {
      display: none;
    }
  `,

  item: css`
    label: WheelPicker-item;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    scroll-snap-align: center;
    color: #90949c;
    font-size: 1.1rem;
    cursor: pointer;
    user-select: none;

    &[aria-selected='true'] {
      color: #25272b;
      font-weight: 700;
    }
  `,
};

export default WheelPicker;
