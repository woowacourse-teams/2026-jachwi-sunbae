import { css } from '@emotion/css';
import { createContext, type ReactNode, useContext } from 'react';

/**
 * 한 줄로 이어 붙인 단일 선택 버튼. 속성 이름은 SEED Design의 SegmentedControl을 따른다.
 * @see https://seed-design.io/react/components/segmented-control
 */
type SegmentedControlProps = {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  'aria-label': string;
  className?: string;
  children: ReactNode;
};

type SegmentedControlItemProps = {
  value: string;
  disabled?: boolean;
  children: ReactNode;
};

const SegmentedControlContext = createContext<Pick<SegmentedControlProps, 'value' | 'onValueChange' | 'disabled'>>({
  value: '',
  onValueChange: () => {},
});

export const SegmentedControl = ({
  value,
  onValueChange,
  disabled = false,
  'aria-label': ariaLabel,
  className,
  children,
}: SegmentedControlProps) => (
  <div
    className={className ? `${styles.root} ${className}` : styles.root}
    role="radiogroup"
    aria-label={ariaLabel}
    aria-disabled={disabled || undefined}
  >
    <SegmentedControlContext.Provider value={{ value, onValueChange, disabled }}>
      {children}
    </SegmentedControlContext.Provider>
  </div>
);

export const SegmentedControlItem = ({ value, disabled = false, children }: SegmentedControlItemProps) => {
  const root = useContext(SegmentedControlContext);
  return (
    <button
      type="button"
      role="radio"
      aria-checked={root.value === value}
      disabled={root.disabled || disabled}
      onClick={() => root.onValueChange(value)}
    >
      {children}
    </button>
  );
};

/* 고른 칸은 옅은 틴트에 진한 글자로 두어 찾기 버튼보다 눈에 덜 띄게 한다. */
const styles = {
  root: css`
    label: SegmentedControl-root;
    display: grid;
    grid-auto-columns: minmax(0, 1fr);
    grid-auto-flow: column;
    gap: 0.2rem;
    padding: 0.2rem;
    border-radius: 0.7rem;
    background: var(--color-card-surface);

    & button {
      min-width: 0;
      min-height: 2.3rem;
      padding: 0 0.25rem;
      border: 0;
      border-radius: 0.55rem;
      background: transparent;
      color: var(--color-ink-soft);
      font: inherit;
      font-size: 0.8rem;
      font-weight: 600;
      white-space: nowrap;
      cursor: pointer;
    }

    & button:hover {
      color: var(--color-ink);
    }

    & button[aria-checked='true'] {
      background: white;
      color: var(--color-primary-dark);
      font-weight: 800;
      box-shadow: 0 1px 3px rgb(0 0 0 / 10%);
    }

    & button:focus-visible {
      outline: 2px solid var(--color-focus);
      outline-offset: 1px;
    }

    & button:disabled {
      cursor: default;
      opacity: 0.6;
    }
  `,
};
