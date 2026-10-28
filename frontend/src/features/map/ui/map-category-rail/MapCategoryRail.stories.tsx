import type { Meta, StoryObj } from '@storybook/react-webpack5';

import MapCategoryRail from './MapCategoryRail';

const meta = {
  title: '기능/지도/MapCategoryRail',
  component: MapCategoryRail,
  args: {
    selectedCategories: [],
    onToggle: () => undefined,
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
