import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { fn } from 'storybook/test';

import MapCategoryRail from './MapCategoryRail';

const meta = {
  title: '기능/지도/MapCategoryRail',
  component: MapCategoryRail,
  args: {
    selectedCategories: [],
    showMemo: false,
    onToggle: fn(),
  },
  argTypes: {
    selectedCategories: {
      control: 'check',
      options: ['HOSPITAL', 'TRANSPORT', 'SCHOOL', 'CONVENIENCE', 'AGENCY', 'MEMO'],
      description: '켜 둔 시설 종류',
    },
    counts: { control: 'object', description: '종류별 개수. 켜 둔 탭 옆에 숫자로 보인다.' },
    onToggle: { description: '탭을 눌렀을 때. 누른 종류를 넘긴다.' },
  },
  decorators: [
    (Story) => (
      <div style={{ position: 'relative', width: '20rem', height: '20rem', background: '#e9e5d8' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MapCategoryRail>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Selected: Story = {
  args: {
    selectedCategories: ['HOSPITAL'],
    counts: { HOSPITAL: 12, CONVENIENCE: 8 },
  },
};

export const WithMemo: Story = {
  args: {
    selectedCategories: ['MEMO'],
    showMemo: true,
  },
};
