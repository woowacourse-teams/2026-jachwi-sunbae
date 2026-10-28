import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { ApiError } from '@/features/auth/api/apiClient';

import RecordLoadError from './RecordLoadError';

const meta = {
  title: '페이지/본 방 기록/RecordLoadError',
  component: RecordLoadError,
  args: {
    error: new ApiError({ kind: 'network' }),
    onRetry: () => undefined,
  },
  argTypes: {
    error: { control: false },
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
    error: new ApiError({ kind: 'server', status: 500 }),
  },
};

export const InvalidPageRequest: Story = {
  args: {
    error: new ApiError({ kind: 'server', status: 400, code: 'INVALID_PAGE_REQUEST' }),
  },
};
