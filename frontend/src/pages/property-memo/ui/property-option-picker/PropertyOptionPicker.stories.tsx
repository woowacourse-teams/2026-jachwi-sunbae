import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { MAINTENANCE_OPTIONS, PROPERTY_OPTIONS } from '@/features/property/model/propertyOptions';
import MoneyField from '@/features/property/ui/money-field/MoneyField';

import PropertyOptionPicker from './PropertyOptionPicker';

const meta = {
  title: '페이지/매물 메모/PropertyOptionPicker',
  component: PropertyOptionPicker,
  argTypes: {
    variant: {
      control: 'select',
      options: ['icon', 'badge'],
    },
    children: { control: false },
  },
  args: {
    label: '방 옵션',
    options: PROPERTY_OPTIONS,
    selected: ['AIR_CONDITIONER', 'REFRIGERATOR', 'BED'],
    onChange: () => undefined,
  },
  decorators: [
    (Story) => (
      <div style={{ width: '24rem' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PropertyOptionPicker>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Icon: Story = {};

export const Badge: Story = {
  args: {
    label: '관리비 포함 공과금',
    options: MAINTENANCE_OPTIONS,
    variant: 'badge',
    selected: ['WATER', 'INTERNET'],
    children: <MoneyField label="총 관리비" value="7" placeholder="예: 10" onValueChange={() => undefined} />,
  },
};

export const NoneSelected: Story = {
  args: {
    selected: [],
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};
