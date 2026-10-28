import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { fn } from 'storybook/test';

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
  argTypes: {
    place: { control: 'object', description: '지도에서 고른 장소. 주소가 비면 `주소 정보 없음`으로 보여준다.' },
    avoidControls: { description: '지도 오른쪽 버튼과 겹치지 않게 카드를 비켜 놓을지' },
    onClose: { description: '카드 닫기' },
  },
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
    onClose: fn(),
  },
} satisfies Meta<typeof MapPlaceDetailCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const BusStopWithoutAddress: Story = {
  argTypes: {
    place: { control: 'object', description: '지도에서 고른 장소. 주소가 비면 `주소 정보 없음`으로 보여준다.' },
    avoidControls: { description: '지도 오른쪽 버튼과 겹치지 않게 카드를 비켜 놓을지' },
    onClose: { description: '카드 닫기' },
  },
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
