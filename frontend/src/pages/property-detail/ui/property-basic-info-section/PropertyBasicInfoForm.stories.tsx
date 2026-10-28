import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { fn } from 'storybook/test';

import type { PropertyDetail } from '@/features/property/model/Property';

import PropertyBasicInfoForm from './PropertyBasicInfoForm';

const property: PropertyDetail = {
  propertyId: 10,
  name: '햇살 좋은 원룸',
  depositAmount: 10_000_000,
  monthlyRentAmount: 550_000,
  discoverySource: { type: 'TEXT', value: '신림역 행복공인중개사' },
  location: { address: '서울 관악구 신림로 123', latitude: 37.4842, longitude: 126.9297 },
  availableMoveInDate: '2026-11-15',
  maintenanceFeeAmount: 70_000,
  visitScheduledAt: '2026-10-30T18:30:00',
  roomOptions: ['AIR_CONDITIONER', 'REFRIGERATOR', 'WASHING_MACHINE', 'BED'],
  utilityOptions: ['WATER', 'INTERNET'],
  photoPreview: { totalCount: 0, photos: [] },
  createdAt: '2026-10-20T14:30:00',
  updatedAt: '2026-10-27T10:00:00',
};

const meta = {
  title: '페이지/매물 상세/PropertyBasicInfoForm',
  component: PropertyBasicInfoForm,
  argTypes: {
    property: { control: 'object', description: '폼 초기값으로 쓰는 매물 상세 데이터. JSON으로 값을 바꿔 볼 수 있다.' },
    onSaved: { description: '저장 요청이 성공하면 부른다.' },
  },
  args: {
    property,
    onSaved: fn(),
  },
  decorators: [
    (Story) => (
      <div style={{ width: '24rem' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PropertyBasicInfoForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithoutLocation: Story = {
  args: {
    property: { ...property, location: { address: null, latitude: null, longitude: null } },
  },
};
