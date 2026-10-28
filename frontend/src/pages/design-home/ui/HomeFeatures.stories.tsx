import type { Meta, StoryObj } from '@storybook/react-webpack5';

import HomeFeatures from './HomeFeatures';

const meta = {
  title: '페이지/홈/HomeFeatures',
  component: HomeFeatures,
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '40rem' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof HomeFeatures>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
