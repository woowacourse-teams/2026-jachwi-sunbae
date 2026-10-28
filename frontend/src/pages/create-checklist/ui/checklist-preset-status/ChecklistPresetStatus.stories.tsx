import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { fn } from 'storybook/test';

import { ApiError } from '@/features/auth/api/apiClient';
import type { useChecklistPreset } from '@/features/checklist/api/useChecklists';

import ChecklistPresetStatus from './ChecklistPresetStatus';

type ChecklistPresetQuery = ReturnType<typeof useChecklistPreset>;

/** 화면이 읽는 조회 상태만 채운 표본 프리셋 쿼리. */
const createPresetQuery = (overrides: Partial<Record<keyof ChecklistPresetQuery, unknown>>): ChecklistPresetQuery =>
  ({
    data: undefined,
    isPending: true,
    isError: false,
    error: null,
    refetch: fn(() => Promise.resolve()).mockName('preset.refetch'),
    ...overrides,
  }) as unknown as ChecklistPresetQuery;

const meta = {
  title: '페이지/체크리스트 만들기/ChecklistPresetStatus',
  component: ChecklistPresetStatus,
  argTypes: {
    preset: {
      control: false,
      description:
        '프리셋 조회 결과(useChecklistPreset). 불러오는 중이면 안내를, 실패하면 오류와 다시 시도 버튼을 보여 준다.',
    },
  },
  args: {
    preset: createPresetQuery({}),
  },
  decorators: [
    (Story) => (
      <div style={{ width: '24rem' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ChecklistPresetStatus>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Loading: Story = {};

export const WithError: Story = {
  args: {
    preset: createPresetQuery({
      isPending: false,
      isError: true,
      error: new ApiError({ kind: 'server', status: 404, code: 'CHECKLIST_PRESET_NOT_FOUND' }),
    }),
  },
};
