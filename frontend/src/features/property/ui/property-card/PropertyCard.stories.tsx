import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { propertyQueryKeys } from '../../api/propertyQueryKeys';
import type { PropertyChecklistProgress, PropertySummary } from '../../model/Property';
import PropertyCard from './PropertyCard';

const samplePhoto = new Blob(
  [
    '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400">' +
      '<rect width="300" height="400" fill="#f1ede2"/><rect x="40" y="50" width="120" height="140" fill="#bcd4f0"/>' +
      '<rect x="20" y="280" width="260" height="80" fill="#c9b79c"/></svg>',
  ],
  { type: 'image/svg+xml' },
);

const progress: PropertyChecklistProgress = {
  totalCount: 12,
  completedCount: 8,
  goodCount: 6,
  cautionCount: 2,
  unconfirmedCount: 4,
  progressRate: 67,
};

const emptyProgress: PropertyChecklistProgress = {
  totalCount: 0,
  completedCount: 0,
  goodCount: 0,
  cautionCount: 0,
  unconfirmedCount: 0,
  progressRate: 0,
};

const sampleProperty: PropertySummary = {
  propertyId: 10,
  name: '햇살 좋은 원룸',
  depositAmount: 10_000_000,
  monthlyRentAmount: 550_000,
  discoverySource: { type: 'TEXT', value: '직방' },
  location: { address: '서울 관악구 신림로 330', latitude: 37.4842, longitude: 126.9297 },
  representativePhoto: { photoId: 1, contentUrl: '/api/properties/10/photos/1/content', contentType: 'image/jpeg' },
  progress,
  stages: [
    {
      stage: 'ON_SITE',
      applied: true,
      propertyChecklistId: 31,
      checklistName: '현장 기본 점검',
      sourceChecklistId: 7,
      progress,
    },
  ],
  photoCount: 3,
};

const meta = {
  title: '기능/매물/PropertyCard',
  component: PropertyCard,
  args: {
    property: sampleProperty,
  },
  argTypes: {
    property: { control: false },
    actions: { control: false },
  },
  parameters: {
    queryData: [[propertyQueryKeys.photoContent(10, 1), samplePhoto]],
  },
  decorators: [
    (Story) => (
      <div style={{ width: '24rem' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PropertyCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithoutPhoto: Story = {
  args: {
    property: { ...sampleProperty, representativePhoto: null, photoCount: 0 },
  },
};

export const ChecklistNotStarted: Story = {
  args: {
    property: {
      ...sampleProperty,
      representativePhoto: null,
      progress: emptyProgress,
      stages: [
        {
          stage: 'ON_SITE',
          applied: false,
          propertyChecklistId: null,
          checklistName: null,
          sourceChecklistId: null,
          progress: emptyProgress,
        },
      ],
    },
  },
};

export const LongText: Story = {
  args: {
    property: {
      ...sampleProperty,
      name: '신림역 도보 5분 남향 풀옵션 복층 원룸 (주차 가능)',
      location: {
        address: '서울특별시 관악구 신림동 1422-15 신림 푸르지오 오피스텔 1203호',
        latitude: 37.4842,
        longitude: 126.9297,
      },
    },
  },
};
