import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';

import MoneyField from '@/features/property/ui/money-field/MoneyField';

const ControlledMoneyField = () => {
  const [value, setValue] = useState('');
  return <MoneyField label="보증금" value={value} onValueChange={setValue} />;
};

describe('MoneyField', () => {
  it('만원 단위를 이름에 포함하고 숫자 키패드를 연다', () => {
    render(<ControlledMoneyField />);

    const input = screen.getByRole('textbox', { name: '보증금 (만원)' });
    expect(input).toHaveAttribute('inputmode', 'numeric');
    expect(screen.getByText('만원')).toBeInTheDocument();
  });

  it('숫자에 천 단위 쉼표를 붙이고 숫자가 아닌 입력은 무시한다', async () => {
    const user = userEvent.setup();
    render(<ControlledMoneyField />);
    const input = screen.getByRole('textbox', { name: '보증금 (만원)' });

    await user.type(input, '1200');
    expect(input).toHaveValue('1,200');

    await user.type(input, 'a');
    expect(input).toHaveValue('1,200');
  });
});
