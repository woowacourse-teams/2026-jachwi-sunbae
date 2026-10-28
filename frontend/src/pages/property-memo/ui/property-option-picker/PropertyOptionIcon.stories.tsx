import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { PROPERTY_OPTIONS } from '@/features/property/model/propertyOptions';

import PropertyOptionIcon from './PropertyOptionIcon';

const meta = {
  title: '페이지/매물 메모/PropertyOptionIcon',
  component: PropertyOptionIcon,
  argTypes: {
    option: {
      control: 'select',
      options: PROPERTY_OPTIONS.map((option) => option.key),
      description: '아이콘을 보여 줄 방 옵션 키.',
    },
  },
  args: {
    option: 'AIR_CONDITIONER',
  },
} satisfies Meta<typeof PropertyOptionIcon>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** 모든 방 옵션 아이콘을 한눈에 본다. 목록 전체를 그리므로 컨트롤은 쓰지 않는다. */
export const AllOptions: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => (
    <ul
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 5rem)',
        gap: '1rem',
        listStyle: 'none',
        margin: 0,
        padding: 0,
      }}
    >
      {PROPERTY_OPTIONS.map((option) => (
        <li key={option.key} style={{ display: 'grid', justifyItems: 'center', gap: '0.25rem' }}>
          <PropertyOptionIcon option={option.key} />
          <span>{option.label}</span>
        </li>
      ))}
    </ul>
  ),
};
