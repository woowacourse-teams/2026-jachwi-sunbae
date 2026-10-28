import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { fn } from 'storybook/test';

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
  argTypes: {
    isPropertyPending: { description: '매물(중심 좌표)을 불러오는 중인지' },
    isNearbyPending: { description: '주변 시설을 불러오는 중인지' },
    isNearbyError: { description: '주변 시설을 불러오지 못했는지. 다시 시도 버튼이 나온다.' },
    onRetry: { description: '주변 시설 다시 불러오기' },
  },
  args: {
    isPropertyPending: false,
    isNearbyPending: false,
    isNearbyError: false,
    onRetry: fn(),
  },
} satisfies Meta<typeof NearbyMapNotice>;

export default meta;

type Story = StoryObj<typeof meta>;

export const PropertyPending: Story = {
  argTypes: {
    isPropertyPending: { description: '매물(중심 좌표)을 불러오는 중인지' },
    isNearbyPending: { description: '주변 시설을 불러오는 중인지' },
    isNearbyError: { description: '주변 시설을 불러오지 못했는지. 다시 시도 버튼이 나온다.' },
    onRetry: { description: '주변 시설 다시 불러오기' },
  },
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
