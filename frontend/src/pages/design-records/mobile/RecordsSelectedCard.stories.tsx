import type { Meta, StoryObj } from '@storybook/react-webpack5';

import type { PropertySummary } from '@/features/property/model/Property';

import { recordPresentation } from '../model/recordPresentation';
import RecordsSelectedCard from './RecordsSelectedCard';

const property = (name: string, depositAmount: number, monthlyRentAmount: number): PropertySummary => ({
  propertyId: 1,
  name,
  depositAmount,
  monthlyRentAmount,
  discoverySource: { type: 'TEXT', value: '직방' },
  location: { address: '서울 강남구 역삼동 823-12', latitude: 37.5006, longitude: 127.0364 },
  representativePhoto: null,
  progress: {
    totalCount: 0,
    completedCount: 0,
    goodCount: 0,
    cautionCount: 0,
    unconfirmedCount: 0,
    progressRate: 0,
  },
  stages: [],
  photoCount: 0,
});

const meta = {
  title: '페이지/본 방 기록/RecordsSelectedCard',
  component: RecordsSelectedCard,
  args: {
    record: recordPresentation(property('역삼역 햇살 원룸', 10_000_000, 650_000)),
    onClose: () => undefined,
  },
  argTypes: {
    record: { control: false },
  },
  decorators: [
    (Story) => (
      // 지도 아래쪽에 떠 있는 카드라서 휴대폰 지도 크기의 칸 안에 둔다.
      <div style={{ position: 'relative', width: '24rem', height: '14rem', background: '#e8efe4' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof RecordsSelectedCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Jeonse: Story = {
  args: {
    record: recordPresentation(property('신림 전세 오피스텔', 150_000_000, 0)),
  },
};

export const LongName: Story = {
  args: {
    record: recordPresentation(
      property('역삼역 도보 5분 남향 햇살 가득 풀옵션 원룸 (관리비 포함)', 10_000_000, 650_000),
    ),
  },
};
