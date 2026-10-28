import type { Meta, StoryObj } from '@storybook/react-webpack5';

import QueryState from './QueryState';

type SampleProperty = { name: string; address: string };

const sampleProperty: SampleProperty = { name: '햇살 좋은 원룸', address: '서울 관악구 신림로 123' };

const describeError = () => ({
  title: '매물 정보를 불러오지 못했어요.',
  description: '네트워크 연결을 확인한 뒤 다시 시도해 주세요.',
  canRetry: true,
});

const meta = {
  title: '공용/QueryState',
  component: QueryState,
  argTypes: {
    query: { control: false },
    children: { control: false },
    errorAction: { control: false },
  },
  args: {
    loadingTitle: '매물 정보를 불러오는 중이에요.',
    describeError,
    query: {
      isPending: false,
      isError: false,
      error: null,
      data: sampleProperty,
      refetch: () => undefined,
    },
    children: (data) => {
      const property = data as SampleProperty;
      return (
        <section style={{ padding: '1.5rem' }}>
          <h2>{property.name}</h2>
          <p>{property.address}</p>
        </section>
      );
    },
  },
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof QueryState>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Success: Story = {};

export const Loading: Story = {
  args: {
    query: { isPending: true, isError: false, error: null, data: undefined, refetch: () => undefined },
  },
};

export const WithError: Story = {
  args: {
    query: {
      isPending: false,
      isError: true,
      error: new Error('Network Error'),
      data: undefined,
      refetch: () => undefined,
    },
  },
};

export const NotRetryable: Story = {
  args: {
    query: {
      isPending: false,
      isError: true,
      error: new Error('Not Found'),
      data: undefined,
      refetch: () => undefined,
    },
    describeError: () => ({
      title: '매물을 찾을 수 없어요.',
      description: '이미 삭제된 매물일 수 있어요.',
      canRetry: false,
    }),
    errorAction: <a href="/">홈으로 돌아가기</a>,
  },
};
