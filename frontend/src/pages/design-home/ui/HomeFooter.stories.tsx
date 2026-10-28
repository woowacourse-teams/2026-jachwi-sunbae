import type { Meta, StoryObj } from '@storybook/react-webpack5';

import HomeFooter from './HomeFooter';

const meta = {
  title: '페이지/홈/공통/HomeFooter',
  component: HomeFooter,
  args: {
    alignStart: false,
  },
  decorators: [
    (Story) => (
      <div style={{ width: '24rem' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof HomeFooter>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const AlignStart: Story = {
  args: {
    alignStart: true,
  },
  decorators: [
    (Story) => (
      <div style={{ width: '48rem' }}>
        <Story />
      </div>
    ),
  ],
};
