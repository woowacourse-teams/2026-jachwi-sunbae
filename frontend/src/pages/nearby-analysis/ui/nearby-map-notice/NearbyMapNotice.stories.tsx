import type { Meta, StoryObj } from '@storybook/react-webpack5';

import NearbyMapNotice from './NearbyMapNotice';

const meta = {
  title: '페이지/주변 분석/NearbyMapNotice',
  component: NearbyMapNotice,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div style={{ position: 'relative', height: '12rem', maxWidth: '24rem', background: '#eef0ea' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    isPropertyPending: false,
    isNearbyPending: false,
    isNearbyError: false,
    onRetry: () => undefined,
  },
} satisfies Meta<typeof NearbyMapNotice>;

export default meta;

type Story = StoryObj<typeof meta>;

export const PropertyPending: Story = {
  args: {
    isPropertyPending: true,
  },
};

export const NearbyPending: Story = {
  args: {
    isNearbyPending: true,
  },
};

export const WithError: Story = {
  args: {
    isNearbyError: true,
  },
};
