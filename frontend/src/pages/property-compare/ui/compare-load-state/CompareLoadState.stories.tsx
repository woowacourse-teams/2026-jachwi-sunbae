import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { ApiError } from '@/features/auth/api/apiClient';
import type { usePropertyList } from '@/features/property/api/useProperties';

import CompareLoadState from './CompareLoadState';

type PropertyListQuery = ReturnType<typeof usePropertyList>;

/** 이 컴포넌트는 조회 결과 중 불러오는 중·실패·다시 시도만 읽으므로 그 값만 채운 표본을 넘긴다. */
const queryState = (state: Partial<PropertyListQuery>) =>
  ({
    isPending: false,
    isError: false,
    error: null,
    refetch: () => Promise.resolve(),
    ...state,
  }) as unknown as PropertyListQuery;

/** 컨트롤에서 고를 수 있는 조회 상태. 고른 이름이 위 표본으로 바뀌어 넘어간다. */
const states = {
  loading: queryState({ isPending: true }),
  error: queryState({ isError: true, error: new ApiError({ kind: 'network' }) } as Partial<PropertyListQuery>),
  serverError: queryState({
    isError: true,
    error: new ApiError({ kind: 'server', status: 500 }),
  } as Partial<PropertyListQuery>),
  done: queryState({}),
};

/** args에는 상태 이름을 넣고, 그리기 직전에 `mapping`이 실제 조회 결과로 바꾼다. */
const stateArg = (name: keyof typeof states) => name as unknown as PropertyListQuery;

const meta = {
  title: '페이지/방 비교/공통/CompareLoadState',
  component: CompareLoadState,
  args: {
    properties: stateArg('loading'),
  },
  argTypes: {
    properties: {
      control: 'select',
      options: Object.keys(states),
      mapping: states,
      description: '매물 목록 조회 상태. 불러오는 중·실패가 아니면(done) 아무것도 그리지 않는다.',
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: '24rem' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CompareLoadState>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Loading: Story = {};

export const WithError: Story = {
  args: {
    properties: stateArg('error'),
  },
};
