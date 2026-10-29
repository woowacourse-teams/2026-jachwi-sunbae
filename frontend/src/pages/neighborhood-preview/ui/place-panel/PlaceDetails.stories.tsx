import type { Meta, StoryObj } from '@storybook/react-webpack5';

import type { CommuteRoute } from '@/features/map/api/commuteRouteApi';

import type { NeighborhoodPlace } from '../../hooks/useNeighborhoodPlaces';
import PlaceDetails from './PlaceDetails';

const API_BASE_URL = 'http://localhost:8080';

const preview = {
  destination: {
    name: '서울특별시청',
    address: '서울특별시 중구 세종대로 110',
    latitude: 37.5663,
    longitude: 126.9779,
  },
  maxMinutes: 40,
  maxTransfers: 1,
};

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

const routeQueryKey = (stopId: string) => [
  'commute-route',
  API_BASE_URL,
  preview.destination.latitude,
  preview.destination.longitude,
  stopId,
  preview.maxMinutes,
  preview.maxTransfers,
];

const busStopPlace: NeighborhoodPlace = {
  kind: 'busStop',
  busStop: { nodeId: '11440001', name: '망원역', latitude: 37.5561, longitude: 126.9101, distanceMeters: 120 },
};

const stationPlace: NeighborhoodPlace = {
  kind: 'station',
  station: { stopId: 'BS_TAGO_11440002', name: '망원시장', latitude: 37.5559, longitude: 126.9063 },
};

const agencyPlace: NeighborhoodPlace = {
  kind: 'agency',
  agency: {
    providerPlaceId: 'story-agency-1',
    name: '망원행복공인중개사사무소',
    address: '서울특별시 마포구 포은로 85',
    latitude: 37.5552,
    longitude: 126.9033,
    distanceMeters: 210,
    phone: '02-332-1234',
    placeUrl: 'https://place.map.kakao.com/123456789',
  },
};

const routeQueryData = [
  [routeQueryKey('BS_TAGO_11440001'), route],
  [routeQueryKey('BS_TAGO_11440002'), route],
];

const meta = {
  title: '페이지/동네 찾기/공통/PlaceDetails',
  component: PlaceDetails,
  parameters: {
    queryData: routeQueryData,
  },
  decorators: [
    (Story) => (
      <div style={{ width: '24rem' }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    place: {
      control: 'object',
      description: '지도에서 고른 장소. kind가 busStop·station이면 경로를, agency면 연락처를 보여준다.',
    },
    preview: {
      control: 'object',
      description: '목적지와 통근 조건. 바꾸면 미리 넣어 둔 경로 데이터와 키가 달라져 불러오는 중으로 보인다.',
    },
    phoneAction: { control: 'inline-radio', options: ['call', 'copy'] },
  },
  args: {
    place: busStopPlace,
    preview,
    phoneAction: 'copy',
  },
} satisfies Meta<typeof PlaceDetails>;

export default meta;

type Story = StoryObj<typeof meta>;

export const BusStopRoute: Story = {};

export const Station: Story = {
  args: {
    place: stationPlace,
  },
};

export const AgencyCopyPhone: Story = {
  args: {
    place: agencyPlace,
  },
};

export const AgencyCallPhone: Story = {
  args: {
    place: agencyPlace,
    phoneAction: 'call',
  },
};

export const AgencyWithoutContact: Story = {
  args: {
    place: {
      kind: 'agency',
      agency: {
        providerPlaceId: 'story-agency-2',
        name: '망원스마일부동산',
        address: '서울특별시 마포구 망원로 42',
        latitude: 37.5569,
        longitude: 126.9046,
        distanceMeters: 340,
        phone: null,
        placeUrl: null,
      },
    },
  },
};
