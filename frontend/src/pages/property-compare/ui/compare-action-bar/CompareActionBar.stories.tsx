import type { Meta, StoryObj } from '@storybook/react-webpack5';

import CompareActionBar from './CompareActionBar';

const meta = {
  title: '페이지/방 비교/CompareActionBar',
  component: CompareActionBar,
  args: {
    selectedCount: 3,
    isExporting: false,
    onDownload: () => undefined,
  },
  decorators: [
    (Story) => (
      <div style={{ width: '24rem' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CompareActionBar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Ready: Story = {};

export const NeedMoreSelection: Story = {
  args: {
    selectedCount: 1,
  },
};

export const Exporting: Story = {
  args: {
    isExporting: true,
  },
};
