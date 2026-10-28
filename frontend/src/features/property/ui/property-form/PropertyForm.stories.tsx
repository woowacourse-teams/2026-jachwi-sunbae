import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { ApiError } from '@/features/auth/api/apiClient';

import PropertyForm from './PropertyForm';

const meta = {
  title: '기능/매물/PropertyForm',
  component: PropertyForm,
  args: {
    initialValues: {
      name: '햇살 좋은 원룸',
      depositAmount: '1,000',
      monthlyRentAmount: '55',
      discoverySource: '직방 앱',
      address: '서울 관악구 신림로 330',
      latitude: null,
      longitude: null,
    },
    submitLabel: '저장하기',
    isSubmitting: false,
    mutationError: null,
    embedded: true,
    onSubmit: () => undefined,
  },
  argTypes: {
    initialValues: { control: false },
    mutationError: { control: false },
  },
  decorators: [
    (Story) => (
      <div style={{ width: '24rem' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PropertyForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onSelectLocation: () => undefined,
  },
};

export const Registration: Story = {
  args: {
    initialValues: { name: '', depositAmount: '', monthlyRentAmount: '', discoverySource: '' },
    submitLabel: '매물 등록하기',
    mode: 'registration',
  },
};

export const DetailVariant: Story = {
  args: {
    variant: 'detail',
    initialValues: {
      name: '햇살 좋은 원룸',
      depositAmount: '1,000',
      monthlyRentAmount: '55',
      discoverySource: 'https://example.com/rooms/1422\n중개사 김부동 010-1234-5678',
      address: '서울 관악구 신림로 330',
      latitude: 37.4842,
      longitude: 126.9297,
    },
    onSelectLocation: () => undefined,
  },
};

export const WithMutationError: Story = {
  args: {
    mutationError: new ApiError({ kind: 'server', status: 400, invalidFields: ['name'] }),
    formNotice: '주소는 지도에서 위치를 고르면 자동으로 채워져요.',
  },
};
