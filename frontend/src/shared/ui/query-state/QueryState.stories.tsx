import type { Meta, StoryObj } from '@storybook/react-webpack5';
import type { ComponentProps } from 'react';
import { Link } from 'react-router-dom';
import { fn } from 'storybook/test';

import QueryState from './QueryState';

type SampleProperty = { name: string; address: string };

/** 오류 화면에 함께 둘 동작. 값은 이름으로 두고 그릴 때 요소로 바꾼다. */
const errorActions = {
  없음: undefined,
  '홈 링크': (
    <Link to="/" className="inline-button">
      홈으로 돌아가기
    </Link>
  ),
};

/**
 * `query`·`describeError`·`children`은 함수와 객체라 패널에서 바꿀 수 없다.
 * 그래서 조회 상태와 오류 문구를 스토리 전용 값으로 받아 그 값들을 만들어 넘긴다.
 */
type QueryStateStoryArgs = ComponentProps<typeof QueryState> & {
  status: 'success' | 'pending' | 'error';
  data: SampleProperty;
  errorTitle: string;
  errorDescription: string;
  canRetry: boolean;
  refetch: () => void;
};

const meta: Meta<QueryStateStoryArgs> = {
  title: '공용/QueryState',
  component: QueryState,
  argTypes: {
    query: { table: { disable: true } },
    describeError: { table: { disable: true } },
    children: { table: { disable: true } },
    status: {
      control: 'inline-radio',
      options: ['success', 'pending', 'error'],
      description: '(스토리 전용) 조회 상태. `query`의 isPending·isError·data를 이 값으로 만든다.',
    },
    data: { control: 'object', description: '(스토리 전용) 조회에 성공했을 때 받은 데이터' },
    errorTitle: { control: 'text', description: '(스토리 전용) `describeError`가 돌려줄 오류 제목' },
    errorDescription: { control: 'text', description: '(스토리 전용) `describeError`가 돌려줄 오류 설명' },
    canRetry: { control: 'boolean', description: '(스토리 전용) 다시 시도 버튼을 보여 줄지' },
    refetch: { control: false, description: '(스토리 전용) 다시 시도를 누르면 부르는 `query.refetch`' },
    loadingTitle: { description: '로딩 중에 보여 줄 문구' },
    errorAction: { control: 'inline-radio', options: Object.keys(errorActions), mapping: errorActions },
  },
  args: {
    status: 'success',
    loadingTitle: '매물 정보를 불러오는 중이에요.',
    data: { name: '햇살 좋은 원룸', address: '서울 관악구 신림로 123' },
    errorTitle: '매물 정보를 불러오지 못했어요.',
    errorDescription: '네트워크 연결을 확인한 뒤 다시 시도해 주세요.',
    canRetry: true,
    errorAction: '없음',
    refetch: fn(),
  },
  render: ({ status, data, errorTitle, errorDescription, canRetry, refetch, loadingTitle, errorAction }) => (
    <QueryState
      query={{
        isPending: status === 'pending',
        isError: status === 'error',
        error: status === 'error' ? new Error('Network Error') : null,
        data: status === 'success' ? data : undefined,
        refetch,
      }}
      loadingTitle={loadingTitle}
      describeError={() => ({ title: errorTitle, description: errorDescription, canRetry })}
      errorAction={errorAction}
    >
      {(property) => (
        <section style={{ padding: '1.5rem' }}>
          <h2>{property.name}</h2>
          <p>{property.address}</p>
        </section>
      )}
    </QueryState>
  ),
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<QueryStateStoryArgs>;

export const Success: Story = {};

export const Loading: Story = {
  args: { status: 'pending' },
};

export const WithError: Story = {
  args: { status: 'error' },
};

export const NotRetryable: Story = {
  args: {
    status: 'error',
    errorTitle: '매물을 찾을 수 없어요.',
    errorDescription: '이미 삭제된 매물일 수 있어요.',
    canRetry: false,
    errorAction: '홈 링크',
  },
};
