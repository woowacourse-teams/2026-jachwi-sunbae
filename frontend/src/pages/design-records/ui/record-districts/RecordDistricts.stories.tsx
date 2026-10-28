import type { Meta, StoryObj } from '@storybook/react-webpack5';

import RecordDistricts from './RecordDistricts';

const meta = {
  title: '페이지/본 방 기록/RecordDistricts',
  component: RecordDistricts,
  args: {
    districts: ['전체', '역삼동', '서교동', '신림동', '삼평동'],
    district: '전체',
    overMap: false,
    onSelect: () => undefined,
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
