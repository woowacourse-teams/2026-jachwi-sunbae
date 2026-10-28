import type { Meta, StoryObj } from '@storybook/react-webpack5';

import type { NearbyResult } from '@/features/map/model/Map';

import NearbyStage from './NearbyStage';

const API_BASE_URL = 'http://localhost:8080';
const center = { latitude: 37.5509, longitude: 126.9227 };

const nearbyResult: NearbyResult = {
  center,
  radius: 2000,
  counts: { HOSPITAL: 2, SCHOOL: 1, CONVENIENCE: 2, AGENCY: 1 },
  places: [
    {
      providerPlaceId: 'story-hospital-1',
      name: '상수연세내과의원',
      category: 'HOSPITAL',
      address: '서울특별시 마포구 독막로 88',
      latitude: 37.5478,
      longitude: 126.9221,
      distanceMeters: 320,
    },
    {
      providerPlaceId: 'story-hospital-2',
      name: '합정튼튼정형외과',
      category: 'HOSPITAL',
      address: '서울특별시 마포구 양화로 45',
      latitude: 37.5492,
      longitude: 126.9142,
      distanceMeters: 790,
    },
    {
      providerPlaceId: 'story-convenience-1',
      name: 'GS25 상수역점',
      category: 'CONVENIENCE',
      address: '서울특별시 마포구 독막로 72',
      latitude: 37.5476,
      longitude: 126.9232,
      distanceMeters: 180,
    },
    {
      providerPlaceId: 'story-convenience-2',
      name: 'CU 와우산로점',
      category: 'CONVENIENCE',
      address: '서울특별시 마포구 와우산로 61',
      latitude: 37.5521,
      longitude: 126.9249,
      distanceMeters: 240,
    },
    {
      providerPlaceId: 'story-school-1',
      name: '서울서강초등학교',
      category: 'SCHOOL',
      address: '서울특별시 마포구 서강로 5',
      latitude: 37.5525,
      longitude: 126.9301,
      distanceMeters: 860,
    },
    {
      providerPlaceId: 'story-agency-1',
      name: '상수행복공인중개사사무소',
      category: 'AGENCY',
      address: '서울특별시 마포구 와우산로 90',
      latitude: 37.5507,
      longitude: 126.9224,
      distanceMeters: 60,
    },
  ],
};

const busStops = {
  center,
  radius: 2000,
  count: 2,
  busStops: [
    { nodeId: 'story-bus-1', name: '상수역.홍익대학교', latitude: 37.5481, longitude: 126.9228, distanceMeters: 140 },
    { nodeId: 'story-bus-2', name: '서강동주민센터', latitude: 37.5534, longitude: 126.9268, distanceMeters: 470 },
  ],
};

const meta = {
  title: '페이지/주변 분석/NearbyStage',
  component: NearbyStage,
  parameters: {
    layout: 'fullscreen',
    queryData: [
      [['nearby-facilities', API_BASE_URL, center.latitude, center.longitude, 2000], nearbyResult],
      [['bus-stops', API_BASE_URL, center.latitude, center.longitude, 2000], busStops],
    ],
  },
  decorators: [
    (Story) => (
      <div style={{ height: '40rem', maxWidth: '26rem' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    subjectId: 10,
    center,
    headingPrefix: '햇살 좋은 원룸',
    label: '매물 주변 시설 지도',
    isSubjectPending: false,
  },
} satisfies Meta<typeof NearbyStage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithInitialCategories: Story = {
  args: {
    subjectId: 'sangsu',
    markerLabel: '상수동',
    headingPrefix: '상수동',
    label: '동네 주변 시설 지도',
    initialCategories: ['HOSPITAL', 'CONVENIENCE', 'TRANSPORT'],
  },
};

export const SubjectPending: Story = {
  args: {
    center: null,
    isSubjectPending: true,
  },
};
