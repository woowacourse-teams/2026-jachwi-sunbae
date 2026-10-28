import type { Meta, StoryObj } from '@storybook/react-webpack5';

import CompareEmpty from './CompareEmpty';

const meta = {
  title: '페이지/방 비교/CompareEmpty',
  component: CompareEmpty,
  decorators: [
    (Story) => (
      <div style={{ width: '24rem' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CompareEmpty>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
