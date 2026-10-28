import type { Meta, StoryObj } from '@storybook/react-webpack5';

import type { NearbyPlace } from '@/features/map/model/Map';

import MapNearbySheet from './MapNearbySheet';

const places: NearbyPlace[] = [
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
    providerPlaceId: 'story-convenience-1',
    name: 'GS25 상수역점',
    category: 'CONVENIENCE',
    address: '서울특별시 마포구 독막로 72',
    latitude: 37.5476,
    longitude: 126.9232,
    distanceMeters: 180,
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
];

const meta = {
  title: '페이지/주변 분석/MapNearbySheet',
  component: MapNearbySheet,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div style={{ position: 'relative', height: '36rem', maxWidth: '24rem', background: '#eef0ea' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    eyebrow: '햇살 좋은 원룸',
    heading: '선택한 매물 주변 2km',
    counts: { HOSPITAL: 12, TRANSPORT: 8, SCHOOL: 3, CONVENIENCE: 21, AGENCY: 6 },
    selectedCategories: ['HOSPITAL', 'CONVENIENCE', 'SCHOOL'],
    places,
    expanded: false,
    onToggleExpanded: () => undefined,
    onToggleCategory: () => undefined,
  },
} satisfies Meta<typeof MapNearbySheet>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Expanded: Story = {
  args: {
    expanded: true,
  },
};

export const NoCategorySelected: Story = {
  args: {
    expanded: true,
    selectedCategories: [],
    places: [],
  },
};

export const NoPlaces: Story = {
  args: {
    expanded: true,
    counts: { HOSPITAL: 0, TRANSPORT: 0, SCHOOL: 0, CONVENIENCE: 0, AGENCY: 0 },
    selectedCategories: ['HOSPITAL'],
    places: [],
  },
};
