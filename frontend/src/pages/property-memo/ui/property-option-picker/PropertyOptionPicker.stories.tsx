import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { fn } from 'storybook/test';

import { MAINTENANCE_OPTIONS, PROPERTY_OPTIONS } from '@/features/property/model/propertyOptions';
import MoneyField from '@/features/property/ui/money-field/MoneyField';

import PropertyOptionPicker from './PropertyOptionPicker';

const meta = {
  title: '페이지/매물 메모/PropertyOptionPicker',
  component: PropertyOptionPicker,
  argTypes: {
    label: { description: '필드셋 제목.' },
    options: { control: false, description: '고를 수 있는 선택지 목록(key·label).' },
    selected: {
      control: 'check',
      options: PROPERTY_OPTIONS.map((option) => option.key),
      description: '선택된 선택지 key 목록.',
    },
    disabled: { description: '모든 선택지를 고를 수 없게 막는다.' },
    variant: {
      control: 'inline-radio',
      options: ['icon', 'badge'],
    },
    children: { control: false },
    onChange: { description: '선택이 바뀌면 새 key 목록으로 부른다.' },
  },
  args: {
    label: '방 옵션',
    options: PROPERTY_OPTIONS,
    selected: ['AIR_CONDITIONER', 'REFRIGERATOR', 'BED'],
    variant: 'icon',
    disabled: false,
    onChange: fn(),
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
  argTypes: {
    selected: {
      control: 'check',
      options: MAINTENANCE_OPTIONS.map((option) => option.key),
    },
  },
  args: {
    label: '관리비 포함 공과금',
    options: MAINTENANCE_OPTIONS,
    variant: 'badge',
    selected: ['WATER', 'INTERNET'],
    children: (
      <MoneyField
        label="총 관리비"
        value="7"
        placeholder="예: 10"
        onValueChange={fn().mockName('MoneyField.onValueChange')}
      />
    ),
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
