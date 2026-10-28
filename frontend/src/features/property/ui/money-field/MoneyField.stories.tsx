import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { useState } from 'react';

import MoneyField from './MoneyField';

const meta = {
  title: '기능/매물/MoneyField',
  component: MoneyField,
  args: {
    id: 'story-deposit',
    label: '보증금',
    requirement: '필수',
    placeholder: '0',
    value: '1,000',
    onValueChange: () => undefined,
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return <MoneyField {...args} value={value} onValueChange={setValue} />;
  },
  decorators: [
    (Story) => (
      <div style={{ width: '20rem' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MoneyField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: {
    value: '',
  },
};

export const WithError: Story = {
  args: {
    value: '',
    error: '보증금을 입력해 주세요.',
  },
};
