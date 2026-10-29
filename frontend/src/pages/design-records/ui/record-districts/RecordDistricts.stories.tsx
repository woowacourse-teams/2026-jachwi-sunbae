import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { fn } from 'storybook/test';

import RecordDistricts from './RecordDistricts';

const districts = ['전체', '역삼동', '서교동', '신림동', '삼평동'];

const meta = {
  title: '페이지/본 방 기록/공통/RecordDistricts',
  component: RecordDistricts,
  args: {
    districts,
    district: '전체',
    overMap: false,
    onSelect: fn(),
  },
  argTypes: {
    districts: { control: 'object', description: '뱃지로 보여 줄 동네 이름 목록' },
    district: { control: 'select', options: districts, description: '지금 고른 동네' },
    onSelect: { description: '뱃지를 누르면 그 동네 이름으로 부른다.' },
  },
  decorators: [
    (Story) => (
      <div style={{ width: '24rem' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof RecordDistricts>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const DistrictSelected: Story = {
  args: {
    district: '서교동',
  },
};

export const OverMap: Story = {
  args: {
    overMap: true,
  },
  decorators: [
    (Story) => (
      // 지도 위에 뜬 모습을 보이도록 지도 바탕색과 비슷한 배경을 깐다.
      <div style={{ padding: '1rem 0', background: '#e8efe4' }}>
        <Story />
      </div>
    ),
  ],
};
