import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { fn } from 'storybook/test';

import { ApiError } from '@/features/auth/api/apiClient';

import RecordLoadError from './RecordLoadError';

/** 컨트롤에서 고를 수 있는 대표 오류. 고른 이름이 실제 `ApiError`로 바뀌어 넘어간다. */
const errors = {
  network: new ApiError({ kind: 'network' }),
  server500: new ApiError({ kind: 'server', status: 500 }),
  invalidPage: new ApiError({ kind: 'server', status: 400, code: 'INVALID_PAGE_REQUEST' }),
  unknown: new Error('알 수 없는 오류'),
};

const meta = {
  title: '페이지/본 방 기록/공통/RecordLoadError',
  component: RecordLoadError,
  args: {
    error: 'network',
    onRetry: fn(),
  },
  argTypes: {
    error: {
      control: 'select',
      options: Object.keys(errors),
      mapping: errors,
      description: '목록 조회 실패 오류. 종류에 따라 안내 문구가 달라진다.',
    },
    onRetry: { description: '다시 시도 버튼을 누르면 부른다.' },
  },
  decorators: [
    (Story) => (
      <div style={{ width: '24rem' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof RecordLoadError>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ServerError: Story = {
  args: {
    error: 'server500',
  },
};

export const InvalidPageRequest: Story = {
  args: {
    error: 'invalidPage',
  },
};
