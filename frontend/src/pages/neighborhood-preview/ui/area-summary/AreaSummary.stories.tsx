import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { fn } from 'storybook/test';

import type { NeighborhoodPreviewContext } from '../../hooks/useNeighborhoodPreview';
import AreaSummary from './AreaSummary';

type Area = NonNullable<NeighborhoodPreviewContext['selected']>;

const area: Area = {
  adminDongCode: '1144069000',
  name: '망원1동',
  fullName: '서울특별시 마포구 망원1동',
  commuteMinutes: 32,
  center: { latitude: 37.5559, longitude: 126.9019 },
  polygons: [],
  simplifiedPolygons: undefined,
  stations: [
    {
      stopId: 'BS_TAGO_11440001',
      stopName: '망원역',
      travelMinutes: 32,
      direction: '합정역 방면',
      latitude: 37.5561,
      longitude: 126.9101,
    },
    {
      stopId: 'BS_TAGO_11440002',
      stopName: '망원시장',
      travelMinutes: 36,
      direction: null,
      latitude: 37.5563,
      longitude: 126.9058,
    },
  ],
  rent: { monthlyRentKrw: 620000, depositKrw: 10000000, transactionCount: 27, legalDongNames: ['망원동'] },
};

const meta = {
  title: '페이지/동네 찾기/공통/AreaSummary',
  component: AreaSummary,
  decorators: [
    (Story) => (
      <div style={{ width: '24rem' }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    area: { control: 'object', description: '선택한 동네. rent가 null이면 시세 대신 거래가 적다는 안내를 보여준다.' },
    selectedStopId: {
      control: 'select',
      options: ['BS_TAGO_11440001', 'BS_TAGO_11440002', '선택 안 함'],
      mapping: { '선택 안 함': null },
      description: '경로를 보고 있는 출발 정류장',
    },
    onSelectStation: { description: '출발 정류장 고르기' },
    onOpenListing: { description: '매물 보기 열기' },
    showsStations: { control: 'boolean', description: '지도 레일에서 교통을 켜 출발 정류장 목록을 보여 줄지' },
  },
  args: {
    area,
    selectedStopId: 'BS_TAGO_11440001',
    onSelectStation: fn(),
    onOpenListing: fn(),
    showsStations: false,
    selectedCategory: null,
    onSelectCategory: fn(),
    preview: {
      destination: { latitude: 37.5559, longitude: 126.9101, name: '망원역', address: '서울 마포구' },
      isPublicExplore: false,
      openPropertyCommute: () => true,
    },
  },
} satisfies Meta<typeof AreaSummary>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** 지도 레일에서 교통을 켜면 그 동네의 출발 정류장을 고른다. */
export const Stations: Story = {
  args: { showsStations: true },
};

export const WithoutRent: Story = {
  args: {
    area: { ...area, rent: null },
    selectedStopId: null,
  },
};
