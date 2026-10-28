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

const meta = {
  title: '페이지/방 비교/CompareLoadState',
  component: CompareLoadState,
  args: {
    properties: queryState({ isPending: true }),
  },
  argTypes: {
    properties: { control: false },
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
    properties: queryState({ isError: true, error: new ApiError({ kind: 'network' }) } as Partial<PropertyListQuery>),
  },
};
