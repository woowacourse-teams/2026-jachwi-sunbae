import type { Meta, StoryObj } from '@storybook/react-webpack5';

import type { PropertyDetail } from '@/features/property/model/Property';

import PropertyAdditionalInfoForm from './PropertyAdditionalInfoForm';

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
  title: '페이지/매물 메모/PropertyAdditionalInfoForm',
  component: PropertyAdditionalInfoForm,
  argTypes: {
    layout: {
      control: 'select',
      options: ['page', 'sheet'],
    },
  },
  args: {
    property,
    onSaved: () => undefined,
  },
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof PropertyAdditionalInfoForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Page: Story = {};

export const Sheet: Story = {
  args: {
    layout: 'sheet',
  },
};

export const Empty: Story = {
  args: {
    property: {
      ...property,
      availableMoveInDate: null,
      maintenanceFeeAmount: null,
      visitScheduledAt: null,
      roomOptions: [],
      utilityOptions: [],
      discoverySource: { type: 'TEXT', value: '' },
    },
  },
};
