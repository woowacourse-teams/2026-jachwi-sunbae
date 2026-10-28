import type { Meta, StoryObj } from '@storybook/react-webpack5';

import QuickMenu from './QuickMenu';

const meta = {
  title: '페이지/홈/공통/QuickMenu',
  component: QuickMenu,
  decorators: [
    (Story) => (
      <div style={{ width: '24rem' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof QuickMenu>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
