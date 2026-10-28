import type { Meta, StoryObj } from '@storybook/react-webpack5';

import RecordCard from './RecordCard';

const meta = {
  title: '페이지/홈/RecordCard',
  component: RecordCard,
  decorators: [
    (Story) => (
      // 홈에서는 왼쪽 열을 꽉 채우므로 같은 크기의 칸 안에 둔다.
      <div style={{ display: 'grid', width: '14rem', height: '19rem' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof RecordCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
