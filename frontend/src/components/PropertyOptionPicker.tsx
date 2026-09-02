import type { PropertyOptionKey } from '../constants/propertyOptions';
import PropertyOptionIcon from './PropertyOptionIcon';
import SelectionControl from './ui/SelectionControl';
import styles from './PropertyOptionPicker.module.css';

type PickerOption = { key: string; label: string };

type PropertyOptionPickerProps = {
  label: string;
  options: readonly PickerOption[];
  selected: string[];
  disabled?: boolean;
  /** 아이콘 타일로 보일지, 글자 뱃지로 보일지. */
  variant?: 'icon' | 'badge';
  onChange: (selected: string[]) => void;
};

/** 값을 글로 적는 대신 골라서 넣는다. 여러 개를 켤 수 있다. */
const PropertyOptionPicker = ({
  label,
  options,
  selected,
  disabled,
  variant = 'icon',
  onChange,
}: PropertyOptionPickerProps) => (
  <fieldset className={styles.picker}>
    <legend className={styles.legend}>
      {label}
      <span className={styles.count}>{selected.length}개</span>
    </legend>
    <div className={variant === 'icon' ? styles.grid : styles.badges}>
      {options.map((option) => {
        const checked = selected.includes(option.label);
        return (
          <SelectionControl
            key={option.key}
            className={variant === 'icon' ? styles.option : styles.badge}
            checked={checked}
            disabled={disabled}
            onSelect={() =>
              onChange(checked ? selected.filter((item) => item !== option.label) : [...selected, option.label])
            }
          >
            {variant === 'icon' && (
              <PropertyOptionIcon option={option.key as PropertyOptionKey} className={styles.icon} />
            )}
            <span className={styles.optionLabel}>{option.label}</span>
          </SelectionControl>
        );
      })}
    </div>
  </fieldset>
);

export default PropertyOptionPicker;
