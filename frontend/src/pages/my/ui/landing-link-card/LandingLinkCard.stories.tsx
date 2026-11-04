import type { Meta, StoryObj } from '@storybook/react-webpack5';

import LandingLinkCard from './LandingLinkCard';

const meta = {
  title: '페이지/마이/공통/LandingLinkCard',
  component: LandingLinkCard,
  decorators: [
    (Story) => (
      <div style={{ width: '24rem' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof LandingLinkCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
