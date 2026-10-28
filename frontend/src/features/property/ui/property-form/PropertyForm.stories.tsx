import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { fn } from 'storybook/test';

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
    onSubmit: fn(),
  },
  argTypes: {
    initialValues: {
      control: 'object',
      description: '폼 처음 값. 폼이 처음 그릴 때만 읽으므로 고친 뒤에는 스토리를 다시 열어야 반영된다.',
    },
    submitLabel: { description: '제출 버튼 문구' },
    isSubmitting: { description: '저장 중. 제출 버튼이 로딩 상태가 된다.' },
    mutationError: { control: false, description: '서버 오류. 폼 아래 오류 안내가 붙는다.' },
    formNotice: { control: 'text', description: '제출 버튼 위 안내 문구' },
    variant: {
      control: 'inline-radio',
      options: ['default', 'detail'],
      description: '상세 화면용은 칸 모양이 바뀌고 확인한 곳을 여러 줄로 받는다.',
    },
    mode: {
      control: 'inline-radio',
      options: ['default', 'registration'],
      description: '등록 화면은 주소·확인한 곳 칸을 빼고 금액을 필수로 받는다.',
    },
    embedded: { description: '다른 화면 안에 넣을 때 제출 버튼을 아래 고정 영역 대신 폼 끝에 둔다.' },
    onSubmit: { description: '제출할 때. 서버로 보낼 값과 폼 값을 넘긴다.' },
    onSelectLocation: { description: '주소 칸의 지도에서 고르기를 눌렀을 때. 없으면 버튼을 그리지 않는다.' },
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
    onSelectLocation: fn(),
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
    onSelectLocation: fn(),
  },
};

export const WithMutationError: Story = {
  args: {
    mutationError: new ApiError({ kind: 'server', status: 400, invalidFields: ['name'] }),
    formNotice: '주소는 지도에서 위치를 고르면 자동으로 채워져요.',
  },
};
