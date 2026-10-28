import type { Meta, StoryObj } from '@storybook/react-webpack5';

import type { ChecklistStage } from '@/features/checklist/model/checklistTypes';
import type {
  PropertyChecklistProgress,
  PropertyChecklistStageSummary,
  PropertySummary,
} from '@/features/property/model/Property';

import ComparePropertyOption from './ComparePropertyOption';

const progress = (completedCount: number, totalCount: number): PropertyChecklistProgress => ({
  totalCount,
  completedCount,
  goodCount: completedCount,
  cautionCount: 0,
  unconfirmedCount: totalCount - completedCount,
  progressRate: totalCount === 0 ? 0 : Math.floor((completedCount / totalCount) * 100),
});

const stage = (
  propertyId: number,
  name: ChecklistStage,
  counts: [number, number] | null,
): PropertyChecklistStageSummary => ({
  stage: name,
  applied: counts !== null,
  propertyChecklistId: counts ? propertyId * 10 + (name === 'ON_SITE' ? 1 : 2) : null,
  checklistName: counts ? (name === 'ON_SITE' ? '현장 체크리스트' : '계약 전 체크리스트') : null,
  sourceChecklistId: counts ? 1 : null,
  progress: counts ? progress(counts[0], counts[1]) : progress(0, 0),
});

const property = (
  propertyId: number,
  name: string,
  depositAmount: number,
  monthlyRentAmount: number,
  source: string,
  onSite: [number, number] | null,
  preContract: [number, number] | null = null,
): PropertySummary => ({
  propertyId,
  name,
  depositAmount,
  monthlyRentAmount,
  discoverySource: { type: source.startsWith('http') ? 'URL' : 'TEXT', value: source },
  location: { address: null, latitude: null, longitude: null },
  representativePhoto: null,
  progress: onSite ? progress(onSite[0], onSite[1]) : progress(0, 0),
  stages: [stage(propertyId, 'ON_SITE', onSite), stage(propertyId, 'PRE_CONTRACT', preContract)],
  photoCount: 0,
});

const meta = {
  title: '페이지/방 비교/ComparePropertyOption',
  component: ComparePropertyOption,
  args: {
    property: property(1, '역삼역 햇살 원룸', 10_000_000, 650_000, '직방', [8, 12]),
    isSelected: false,
    isDisabled: false,
    onToggle: () => undefined,
  },
  argTypes: {
    property: { control: false },
  },
  decorators: [
    (Story) => (
      <div style={{ width: '24rem' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ComparePropertyOption>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Selected: Story = {
  args: {
    isSelected: true,
    property: property(2, '홍대 투룸 복층', 20_000_000, 850_000, '네이버 부동산', [12, 12], [3, 10]),
  },
};

export const Disabled: Story = {
  args: {
    isDisabled: true,
  },
};

export const NoChecklist: Story = {
  args: {
    property: property(3, '신림 전세 오피스텔', 150_000_000, 0, '', null),
  },
};
