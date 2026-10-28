import type { Meta, StoryObj } from '@storybook/react-webpack5';

import HomeHeader from './HomeHeader';

const meta = {
  title: '페이지/홈/HomeHeader',
  component: HomeHeader,
  decorators: [
    (Story) => (
      <div style={{ width: '24rem' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof HomeHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
