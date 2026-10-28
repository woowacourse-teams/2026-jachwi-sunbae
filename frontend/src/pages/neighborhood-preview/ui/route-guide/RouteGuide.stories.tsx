import type { Meta, StoryObj } from '@storybook/react-webpack5';

import type { CommuteRoute } from '@/features/map/api/commuteRouteApi';

import RouteGuide from './RouteGuide';

const route: CommuteRoute = {
  totalMinutes: 34,
  transferCount: 1,
  legs: [
    {
      type: 'BUS',
      routeName: '7016',
      minutes: 12,
      waitMinutes: 4,
      points: [
        { stopId: 'BS_TAGO_11440001', name: '망원역', latitude: 37.5561, longitude: 126.9101 },
        { stopId: 'BS_TAGO_11440010', name: '합정역', latitude: 37.5495, longitude: 126.9139 },
        { stopId: 'BS_TAGO_11440020', name: '홍대입구역', latitude: 37.5572, longitude: 126.9245 },
      ],
    },
    {
      type: 'SUBWAY',
      routeName: '2호선',
      minutes: 16,
      waitMinutes: 3,
      points: [
        { stopId: 'SW_239', name: '홍대입구역', latitude: 37.5572, longitude: 126.9245 },
        { stopId: 'SW_240', name: '신촌역', latitude: 37.5552, longitude: 126.9369 },
        { stopId: 'SW_201', name: '시청역', latitude: 37.5657, longitude: 126.9769 },
      ],
    },
    {
      type: 'WALK',
      routeName: null,
      minutes: 6,
      waitMinutes: 0,
      points: [
        { stopId: null, name: '시청역', latitude: 37.5657, longitude: 126.9769 },
        { stopId: null, name: '서울특별시청', latitude: 37.5663, longitude: 126.9779 },
      ],
    },
  ],
};

const meta = {
  title: '페이지/동네 찾기/RouteGuide',
  component: RouteGuide,
  decorators: [
    (Story) => (
      <div style={{ width: '24rem' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    route,
    isLoading: false,
    error: null,
    onRetry: () => undefined,
  },
} satisfies Meta<typeof RouteGuide>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Loading: Story = {
  args: {
    route: undefined,
    isLoading: true,
  },
};

export const WithError: Story = {
  args: {
    route: undefined,
    error: '현재 조건에 맞는 경로를 찾지 못했어요.',
  },
};
