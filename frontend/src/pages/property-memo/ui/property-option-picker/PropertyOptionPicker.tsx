import { css, cx } from '@emotion/css';
import type { ReactNode } from 'react';

import type { PropertyOptionKey } from '@/features/property/model/propertyOptions';
import SelectionControl from '@/shared/ui/selection-control/SelectionControl';

import PropertyOptionIcon from './PropertyOptionIcon';

type PickerOption = { key: string; label: string };

type PropertyOptionPickerProps = {
  label: string;
  options: readonly PickerOption[];
  selected: string[];
  disabled?: boolean;
  /** 아이콘 타일로 보일지, 글자 뱃지로 보일지. */
  variant?: 'icon' | 'badge';
  /** 선택지와 같은 필드셋 안에 먼저 보여 줄 입력 영역. */
  children?: ReactNode;
  onChange: (selected: string[]) => void;
};

/** 값을 글로 적는 대신 골라서 넣는다. 여러 개를 켤 수 있다. */
const PropertyOptionPicker = ({
  label,
  options,
  selected,
  disabled,
  variant = 'icon',
  children,
  onChange,
}: PropertyOptionPickerProps) => (
  <fieldset className={styles.picker}>
    <legend className={styles.legend}>
      {label}
      <span className={styles.count}>{selected.length}개</span>
    </legend>
    {children !== undefined && <div className={styles.pickerContent}>{children}</div>}
    <div className={variant === 'icon' ? styles.grid : styles.badges}>
      {options.map((option) => {
        const checked = selected.includes(option.key);
        return (
          <SelectionControl
            key={option.key}
            className={variant === 'icon' ? styles.option : styles.badge}
            checked={checked}
            disabled={disabled}
            onSelect={() =>
              onChange(checked ? selected.filter((item) => item !== option.key) : [...selected, option.key])
            }
          >
            {variant === 'icon' && <PropertyOptionIcon option={option.key as PropertyOptionKey} />}
            <span className={styles.optionLabel}>{option.label}</span>
          </SelectionControl>
        );
      })}
    </div>
  </fieldset>
);

const styles = {
  picker: css`
    label: PropertyOptionPicker-picker;
    min-width: 0;
    margin: 0;
    padding: 0;
    border: 0;
  `,

  legend: css`
    label: PropertyOptionPicker-legend;
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0;
    color: var(--color-ink, #212124);
    font-size: 0.82rem;
    font-weight: 800;
  `,

  count: css`
    label: PropertyOptionPicker-count;
    color: var(--color-muted, #868b94);
    font-size: 0.78rem;
    font-weight: 700;
  `,

  pickerContent: css`
    label: PropertyOptionPicker-pickerContent;
    margin-top: 0.55rem;
  `,

  grid: css`
    label: PropertyOptionPicker-grid;
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.5rem;
    margin-top: 0.55rem;
  `,

  badges: css`
    label: PropertyOptionPicker-badges;
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin-top: 0.55rem;
  `,

  // 다른 요소의 선택자에서 `.PropertyOptionPicker-badge`로 가리킨다.
  badge: cx(
    css`
      label: PropertyOptionPicker-badge;
      padding: 0.4rem 0.8rem;
      border: 1px solid var(--color-border, #eaebed);
      border-radius: 999px;
      background: var(--color-surface, #fff);
      color: var(--color-muted, #868b94);
      transition:
        border-color 0.15s ease,
        background 0.15s ease,
        color 0.15s ease;

      &[data-selected='true'] {
        border-color: var(--color-primary, #6c873b);
        background: var(--color-surface-brand, #f2f2f2);
        color: var(--color-ink, #212124);
      }
    `,
    'PropertyOptionPicker-badge',
  ),

  // 다른 요소의 선택자에서 `.PropertyOptionPicker-input`로 가리킨다.
  input: cx(
    css`
      label: PropertyOptionPicker-input;

      .PropertyOptionPicker-badge:has(&:focus-visible) {
        outline: 2px solid var(--color-focus);
        outline-offset: 2px;
      }
    `,
    'PropertyOptionPicker-input',
  ),

  option: css`
    label: PropertyOptionPicker-option;
    display: grid;
    gap: 0.3rem;
    padding: 0.6rem 0.25rem 0.5rem;
    border: 1px solid var(--color-border, #eaebed);
    border-radius: var(--radius-sm, 0.65rem);
    background: var(--color-surface, #fff);
    color: var(--color-muted, #868b94);
    justify-items: center;
    transition:
      border-color 0.15s ease,
      background 0.15s ease,
      color 0.15s ease;

    &[data-selected='true'] {
      border-color: var(--color-primary, #6c873b);
      background: var(--color-surface-brand, #f2f2f2);
      color: var(--color-ink, #212124);
    }

    &:has(.PropertyOptionPicker-input:focus-visible) {
      outline: 2px solid var(--color-focus);
      outline-offset: 2px;
    }
  `,

  optionLabel: css`
    label: PropertyOptionPicker-optionLabel;
    font-size: 0.74rem;
    font-weight: 750;
    line-height: 1.2;
    text-align: center;
  `,
};

export default PropertyOptionPicker;
