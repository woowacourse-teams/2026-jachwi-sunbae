import type { Meta, StoryObj } from '@storybook/react-webpack5';

import RecordListSkeleton from './RecordListSkeleton';

const meta = {
  title: '페이지/본 방 기록/공통/RecordListSkeleton',
  component: RecordListSkeleton,
  decorators: [
    (Story) => (
      <div style={{ width: '24rem' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof RecordListSkeleton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
