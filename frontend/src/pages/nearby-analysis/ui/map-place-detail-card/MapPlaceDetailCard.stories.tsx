import type { Meta, StoryObj } from '@storybook/react-webpack5';

import MapPlaceDetailCard from './MapPlaceDetailCard';

const meta = {
  title: '페이지/주변 분석/MapPlaceDetailCard',
  component: MapPlaceDetailCard,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div style={{ position: 'relative', height: '16rem', maxWidth: '24rem', background: '#eef0ea' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    place: {
      providerPlaceId: 'story-hospital-1',
      name: '상수연세내과의원',
      category: 'HOSPITAL',
      address: '서울특별시 마포구 독막로 88',
      latitude: 37.5478,
      longitude: 126.9221,
      distanceMeters: 320,
    },
    avoidControls: false,
    onClose: () => undefined,
  },
} satisfies Meta<typeof MapPlaceDetailCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const BusStopWithoutAddress: Story = {
  args: {
    place: {
      providerPlaceId: 'story-bus-1',
      name: '상수역.홍익대학교',
      category: 'TRANSPORT',
      address: '',
      latitude: 37.5481,
      longitude: 126.9228,
      distanceMeters: 140,
    },
  },
};

export const AvoidControls: Story = {
  args: {
    avoidControls: true,
  },
};
