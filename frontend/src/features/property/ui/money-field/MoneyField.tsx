import type { ComponentProps } from 'react';

import TextField from '@/shared/ui/text-field/TextField';

import { formatMoneyInput } from '../../lib/propertyForm';

type MoneyFieldProps = Omit<
  ComponentProps<typeof TextField>,
  'value' | 'onChange' | 'suffix' | 'inputMode' | 'aria-label'
> & {
  value: string;
  /** 숫자와 쉼표만 받아 천 단위 쉼표를 붙인 값을 넘긴다. 다른 문자가 섞이면 부르지 않는다. */
  onValueChange: (formatted: string) => void;
};

/** 만원 단위 금액 입력칸. 숫자 키패드를 열고 천 단위 쉼표를 붙인다. */
const MoneyField = ({ label, onValueChange, ...textFieldProps }: MoneyFieldProps) => (
  <TextField
    {...textFieldProps}
    label={label}
    aria-label={`${label} (만원)`}
    suffix="만원"
    inputMode="numeric"
    onChange={(event) => {
      const formatted = formatMoneyInput(event.target.value);
      if (formatted !== null) onValueChange(formatted);
    }}
  />
);

export default MoneyField;
