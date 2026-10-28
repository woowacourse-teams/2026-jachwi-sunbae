import type { Meta, StoryObj } from '@storybook/react-webpack5';

import GuideCard from './GuideCard';

const meta = {
  title: '페이지/홈/GuideCard',
  component: GuideCard,
  decorators: [
    (Story) => (
      <div style={{ width: '22rem' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof GuideCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
