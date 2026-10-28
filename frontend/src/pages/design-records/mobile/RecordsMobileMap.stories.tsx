import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { useState } from 'react';

import { propertyQueryKeys } from '@/features/property/api/propertyQueryKeys';
import type { PropertyChecklistProgress, PropertyPage, PropertySummary } from '@/features/property/model/Property';

import useRecords from '../hooks/useRecords';
import useRecordsAddMode from '../hooks/useRecordsAddMode';
import useRecordsMapLayers from '../hooks/useRecordsMapLayers';
import RecordsMobileMap from './RecordsMobileMap';

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
  latitude: number,
  longitude: number,
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
];

/** 지도에 넘기는 기록·지도 겹·추가 모드 상태는 화면과 같은 Hook으로 만든다. 기록 목록은 `parameters.queryData`로 넣는다. */
const RecordsMobileMapPreview = ({ initialSelectedId = null }: { initialSelectedId?: string | null }) => {
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId);
  const records = useRecords({ selectedId, setSelectedId });
  const layers = useRecordsMapLayers(records, { initialCategory: 'MEMO' });
  const addMode = useRecordsAddMode();
  return <RecordsMobileMap records={records} layers={layers} addMode={addMode} onAddProperty={() => undefined} />;
};

const meta: Meta<typeof RecordsMobileMap> = {
  title: '페이지/본 방 기록/RecordsMobileMap',
  component: RecordsMobileMap,
  render: () => <RecordsMobileMapPreview />,
  parameters: {
    layout: 'fullscreen',
    queryData: [[propertyQueryKeys.list(''), listData(properties)]],
  },
  decorators: [
    (Story) => (
      // 휴대폰 화면 크기의 세로 칸 안에 지도를 채운다.
      <div style={{ display: 'flex', flexDirection: 'column', width: '24rem', height: '44rem' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof RecordsMobileMap>;

export const Default: Story = {};

export const Empty: Story = {
  parameters: {
    queryData: [[propertyQueryKeys.list(''), listData([])]],
  },
};

export const WithSelectedRecord: Story = {
  render: () => <RecordsMobileMapPreview initialSelectedId="1" />,
};
