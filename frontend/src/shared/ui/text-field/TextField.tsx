import type { InputHTMLAttributes, ReactNode } from 'react';
import { useId } from 'react';

import styles from './TextField.module.css';

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'children'> & {
  label: string;
  requirement?: '필수' | '선택';
  helpText?: string;
  error?: string;
  suffix?: ReactNode;
  labelSuffix?: ReactNode;
  fieldClassName?: string;
  /** 기본은 밑줄. 네모 테두리가 필요한 곳만 `box`로 되돌린다. */
  variant?: 'box' | 'underline';
  /** 한 화면에서 한 칸씩 크게 묻는 폼은 `large`를 쓴다. */
  fieldSize?: 'medium' | 'large';
};

const TextField = ({
  label,
  requirement,
  helpText,
  error,
  suffix,
  labelSuffix,
  id,
  className,
  fieldClassName,
  variant = 'underline',
  fieldSize = 'medium',
  ...inputProps
}: TextFieldProps) => {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const helpId = helpText === undefined ? undefined : `${inputId}-help`;
  const errorId = error === undefined ? undefined : `${inputId}-error`;
  const describedBy = [helpId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={`${styles.field} ${fieldClassName ?? ''}`} data-variant={variant} data-size={fieldSize}>
      <label htmlFor={inputId}>
        {requirement === '필수' && (
          <span className={styles.requiredMarker} aria-hidden="true">
            *
          </span>
        )}
        {label}
        {labelSuffix}
      </label>
      <div className={styles.control}>
        <input
          {...inputProps}
          id={inputId}
          className={className}
          aria-label={inputProps['aria-label'] ?? label}
          aria-invalid={error === undefined ? undefined : true}
          aria-describedby={describedBy}
        />
        {suffix !== undefined && <span className={styles.suffix}>{suffix}</span>}
      </div>
      {helpText !== undefined && (
        <p id={helpId} className={styles.help}>
          {helpText}
        </p>
      )}
      {error !== undefined && (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
};

export default TextField;
