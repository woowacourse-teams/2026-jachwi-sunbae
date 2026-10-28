import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { fn } from 'storybook/test';

import type { MapMarker } from '../../model/Map';
import type { MapRegion } from '../../model/MapCanvas';
import MapCanvas from './MapCanvas';

const center = { latitude: 37.4842, longitude: 126.9297 };

const sampleMarkers: MapMarker[] = [
  {
    id: 'property-1',
    latitude: 37.4852,
    longitude: 126.9277,
    label: '햇살 좋은 원룸',
    caption: '햇살 좋은 원룸',
    tone: 'property',
  },
  {
    id: 'property-2',
    latitude: 37.4828,
    longitude: 126.9321,
    label: '신림역 투룸',
    caption: '신림역 투룸',
    tone: 'property',
  },
  { id: 'hospital-1', latitude: 37.4861, longitude: 126.9331, label: '신림 내과', tone: 'place', category: 'HOSPITAL' },
  {
    id: 'convenience-1',
    latitude: 37.4822,
    longitude: 126.9262,
    label: '편의점',
    tone: 'place',
    category: 'CONVENIENCE',
  },
  { id: 'current', latitude: 37.4842, longitude: 126.9297, label: '현재 위치', tone: 'current' },
];

const square = (lat: number, lng: number, size: number) => [
  [
    { latitude: lat + size, longitude: lng - size },
    { latitude: lat + size, longitude: lng + size },
    { latitude: lat - size, longitude: lng + size },
    { latitude: lat - size, longitude: lng - size },
  ],
];

const sampleRegions: MapRegion[] = [
  {
    id: 'sillim',
    name: '신림동',
    isRecommended: true,
    summary: { travel: '23분', price: '55만' },
    center: { latitude: 37.4855, longitude: 126.9265 },
    paths: square(37.4855, 126.9265, 0.0035),
  },
  {
    id: 'bongcheon',
    name: '봉천동',
    isRecommended: false,
    summary: { travel: '31분', price: '48만' },
    center: { latitude: 37.4825, longitude: 126.9335 },
    paths: square(37.4825, 126.9335, 0.0035),
  },
];

const meta = {
  title: '기능/지도/MapCanvas',
  component: MapCanvas,
  args: {
    center,
    level: 15,
    interactive: false,
    showCenterPin: false,
    showRadiusLabels: false,
    hideLoading: false,
    onSelectMarker: fn(),
    onSelectLocation: fn(),
    onCenterChange: fn(),
    onLevelChange: fn(),
    onBoundsChange: fn(),
    onSelectRegion: fn(),
  },
  argTypes: {
    center: { control: 'object', description: '지도 가운데 좌표' },
    level: { control: { type: 'range', min: 6, max: 21, step: 1 }, description: '확대 단계. 클수록 가깝다.' },
    interactive: { description: '끌기·확대와 지도 찍기를 받는다.' },
    showCenterPin: { description: '가운데 고정 핀을 그린다(위치 고르기 화면).' },
    showRadiusLabels: { description: '반경 원에 거리 이름표를 붙인다.' },
    selectedMarkerId: { control: 'text', description: '강조할 마커 ID' },
    selectedRegionId: { control: 'text', description: '강조할 구역 ID' },
    markers: { control: 'object', description: '지도 위 마커 목록' },
    circles: { control: 'object', description: '반경 원 목록(500·1000·2000m)' },
    regions: { control: false },
    coordinateMenu: { control: false },
    coordinateAction: { control: false },
    radiusCenter: { control: 'object', description: '반경 원의 중심. 없으면 center를 쓴다.' },
    customStyleId: { control: 'text' },
  },
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div style={{ height: '28rem' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MapCanvas>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    markers: sampleMarkers,
  },
};

export const WithRadius: Story = {
  args: {
    markers: sampleMarkers,
    circles: [
      { radiusMeters: 500, label: '500m' },
      { radiusMeters: 1000, label: '1km' },
    ],
    showRadiusLabels: true,
  },
};

export const WithCoordinateMenu: Story = {
  args: {
    interactive: true,
    coordinateMenu: {
      latitude: 37.4842,
      longitude: 126.9297,
      actions: [
        { id: 'memo', label: '거리 메모 남기기', onSelect: fn() },
        { id: 'nearby', label: '주변 시설 보기', onSelect: fn() },
      ],
      onClose: fn(),
    },
  },
};

export const CenterPin: Story = {
  args: {
    showCenterPin: true,
    interactive: true,
  },
};

export const WithRegions: Story = {
  args: {
    regions: sampleRegions,
    selectedRegionId: 'sillim',
  },
};
