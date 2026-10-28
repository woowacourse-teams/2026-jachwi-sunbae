import type { Meta, StoryObj } from '@storybook/react-webpack5';

import type { usePropertyMemo } from '@/features/property/api/useProperties';

import PropertyMemoContent from './PropertyMemoContent';

type PropertyMemoQuery = ReturnType<typeof usePropertyMemo>;

/** 화면이 읽는 조회 상태만 채운 표본 메모 쿼리. */
const createMemoQuery = (overrides: Partial<Record<keyof PropertyMemoQuery, unknown>>): PropertyMemoQuery =>
  ({
    data: { propertyId: 10, freeMemo: '창문이 남향이라 낮에 밝음. 화장실 환풍기 소리가 조금 큼.' },
    isPending: false,
    isError: false,
    error: null,
    refetch: () => Promise.resolve(),
    ...overrides,
  }) as unknown as PropertyMemoQuery;

const meta = {
  title: '페이지/매물 상세/PropertyMemoContent',
  component: PropertyMemoContent,
  argTypes: {
    memo: { control: false },
    triggerRef: { control: false },
  },
  args: {
    memo: createMemoQuery({}),
    triggerRef: { current: null },
    onEdit: () => undefined,
  },
  decorators: [
    (Story) => (
      <div style={{ width: '24rem' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PropertyMemoContent>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: {
    memo: createMemoQuery({ data: { propertyId: 10, freeMemo: '' } }),
  },
};

export const Loading: Story = {
  args: {
    memo: createMemoQuery({ data: undefined, isPending: true }),
  },
};

export const WithError: Story = {
  args: {
    memo: createMemoQuery({ data: undefined, isError: true, error: new Error('Network Error') }),
  },
};
