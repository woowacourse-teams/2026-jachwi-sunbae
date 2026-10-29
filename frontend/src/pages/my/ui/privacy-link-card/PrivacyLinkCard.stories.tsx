import type { Meta, StoryObj } from '@storybook/react-webpack5';

import PrivacyLinkCard from './PrivacyLinkCard';

const meta = {
  title: '페이지/마이/공통/PrivacyLinkCard',
  component: PrivacyLinkCard,
  decorators: [
    (Story) => (
      <div style={{ width: '24rem' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PrivacyLinkCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
