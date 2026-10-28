import type { Meta, StoryObj } from '@storybook/react-webpack5';

import type { CommuteRoute } from '@/features/map/api/commuteRouteApi';

import type { NeighborhoodPreviewContext } from '../../hooks/useNeighborhoodPreview';
import RouteDetailBody from './RouteDetailBody';

const destination = {
  name: '서울특별시청',
  address: '서울특별시 중구 세종대로 110',
  latitude: 37.5663,
  longitude: 126.9779,
};

type Area = NonNullable<NeighborhoodPreviewContext['selected']>;

const area: Area = {
  adminDongCode: '1144069000',
  name: '망원1동',
  fullName: '서울특별시 마포구 망원1동',
  commuteMinutes: 34,
  center: { latitude: 37.5559, longitude: 126.9019 },
  polygons: [],
  simplifiedPolygons: undefined,
  stations: [
    {
      stopId: 'BS_TAGO_11440001',
      stopName: '망원역',
      travelMinutes: 34,
      direction: '합정역 방면',
      latitude: 37.5561,
      longitude: 126.9101,
    },
  ],
  rent: { monthlyRentKrw: 620000, depositKrw: 10000000, transactionCount: 27, legalDongNames: ['망원동', '합정동'] },
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

const noop = () => undefined;
const noopAsync = () => Promise.resolve();
const noopRefetch = () => Promise.resolve({} as never);

/** 동네 상세 화면이 상위에서 받는 상태. 이 본문이 읽는 값만 의미 있게 채우고 나머지는 기본값이다. */
const preview: NeighborhoodPreviewContext = {
  isPublicExplore: false,
  mapPath: '/neighborhoods',
  maxRent: 0,
  changeMaxRent: noop,
  rentPeriod: { startDate: '2026-04-01', endDate: '2026-09-30' },
  currentPosition: null,
  isLocating: false,
  locationError: null,
  moveToCurrentLocation: noopAsync,
  missingBoundaryCount: 0,
  topAreas: [area],
  selectedStation: area.stations[0],
  route,
  isRouteLoading: false,
  routeError: null,
  retryRoute: noopRefetch,
  isMockData: false,
  leave: noop,
  isChoosingConditions: false,
  editLocation: noop,
  startAnalysis: noop,
  selectionCenter: destination,
  selectionLevel: 6,
  rememberResultCenter: noop,
  rememberResultLevel: noop,
  query: '',
  addressResults: [],
  isSearching: false,
  searchError: null,
  selectAddress: noop,
  changeQuery: noop,
  searchDestination: noopAsync,
  shouldFocusMapSearch: false,
  openMapSearch: noop,
  destination,
  mapCandidate: destination,
  hasChosenMapPoint: true,
  isSelectingOnMap: false,
  openMapSelection: noop,
  chooseMapPoint: noop,
  confirmMapPoint: noop,
  hasPickedDestination: true,
  isAnalyzing: false,
  error: null,
  retry: noopRefetch,
  maxMinutes: 40,
  isValidCommuteTime: true,
  changeMaxMinutes: noop,
  maxTransfers: 1,
  changeMaxTransfers: noop,
  resultLevel: 7,
  center: area.center,
  reset: noop,
  regions: [],
  selected: area,
  selectRegion: noop,
  selectStation: noop,
  openAreaDetails: noop,
  closeAreaDetails: noop,
  openListing: () => true,
};

const meta = {
  title: '페이지/동네 찾기/RouteDetailBody',
  component: RouteDetailBody,
  decorators: [
    (Story) => (
      <div style={{ width: '24rem' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    preview,
    area,
  },
} satisfies Meta<typeof RouteDetailBody>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const RouteLoading: Story = {
  args: {
    preview: { ...preview, route: undefined, isRouteLoading: true },
  },
};

export const WithoutRent: Story = {
  args: {
    preview: {
      ...preview,
      rentPeriod: null,
      routeError: '경로를 불러오지 못했어요. 다른 정류장을 선택해 보세요.',
      route: undefined,
    },
    area: { ...area, rent: null },
  },
};
