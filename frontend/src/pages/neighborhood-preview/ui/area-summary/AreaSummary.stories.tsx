import type { Meta, StoryObj } from '@storybook/react-webpack5';

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
  title: '페이지/동네 찾기/AreaSummary',
  component: AreaSummary,
  decorators: [
    (Story) => (
      <div style={{ width: '24rem' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    area,
    selectedStopId: 'BS_TAGO_11440001',
    onSelectStation: () => undefined,
    onOpenListing: () => undefined,
  },
} satisfies Meta<typeof AreaSummary>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithoutRent: Story = {
  args: {
    area: { ...area, rent: null },
    selectedStopId: null,
  },
};
