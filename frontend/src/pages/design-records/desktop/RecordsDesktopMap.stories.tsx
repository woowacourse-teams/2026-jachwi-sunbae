import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { propertyQueryKeys } from '@/features/property/api/propertyQueryKeys';
import type { PropertyChecklistProgress, PropertyPage, PropertySummary } from '@/features/property/model/Property';

import useRecords from '../hooks/useRecords';
import useRecordsMapLayers from '../hooks/useRecordsMapLayers';
import RecordDistricts from '../ui/record-districts/RecordDistricts';
import RecordsDesktopMap from './RecordsDesktopMap';

const emptyProgress: PropertyChecklistProgress = {
  totalCount: 0,
  completedCount: 0,
  goodCount: 0,
  cautionCount: 0,
  unconfirmedCount: 0,
  progressRate: 0,
};

const property = (
  propertyId: number,
  name: string,
  depositAmount: number,
  monthlyRentAmount: number,
  address: string,
  latitude: number | null,
  longitude: number | null,
): PropertySummary => ({
  propertyId,
  name,
  depositAmount,
  monthlyRentAmount,
  discoverySource: { type: 'TEXT', value: '직방' },
  location: { address, latitude, longitude },
  representativePhoto: null,
  progress: emptyProgress,
  stages: [],
  photoCount: 0,
});

const listData = (content: PropertySummary[]): { pages: PropertyPage[]; pageParams: number[] } => ({
  pages: [
    {
      content,
      page: 0,
      size: 20,
      totalElements: content.length,
      totalPages: content.length === 0 ? 0 : 1,
      hasNext: false,
    },
  ],
  pageParams: [0],
});

const properties = [
  property(1, '삼평동 판교역 원룸', 10_000_000, 700_000, '경기 성남시 분당구 삼평동 680', 37.3948, 127.1112),
  property(2, '백현동 투룸', 20_000_000, 900_000, '경기 성남시 분당구 백현동 541', 37.3896, 127.1076),
  property(3, '이매동 전세 오피스텔', 180_000_000, 0, '경기 성남시 분당구 이매동 125', 37.3955, 127.1275),
];

/** 지도에 넘기는 기록·지도 겹 상태는 화면과 같은 Hook으로 만든다. 기록 목록은 `parameters.queryData`로 넣는다. */
const RecordsDesktopMapPreview = () => {
  const records = useRecords();
  const layers = useRecordsMapLayers(records, { onRegister: () => undefined });
  return (
    <RecordsDesktopMap
      records={records}
      layers={layers}
      districts={
        <RecordDistricts
          districts={records.districts}
          district={records.district}
          onSelect={records.selectDistrict}
          overMap
        />
      }
    />
  );
};

const meta: Meta<typeof RecordsDesktopMap> = {
  title: '페이지/본 방 기록/RecordsDesktopMap',
  component: RecordsDesktopMap,
  render: () => <RecordsDesktopMapPreview />,
  parameters: {
    layout: 'fullscreen',
    queryData: [[propertyQueryKeys.list(''), listData(properties)]],
  },
  decorators: [
    (Story) => (
      <div style={{ display: 'grid', height: '100vh' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof RecordsDesktopMap>;

export const Default: Story = {};

export const Empty: Story = {
  parameters: {
    queryData: [[propertyQueryKeys.list(''), listData([])]],
  },
};

export const WithoutLocation: Story = {
  parameters: {
    queryData: [
      [
        propertyQueryKeys.list(''),
        listData([
          ...properties,
          property(4, '주소만 적은 매물', 5_000_000, 500_000, '서울 관악구 신림동', null, null),
        ]),
      ],
    ],
  },
};
